const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const path = require('path');

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

const pool = new Pool({
    user: "postgres",
    host: "127.0.0.1",
    database: "villageveggies",
    password: "Marchingon$4!",
    port: 5432,
})

// Handle database connection errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});


// Register endpoint
app.post('/auth/register', async (req, res) => {
    // Extract user details from the JSON request body
    const { email, password, name, zip, blurb, contact } = req.body;

    // Validate required fields exist
    if (!email || !password || !name || !zip || !contact) {
        return res.status(400).send('Missing required fields');
    }


    try {
        // Hash the password before storing (never store plain text passwords)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Build the INSERT SQL query
        const query = `
            INSERT INTO users (email, password_hash, name, zip, blurb, contact)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, name, zip, blurb, contact;
        `;
        // the values *below will be inserted into the $1, $2, etc. placeholders *above
        const values = [email, hashedPassword, name, zip, blurb, contact];
        
        // Execute the query and await for the result
        const result = await pool.query(query, values);

        // Respond with the newly created user details (excluding password)
        res.status(201).json({ 
            message: 'User registered successfully',
            user: result.rows[0] 
        });

    } catch (err) {
        console.error(err);

        if (err.code === '23505') { // Unique violation error code
            return res.status(409).send('Email already registered');
        }

        return res.status(500).send('Registration failed');
    }
});

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
}

// Login endpoint
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        // Fetch the user by email
        const query = 'SELECT id, email, password_hash, name, zip, blurb, contact FROM users WHERE email = $1';
        const values = [email];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid email or password');
        }

        const user = result.rows[0];

        // Compare the provided password with the stored hash
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).send('Invalid email or password');
        }

        // Create session
        req.session.userId = user.id;
        req.session.userEmail = user.email;

        // Successful login
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                zip: user.zip,
                blurb: user.blurb,
                contact: user.contact
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

// Get current user profile (protected route)
app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const userQuery = 'SELECT id, email, name, zip, blurb, contact FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Get user's listings (using the correct table name 'listings')
        const listingsQuery = 'SELECT id, title, price, quantity, harvest_date, zip, status, created_at FROM listings WHERE user_id = $1 ORDER BY created_at DESC';
        const listingsResult = await pool.query(listingsQuery, [userId]);

        res.json({
            user: user,
            listings: listingsResult.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Create new crop/listing endpoint (protected route)
app.post('/api/crops', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { title, price, quantity, harvestDate, zip, growingMethod, notes } = req.body;

        // Validate required fields
        if (!title || !price || !quantity || !harvestDate || !zip) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate zip is a number
        const zipNum = parseInt(zip, 10);
        if (isNaN(zipNum) || zipNum.toString().length !== 5) {
            return res.status(400).json({ error: 'Invalid ZIP code' });
        }

        // Build the INSERT SQL query
        const query = `
            INSERT INTO listings (user_id, title, price, quantity, harvest_date, zip, growing_method, notes, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
            RETURNING id, title, price, quantity, harvest_date, zip, growing_method, notes, status, created_at;
        `;

        const values = [
            userId,
            title,
            price,
            quantity,
            harvestDate,
            zipNum,
            growingMethod || null,
            notes || null
        ];

        // Execute the query
        const result = await pool.query(query, values);

        // Respond with the newly created listing
        res.status(201).json({
            message: 'Crop created successfully',
            listing: result.rows[0]
        });

    } catch (err) {
        console.error('Error creating crop:', err);
        res.status(500).json({ error: 'Failed to create crop' });
    }
});

// Browse crops by ZIP code (protected route)
// Returns active listings from other users in the same ZIP code as the logged-in user
app.get('/api/browse', requireAuth, async (req, res) => {
    try {

        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get the current user's ZIP code
        const userQuery = 'SELECT zip FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userZip = req.query.zip || userResult.rows[0].zip;

        if (!userZip) {
            return res.status(400).json({ error: 'User ZIP code not set' });
        }

        // Get active listings from other users in the same ZIP code
        // Join with users table to get grower name
        const listingsQuery = `
            SELECT 
                l.id, 
                l.title, 
                l.price, 
                l.quantity, 
                l.harvest_date, 
                l.zip, 
                l.status, 
                l.created_at,
                u.name as grower_name
            FROM listings l
            JOIN users u ON l.user_id = u.id
            WHERE (
                ($1 ~ '^[0-9]+$' AND l.zip::text LIKE $1 || '%') 
                OR ($1 !~ '^[0-9]+$' AND l.title ILIKE '%' || $1 || '%')
            )
                AND l.user_id != $2 
                AND l.status = 'active'
            ORDER BY l.created_at DESC
        `;
        const listingsResult = await pool.query(listingsQuery, [userZip, userId]);

        res.json({
            zip: userZip,
            listings: listingsResult.rows
        });

    } catch (err) {
        console.error('Error fetching browse listings:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            detail: err.detail
        });
        res.status(500).json({ 
            error: "Failed to fetch listings",
            details: err.message 
        });
    }
});

