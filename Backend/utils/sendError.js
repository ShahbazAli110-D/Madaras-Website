const sendError = (res, error) => {
  const statusCode = error.status || 500;
  const message = statusCode === 503
    ? error.message
    : statusCode >= 500
      ? 'Internal server error.'
      : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({ error: message });
};

module.exports = sendError;
