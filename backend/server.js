const express = require('express');
const app = express();

app.use(express.json());

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
    password: "VillagePassword123",
    port: 5432,
})