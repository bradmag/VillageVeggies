const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, '..')));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("VillageVeggies Server is running");
});

app.listen(3000, () => {
    console.log("Server is listening on http://localhost:3000");
});

const { Pool } = require('pg');

const pool = new Pool({
    user: "villageveggie",
    host: "127.0.0.1",
    database: "villageveggies",
    password: "VillagePassword123",
    port: 5432,
})


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