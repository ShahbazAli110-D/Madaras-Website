const { useInMemoryDb } = require('../data/madarsaStore');

const getHealth = (req, res) => {
  res.status(200).json({
    message: 'Madarsa management API is running.',
    mode: useInMemoryDb ? 'in-memory' : 'mysql',
    status: 'OK',
  });
};

module.exports = {
  getHealth,
};
