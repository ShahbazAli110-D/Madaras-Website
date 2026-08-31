const nodemailer = require('nodemailer');

let transporter;

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const isEmailConfigured = () => Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
);

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!isEmailConfigured()) {
    const configurationError = new Error('Email service is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in your deployment environment.');
    configurationError.status = 503;
    throw configurationError;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
};

const sendMail = async (mailOptions) => getTransporter().sendMail(mailOptions);

const sendContactEmail = async ({ recipient, name, email, message }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  return sendMail({
    from,
    to: recipient,
    replyTo: email,
    subject: `Contact message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p>${safeMessage}</p>`,
  });
};

const sendPasswordResetEmail = async ({ recipient, resetLink }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const safeLink = escapeHtml(resetLink);

  return sendMail({
    from,
    to: recipient,
    subject: 'Password reset request',
    text: `Use this link to reset your password: ${resetLink}`,
    html: `<p>You requested a password reset.</p><p><a href="${safeLink}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
};

module.exports = {
  isEmailConfigured,
  sendContactEmail,
  sendPasswordResetEmail,
};
