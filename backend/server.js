const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const session = require('express-session');
const app = express();
const path = require('path');
const { EmailClient } = require('@azure/communication-email');

// Load backend/.env in development if present (optional dependency)
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) {}

// Serve the shop template for any shop URL (e.g. /shop/123.html)
app.get('/shop/:shopId.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'shop.html'));
});

app.use(express.static(path.join(__dirname, '..')));

app.use(express.json());

// Session configuration
app.use(session({
    secret: 'villageveggies-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.get("/", (req, res) => {
    res.send("VillageVeggies Server is running");
});

app.listen(3000, () => {
    console.log("Server is listening on http://localhost:3000");
});

const { Pool } = require('pg');

// Read DB connection details from environment variables. Do NOT store passwords in source.
const pool = new Pool({
    user: process.env.DB_USER || 'villageveggies_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'villageveggies',
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});

if (!process.env.DB_PASSWORD) {
    console.warn('Warning: DB_PASSWORD not set in environment. Database connections may fail.');
}

// Handle database connection errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// ACS email helper
async function sendEmail(to, subject, htmlBody) {
    const client = new EmailClient(process.env.ACS_CONNECTION_STRING);
    const message = {
        senderAddress: process.env.ACS_SENDER_EMAIL,
        recipients: { to: [{ address: to }] },
        content: { subject, html: htmlBody }
    };
    const poller = await client.beginSend(message);
    await poller.pollUntilDone();
}

// Register endpoint (creates a shop account)
app.post('/auth/register', async (req, res) => {
    const { email, password, name, location } = req.body;

    if (!email || !password || !name || !location) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO shops (email, password_hash, name, location)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, name, location, created_at;
        `;
        const values = [email, hashedPassword, name, location];

        const result = await pool.query(query, values);

        res.status(201).json({
            message: 'Shop registered successfully',
            shop: result.rows[0]
        });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === '23505') {
            return res.status(409).send('Email already registered');
        }
        return res.status(500).send('Registration failed');
    }
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        const query = 'SELECT id, email, password_hash, name, location FROM shops WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid email or password');
        }

        const shop = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, shop.password_hash);

        if (!passwordMatch) {
            return res.status(401).send('Invalid email or password');
        }

        // Create session
        req.session.shopId = shop.id;
        req.session.shopEmail = shop.email;

        res.status(200).json({
            message: 'Login successful',
            shop: {
                id: shop.id,
                email: shop.email,
                name: shop.name,
                location: shop.location
            }
        });
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).send('Login failed');
    }
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout successful' });
    });
});

// --- Shop API endpoints ---
// Returns shop information and its inventory
app.get('/api/shops/:shopId', async (req, res) => {
    const rawId = req.params.shopId;
    try {
        let shopResult;
        const idNum = Number(rawId);
        if (!Number.isNaN(idNum)) {
            shopResult = await pool.query('SELECT id, name, location, email, created_at FROM shops WHERE id = $1 LIMIT 1', [idNum]);
        } else {
            // Try to match by name or email
            shopResult = await pool.query('SELECT id, name, location, email, created_at FROM shops WHERE name = $1 OR email = $1 LIMIT 1', [rawId]);
        }

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shop = shopResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT id, name, availability, quantity, price_range, created_at, updated_at
             FROM inventory_items
             WHERE shop_id = $1
             ORDER BY updated_at DESC, id ASC`,
            [shop.id]
        );

        const items = itemsResult.rows || [];

        // determine inventory last-updated timestamp
        const lastUpdated = items.length ? items[0].updated_at : null;

        return res.json({ shop, inventory: items, inventoryUpdated: lastUpdated });
    } catch (err) {
        console.error('Error fetching shop data:', err);
        return res.status(500).json({ error: 'Failed to fetch shop data' });
    }
});

