const getHome = (req, res) => {
  res.status(200).json({
    message: 'Welcome to Madarsa Islamia e Darul Huda API',
    status: 'OK',
  });
};

module.exports = {
  getHome,
};