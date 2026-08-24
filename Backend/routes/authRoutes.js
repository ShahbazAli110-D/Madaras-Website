const express = require('express');
const {
  forgotPassword,
  getCurrentUser,
  loginHead,
  loginTeacher,
  resetHeadAccount,
  resetPassword,
  signupHead,
  signupTeacher,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/admin/login', loginHead);
router.post('/head/login', loginHead);
router.post('/head/signup', signupHead);
router.post('/head/reset', resetHeadAccount);
router.post('/teacher/login', loginTeacher);
router.post('/teacher/signup', signupTeacher);
router.post('/password/forgot', forgotPassword);
router.post('/password/reset', resetPassword);
router.get('/me', requireAuth(['head', 'admin', 'teacher']), getCurrentUser);

module.exports = router;
