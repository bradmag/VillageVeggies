// database/setup_db.js
// Script to set up the PostgreSQL database for Village Veggies
// Run this script with Node.js to create the database and necessary tables

const { Client } = require("pg");

// For MVP, hardcode the connection info
const DB_NAME = "villageveggies";
const DB_USER = "postgres";

// Don't forget to set your actual password here and change back before committing
const DB_PASSWORD = "your_password_here";

const DB_HOST = "127.0.0.1";
const DB_PORT = 5432;

// Connect to the default 'postgres' database to create the new villageveggies database
async function setupDatabase() {
    const client = new Client({
        user: DB_USER,
        host: DB_HOST,
        database: "postgres",
        password: DB_PASSWORD,
        port: DB_PORT,
    });

    const dbExistsQuery = `SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'`;
    const result = await client.query(dbExistsQuery);

    if (result.rowCount === 0) {
        console.log(`Database ${DB_NAME} does not exist. Creating...`);
        await client.query(`CREATE DATABASE ${DB_NAME}`);
        console.log(`Database ${DB_NAME} created successfully.`);
    } else {
        console.log(`Database ${DB_NAME} already exists.`);
    }
    await client.end();
}

// Connect to the new DB and create tables
async function createTables() {
    const client = new Client({
        user: DB_USER,
        host: DB_HOST,
        database: DB_NAME,
        password: DB_PASSWORD,
        port: DB_PORT,
    });

    await client.connect();
    console.log(`Connected to database ${DB_NAME}`);

    // Optional: Drop existing users table
    await client.query(`DROP TABLE IF EXISTS users`);

    const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash NOT NULL,
        name VARCHAR(255) NOT NULL,
        zip INT NOT NULL,
        blurb TEXT,
        contact TEXT,
        created_at DATE DEFAULT CURRENT_DATE
    );`;
await client.query(createUsersTableQuery);
    console.log("Users table created successfully.");

    await client.end();
}

async function main() {
    try {
        await setupDatabase();
        await createTables();
        console.log("Database setup complete.");
    } catch (err) {
        console.error("Error setting up database:", err);
    }
}

main();
