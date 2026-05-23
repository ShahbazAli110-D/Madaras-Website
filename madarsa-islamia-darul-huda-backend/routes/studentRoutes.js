const express = require('express');
const {
  addStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');

const router = express.Router();

router.post('/', addStudent);
router.get('/', getAllStudents);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;