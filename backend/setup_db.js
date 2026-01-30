// database/setup_db.js
// Script to set up the PostgreSQL database for VillageVeggies (MVP)

const { Client } = require("pg");
const bcrypt = require('bcrypt');

// Load environment variables from backend/.env during development if available
const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) {}

// Database connection info should come from environment variables.
// Provide safe defaults for host/port/name/user, but DO NOT hardcode passwords here.
const DB_NAME = process.env.DB_NAME || "villageveggies";
const DB_USER = process.env.DB_USER || "villageveggies_dev";
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT) || 5432;

// Optional admin credentials (useful when creating the DB with a superuser)
const ADMIN_DB_USER = process.env.ADMIN_DB_USER || null;
const ADMIN_DB_PASSWORD = process.env.ADMIN_DB_PASSWORD || null;

// Require at least one set of credentials to be present for setup (admin or DB user)
if (!DB_PASSWORD && !ADMIN_DB_PASSWORD) {
  console.error('Missing DB password. Set DB_PASSWORD for the application user or ADMIN_DB_PASSWORD for a superuser in backend/.env.');
  process.exit(1);
}

// Connect to the default 'postgres' database to create the new database if needed
async function setupDatabase() {
  // Use admin creds if provided (allows creating DB and roles), otherwise use app DB_USER creds
  const adminUser = ADMIN_DB_USER || DB_USER;
  const adminPass = ADMIN_DB_PASSWORD || DB_PASSWORD;

  const client = new Client({
    user: adminUser,
    host: DB_HOST,
    database: "postgres",
    password: adminPass,
    port: DB_PORT,
  });

  await client.connect();

  const dbExistsQuery = `SELECT 1 FROM pg_database WHERE datname=$1`;
  const result = await client.query(dbExistsQuery, [DB_NAME]);

  if (result.rowCount === 0) {
    console.log(`Database ${DB_NAME} does not exist. Creating...`);
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    console.log(`Database ${DB_NAME} created successfully.`);
  } else {
    console.log(`Database ${DB_NAME} already exists.`);
  }

  // Ensure the application role exists and own the database
  try {
    const safeRole = DB_USER.replace(/"/g, '');
    const roleRes = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [safeRole]);
    if (roleRes.rowCount === 0) {
      if (!DB_PASSWORD) {
        console.warn(`Application role ${safeRole} does not exist and DB_PASSWORD not provided; skipping role creation.`);
      } else {
        console.log(`Creating role ${safeRole}...`);
        await client.query('CREATE ROLE "' + safeRole + '" WITH LOGIN PASSWORD $1', [DB_PASSWORD]);
      }
    }
    // Try to change database owner to the app role (may fail if not permitted)
    try {
      await client.query('ALTER DATABASE "' + DB_NAME.replace(/"/g, '') + '" OWNER TO "' + safeRole + '"');
    } catch (e) {
      // non-fatal
    }
  } catch (e) {
    // best-effort; continue
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

  try {
    await client.query("BEGIN");

    // Drop old tables from previous structure (safe cleanup)
    await client.query(`DROP TABLE IF EXISTS listings CASCADE`);
    await client.query(`DROP TABLE IF EXISTS users CASCADE`);

    // --- SHOPS TABLE ---
    await client.query(`DROP TABLE IF EXISTS shops CASCADE`);
    await client.query(`
      CREATE TABLE shops (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        inventory_updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // --- INVENTORY_ITEMS TABLE ---
    await client.query(`DROP TABLE IF EXISTS inventory_items CASCADE`);
    await client.query(`
      CREATE TABLE inventory_items (
        id SERIAL PRIMARY KEY,
        shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        availability BOOLEAN NOT NULL DEFAULT TRUE,
        quantity INT,
        price_range VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Helpful index for common queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inventory_items_shop_id
      ON inventory_items(shop_id);
    `);

    // --- SESSIONS TABLE (for connect-pg-simple) ---
    await client.query(`DROP TABLE IF EXISTS session CASCADE`);
    await client.query(`
      CREATE TABLE session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
    `);

    await client.query("COMMIT");
    console.log("Tables created successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

// Seed test data for development
async function seedData() {
  const client = new Client({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
  });

  await client.connect();
  console.log(`Connected to database ${DB_NAME} for seeding...`);

  try {
    await client.query("BEGIN");

    // Reset all data + IDs so devs get predictable IDs (shop_id = 1)
    await client.query(`TRUNCATE inventory_items RESTART IDENTITY CASCADE`);
    await client.query(`TRUNCATE shops RESTART IDENTITY CASCADE`);

    // Insert 1 test shop (will be id=1). Seed with email + hashed password for auth.
    const testPassword = 'password123';
    const hashed = await bcrypt.hash(testPassword, 10);

    const shopResult = await client.query(
      `INSERT INTO shops (email, password_hash, name, location) VALUES ($1, $2, $3, $4) RETURNING id`,
      ["seed@shop.local", hashed, "Seed Plant Shop", "Denver, CO"]
    );

    const shopId = shopResult.rows[0].id;
    console.log(`Test shop created with ID: ${shopId} (email: seed@shop.local password: ${testPassword})`);

    // Insert 5 inventory items
    const inventoryItems = [
      { name: "Monstera Deliciosa", availability: true, quantity: 15, price_range: "$25 - $35" },
      { name: "Snake Plant", availability: true, quantity: 30, price_range: "$15 - $25" },
      { name: "Pothos Golden", availability: true, quantity: null, price_range: "$10 - $15" },
      { name: "Fiddle Leaf Fig", availability: false, quantity: 0, price_range: "$45 - $65" },
      { name: "ZZ Plant", availability: true, quantity: 12, price_range: "$20 - $30" },
    ];

    for (const item of inventoryItems) {
      await client.query(
        `INSERT INTO inventory_items (shop_id, name, availability, quantity, price_range)
         VALUES ($1, $2, $3, $4, $5)`,
        [shopId, item.name, item.availability, item.quantity, item.price_range]
      );
    }

    await client.query("COMMIT");
    console.log("Seed complete: 1 shop + 5 items.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    await setupDatabase();
    await createTables();
    await seedData();
    console.log("Database setup complete with test data.");
  } catch (err) {
    console.error("Error setting up database:", err);
    process.exitCode = 1;
  }
}

main();
