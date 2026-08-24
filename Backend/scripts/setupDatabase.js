require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

const run = async () => {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  const password = process.env.DB_PASSWORD || '';

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password,
    multipleStatements: true,
  });

  await connection.query(schemaSql);
  await connection.end();

  console.log('Database schema created successfully.');
};

run().catch((error) => {
  console.error('Failed to set up database:', error.message);
  process.exit(1);
});
