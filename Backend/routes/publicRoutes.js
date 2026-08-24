const express = require('express');
const {
  getPublicBootstrap,
  searchStudents,
  submitAdmission,
  submitContactMessage,
} = require('../controllers/publicController');

const router = express.Router();

router.get('/bootstrap', getPublicBootstrap);
router.get('/students/search', searchStudents);
router.post('/admissions', submitAdmission);
router.post('/contact', submitContactMessage);

module.exports = router;
