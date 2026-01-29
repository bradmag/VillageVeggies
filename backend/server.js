const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const path = require('path');

// Load .env in development if present (optional dependency)
try { require('dotenv').config(); } catch (e) {}

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

