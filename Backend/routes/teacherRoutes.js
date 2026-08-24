const express = require('express');
const teacherController = require('../controllers/teacherController');
const { requireTeacher } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireTeacher);

router.get('/overview', teacherController.getOverview);
router.put('/profile', teacherController.updateProfile);
router.get('/students', teacherController.listStudents);
router.put('/students/:id', teacherController.updateStudent);
router.get('/attendance/dates', teacherController.getAttendanceDates);
router.get('/attendance', teacherController.getAttendanceSheet);
router.post('/attendance', teacherController.saveAttendance);

module.exports = router;
