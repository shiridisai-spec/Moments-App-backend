const { Pool } = require("pg");
require("dotenv").config(); // Specify the path to the .env file explicitly

// Create a pool for database connection
const pool = new Pool({
  user: process.env.DB_USER, // Your PostgreSQL username
  host: process.env.DB_HOST, // Database host
  database: process.env.DB_DATABASE, // Your database name
  password: process.env.DB_PASSWORD, // Your PostgreSQL password
  port: process.env.DB_PORT, // PostgreSQL default port
});

// Test the database connection
const testConnection = async () => {
  try {
    const client = await pool.connect(); // Get a client from the pool
    console.log("Connected to the database successfully");
    client.release(); // Release the client back to the pool
  } catch (err) {
    console.error("Database connection error:", err.stack);
  }
};

// Call the test connection function
testConnection();

// Export the pool and connection function
module.exports = {
  pool,
};
