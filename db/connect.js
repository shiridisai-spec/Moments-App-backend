const { Pool } = require("pg");
require("dotenv").config(); // Specify the path to the .env file explicitly

const isProduction = process.env.NODE_ENV === "production";
const dbConfig = isProduction
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

// Create a pool for database connection
const pool = new Pool(dbConfig);

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