// Returns inventory items only for a shop
app.get('/api/shops/:shopId/inventory', async (req, res) => {
    const rawId = req.params.shopId;
    try {
        let shopId;
        const idNum = Number(rawId);
        if (!Number.isNaN(idNum)) {
            shopId = idNum;
        } else {
            const shopResult = await pool.query('SELECT id FROM shops WHERE name = $1 OR email = $1 LIMIT 1', [rawId]);
            if (shopResult.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
            shopId = shopResult.rows[0].id;
        }

        const itemsResult = await pool.query(
            `SELECT id, name, availability, quantity, price_range, created_at, updated_at
             FROM inventory_items
             WHERE shop_id = $1
             ORDER BY updated_at DESC, id ASC`,
            [shopId]
        );

        return res.json(itemsResult.rows || []);
    } catch (err) {
        console.error('Error fetching inventory:', err);
        return res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// POST /auth/forgot-password — always returns generic 200 to prevent email enumeration
app.post('/auth/forgot-password', async (req, res) => {
    const genericResponse = { message: "If that email is registered, you'll receive a reset link." };
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    // Always respond generically; internal errors are swallowed silently
    try {
        const shopResult = await pool.query('SELECT id, email FROM shops WHERE email = $1 LIMIT 1', [email]);
        if (shopResult.rows.length === 0) {
            return res.status(200).json(genericResponse);
        }

        const shop = shopResult.rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        await pool.query(
            'INSERT INTO password_reset_tokens (shop_id, token, expires_at) VALUES ($1, $2, $3)',
            [shop.id, token, expiresAt]
        );

        const resetLink = `${process.env.APP_BASE_URL}/reset-password.html?token=${token}`;
        const htmlBody = `
            <p>You requested a password reset for your VillageVeggies account.</p>
            <p><a href="${resetLink}">Click here to reset your password</a></p>
            <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
        `;

        await sendEmail(shop.email, 'VillageVeggies — Reset your password', htmlBody);
    } catch (err) {
        console.error('Error in forgot-password flow:', err);
        // Fall through — still return generic 200
    }

    return res.status(200).json(genericResponse);
});

// GET /auth/reset-password/:token — validate token before showing the form
app.get('/auth/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const result = await pool.query(
            `SELECT id FROM password_reset_tokens
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
        }
        return res.status(200).json({ valid: true });
    } catch (err) {
        console.error('Error validating reset token:', err);
        return res.status(500).json({ error: 'Failed to validate token.' });
    }
});

// POST /auth/reset-password/:token — apply new password
// Known limitation: existing sessions for the shop are NOT invalidated because sessions are in-memory.
app.post('/auth/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Both password fields are required.' });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const client = await pool.connect();
    try {
        const tokenResult = await client.query(
            `SELECT id, shop_id FROM password_reset_tokens
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );
        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
        }

        const { id: tokenId, shop_id: shopId } = tokenResult.rows[0];
        const passwordHash = await bcrypt.hash(newPassword, 10);

        await client.query('BEGIN');
        await client.query('UPDATE shops SET password_hash = $1 WHERE id = $2', [passwordHash, shopId]);
        await client.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenId]);
        await client.query('COMMIT');

        // Send confirmation email (fire-and-forget; don't block response on failure)
        try {
            const shopResult = await pool.query('SELECT email FROM shops WHERE id = $1', [shopId]);
            if (shopResult.rows.length > 0) {
                await sendEmail(
                    shopResult.rows[0].email,
                    'VillageVeggies — Password changed',
                    '<p>Your VillageVeggies password was just changed. If this was not you, please contact support immediately.</p>'
                );
            }
        } catch (emailErr) {
            console.error('Failed to send password-change confirmation email:', emailErr);
        }

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Error resetting password:', err);
        return res.status(500).json({ error: 'Failed to reset password.' });
    } finally {
        client.release();
    }
});

// ---- Auth middleware ----
function requireAuth(req, res, next) {
    if (!req.session || !req.session.shopId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// GET /api/dashboard/profile — returns the logged-in shop's profile
app.get('/api/dashboard/profile', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, location, email FROM shops WHERE id = $1',
            [req.session.shopId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// GET /api/dashboard/inventory/items — returns all items for the logged-in shop
app.get('/api/dashboard/inventory/items', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, availability, quantity, price_range, created_at, updated_at
             FROM inventory_items WHERE shop_id = $1 ORDER BY created_at ASC`,
            [req.session.shopId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// POST /api/dashboard/inventory/items — adds a new inventory item
app.post('/api/dashboard/inventory/items', requireAuth, async (req, res) => {
    const { name, price_range, quantity, availability } = req.body;
    if (!name) return res.status(400).send('Item name is required');
    try {
        const result = await pool.query(
            `INSERT INTO inventory_items (shop_id, name, price_range, quantity, availability)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.session.shopId, name, price_range || null, quantity != null ? quantity : null, availability ?? true]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding item:', err);
        res.status(500).send('Failed to add item');
    }
});

// PATCH /api/dashboard/inventory/items/:itemId — updates an inventory item
app.patch('/api/dashboard/inventory/items/:itemId', requireAuth, async (req, res) => {
    const itemId = parseInt(req.params.itemId, 10);
    const { name, price_range, quantity, availability } = req.body;
    try {
        const result = await pool.query(
            `UPDATE inventory_items
             SET name = COALESCE($1, name),
                 price_range = $2,
                 quantity = $3,
                 availability = $4,
                 updated_at = NOW()
             WHERE id = $5 AND shop_id = $6
             RETURNING *`,
            [name || null, price_range || null, quantity != null ? quantity : null, availability ?? true, itemId, req.session.shopId]
        );
        if (result.rows.length === 0) return res.status(404).send('Item not found');
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(500).send('Failed to update item');
    }
});

// DELETE /api/dashboard/inventory/items/:itemId — removes an inventory item
app.delete('/api/dashboard/inventory/items/:itemId', requireAuth, async (req, res) => {
    const itemId = parseInt(req.params.itemId, 10);
    try {
        const result = await pool.query(
            'DELETE FROM inventory_items WHERE id = $1 AND shop_id = $2 RETURNING id',
            [itemId, req.session.shopId]
        );
        if (result.rows.length === 0) return res.status(404).send('Item not found');
        res.status(204).end();
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).send('Failed to delete item');
    }
});

// Public index endpoint: list shops for the homepage
app.get('/api/index/shops', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, location, inventory_updated_at
             FROM shops
             ORDER BY name ASC`
        );
        res.json(result.rows || []);
    } catch (err) {
        console.error('Error fetching index shops:', err);
        res.status(500).json({ error: 'Failed to fetch shops' });
    }
});

