require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const testRoutes = require('./routes/testRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/', testRoutes);
app.use('/api/students', studentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('MySQL connected successfully.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

startServer();