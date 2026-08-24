const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);

router.get('/site-content', adminController.getSiteContent);
router.put('/site-content', adminController.updateSiteContent);
router.put('/profile', adminController.updateProfile);

router.get('/students', adminController.listStudents);
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);

router.get('/teachers', adminController.listTeachers);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);
router.delete('/teachers', adminController.deleteAllTeachers);

router.get('/courses', adminController.listCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

router.get('/events', adminController.listEvents);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);

router.get('/attendance', adminController.getAttendanceOverview);

module.exports = router;
