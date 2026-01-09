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
    user: "villageveggies_dev",
    host: "127.0.0.1",
    database: "villageveggies",
    password: "TempPass123",
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

        // Convert to string for SQL query
        const searchZip = String(userZip);

        // Get active listings from other users matching the ZIP code
        // Join with users table to get grower name
<<<<<<< HEAD
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
            WHERE l.zip::text LIKE $1 || '%'
                AND l.user_id != $2 
                AND l.status = 'active'
            ORDER BY l.created_at DESC
        `;
        const listingsResult = await pool.query(listingsQuery, [userZip, userId]);
=======
        // If searchZip is numeric (all digits), search by ZIP prefix match
        // Otherwise, search by title
        const isNumericZip = /^[0-9]+$/.test(searchZip);
        
        let listingsQuery;
        let queryParams;
        
        if (isNumericZip) {
            // Search by ZIP code prefix match
            listingsQuery = `
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
                WHERE l.zip::text LIKE $1 || '%'
                    AND l.user_id != $2 
                    AND l.status = 'active'
                ORDER BY l.created_at DESC
            `;
            queryParams = [searchZip, userId];
        } else {
            // Search by title
            listingsQuery = `
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
                WHERE l.title ILIKE '%' || $1 || '%'
                    AND l.user_id != $2 
                    AND l.status = 'active'
                ORDER BY l.created_at DESC
            `;
            queryParams = [searchZip, userId];
        }
        
        const listingsResult = await pool.query(listingsQuery, queryParams);
>>>>>>> 2a9042140737c0d0c27c67c4a43245af0dfcb3f6

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

// Reveal grower contact information (protected route)
// Returns grower contact info - tracking can be added here later
// MUST be before /api/crops/:id route to match correctly
app.post('/api/crops/:id/reveal-contact', requireAuth, async (req, res) => {
    try {
        const cropId = parseInt(req.params.id, 10);
        
        if (isNaN(cropId)) {
            return res.status(400).json({ error: 'Invalid crop ID' });
        }

        // Verify crop exists and is active
        const cropQuery = `
            SELECT l.id, l.user_id, l.status
            FROM listings l
            WHERE l.id = $1 AND l.status = 'active'
        `;
        const cropResult = await pool.query(cropQuery, [cropId]);

        if (cropResult.rows.length === 0) {
            return res.status(404).json({ error: 'Crop not found' });
        }

        const crop = cropResult.rows[0];
        const growerId = crop.user_id;

        // Get grower contact information
        const growerQuery = 'SELECT contact FROM users WHERE id = $1';
        const growerResult = await pool.query(growerQuery, [growerId]);

        if (growerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Grower not found' });
        }

        const contactText = growerResult.rows[0].contact || 'Contact information not available';

        // TODO: Add tracking/analytics here to track website activity

        res.json({
            contactText: contactText
        });

    } catch (err) {
        console.error('Error revealing contact:', err);
        res.status(500).json({ error: 'Failed to reveal contact' });
    }
});

// Get single crop/listing by ID (protected route)
// Returns crop details and grower information (without contact info)
app.get('/api/crops/:id', requireAuth, async (req, res) => {
    try {
        const cropId = parseInt(req.params.id, 10);
        console.log('GET /api/crops/:id - cropId:', cropId);
        
        if (isNaN(cropId)) {
            return res.status(400).json({ error: 'Invalid crop ID' });
        }

        // Get crop listing with grower information
        // Join with users table to get grower details (excluding contact)
        const query = `
            SELECT 
                l.id,
                l.title,
                l.price,
                l.quantity,
                l.harvest_date,
                l.zip,
                l.growing_method,
                l.notes,
                l.status,
                l.created_at,
                u.id as grower_id,
                u.name as grower_name,
                u.zip as grower_zip,
                u.blurb as grower_blurb
            FROM listings l
            JOIN users u ON l.user_id = u.id
            WHERE l.id = $1 AND l.status = 'active'
        `;
        
        const result = await pool.query(query, [cropId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Crop not found' });
        }

        const listing = result.rows[0];

        // Format the response
        res.json({
            crop: {
                id: listing.id,
                title: listing.title,
                price: listing.price,
                quantity: listing.quantity,
                harvestDate: listing.harvest_date,
                zip: listing.zip,
                growingMethod: listing.growing_method,
                description: listing.notes,
                status: listing.status,
                createdAt: listing.created_at
            },
            grower: {
                id: listing.grower_id,
                name: listing.grower_name,
                zip: listing.grower_zip,
                blurb: listing.grower_blurb
            }
        });

    } catch (err) {
        console.error('Error fetching crop:', err);
        res.status(500).json({ error: 'Failed to fetch crop' });
    }
});
