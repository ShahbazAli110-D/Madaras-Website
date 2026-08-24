const madarsaStore = require('../data/madarsaStore');
const sendError = require('../utils/sendError');
const { sendContactEmail } = require('../utils/email');
const {
  validateContactMessagePayload,
  validateStudentPayload,
  validateStudentQuery,
} = require('../utils/validators');

const getPublicBootstrap = async (req, res) => {
  try {
    const data = await madarsaStore.getPublicBootstrap();
    return res.status(200).json(data);
  } catch (error) {
    return sendError(res, error);
  }
};

const searchStudents = async (req, res) => {
  try {
    const { value } = validateStudentQuery(req.query);
    const students = await madarsaStore.searchStudentsPublic(value);
    return res.status(200).json(students);
  } catch (error) {
    return sendError(res, error);
  }
};

const submitAdmission = async (req, res) => {
  try {
    const { error, value } = validateStudentPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const student = await madarsaStore.createAdmission(value);
    return res.status(201).json({
      message: 'Admission submitted successfully.',
      student,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const submitContactMessage = async (req, res) => {
  try {
    const { error, value } = validateContactMessagePayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const siteContent = await madarsaStore.getPublicBootstrap();
    const recipient = siteContent?.siteContent?.contact_email || siteContent?.site_content?.contact_email;

    if (!recipient) {
      const configurationError = new Error('Contact email is not configured.');
      configurationError.status = 503;
      throw configurationError;
    }

    await sendContactEmail({ recipient, ...value });
    return res.status(200).json({ message: 'Your message has been sent successfully.' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getPublicBootstrap,
  searchStudents,
  submitAdmission,
  submitContactMessage,
};
