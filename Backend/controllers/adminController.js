const madarsaStore = require('../data/madarsaStore');
const sendError = require('../utils/sendError');
const {
  parsePositiveInt,
  validateCoursePayload,
  validateEventPayload,
  validateSiteContentPayload,
  validateStudentPayload,
  validateStudentQuery,
  validateTeacherPayload,
} = require('../utils/validators');

const parseResourceId = (value, resourceName) => {
  const resourceId = parsePositiveInt(value);

  if (!resourceId) {
    throw Object.assign(new Error(`Invalid ${resourceName} ID.`), { status: 400 });
  }

  return resourceId;
};

const getDashboard = async (req, res) => {
  try {
    const dashboard = await madarsaStore.getAdminDashboard();
    return res.status(200).json(dashboard);
  } catch (error) {
    return sendError(res, error);
  }
};

const getSiteContent = async (req, res) => {
  try {
    const content = await madarsaStore.getSiteContent();
    return res.status(200).json(content);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateSiteContent = async (req, res) => {
  try {
    const { error, value } = validateSiteContentPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const content = await madarsaStore.updateSiteContent(value);
    return res.status(200).json({
      message: 'Site content updated successfully.',
      content,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const accountId = req.auth.account_id;
    if (!accountId) {
      return res.status(400).json({ error: 'Admin profile is not linked to an account.' });
    }

    const currentAccount = await madarsaStore.getTeacherById(accountId, { role: 'head' });
    if (!currentAccount) {
      return res.status(404).json({ error: 'Admin profile not found.' });
    }

    const { error, value } = validateTeacherPayload({ ...currentAccount, ...req.body }, { requirePassword: false });
    if (error) {
      return res.status(400).json({ error });
    }

    const account = await madarsaStore.updateTeacher(accountId, value, { role: 'head' });
    return res.status(200).json({ message: 'Admin profile updated successfully.', account });
  } catch (error) {
    return sendError(res, error);
  }
};

const listStudents = async (req, res) => {
  try {
    const { value } = validateStudentQuery(req.query);
    const students = await madarsaStore.listStudents(value);
    return res.status(200).json(students);
  } catch (error) {
    return sendError(res, error);
  }
};

const createStudent = async (req, res) => {
  try {
    const { error, value } = validateStudentPayload({
      ...req.body,
      admission_status: req.body.admission_status || 'active',
    });

    if (error) {
      return res.status(400).json({ error });
    }

    const student = await madarsaStore.createStudent(value);
    return res.status(201).json({
      message: 'Student created successfully.',
      student,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateStudent = async (req, res) => {
  try {
    const studentId = parseResourceId(req.params.id, 'student');
    const { error, value } = validateStudentPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const student = await madarsaStore.updateStudent(studentId, value);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.status(200).json({
      message: 'Student updated successfully.',
      student,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteStudent = async (req, res) => {
  try {
    const studentId = parseResourceId(req.params.id, 'student');
    const deleted = await madarsaStore.deleteStudent(studentId);

    if (!deleted) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.status(200).json({ message: 'Student deleted successfully.' });
  } catch (error) {
    return sendError(res, error);
  }
};

const listTeachers = async (req, res) => {
  try {
    const teachers = await madarsaStore.listTeachers();
    return res.status(200).json(teachers);
  } catch (error) {
    return sendError(res, error);
  }
};

const createTeacher = async (req, res) => {
  try {
    const { error, value } = validateTeacherPayload(req.body, { requirePassword: true });

    if (error) {
      return res.status(400).json({ error });
    }

    const teacher = await madarsaStore.createTeacher(value);
    return res.status(201).json({
      message: 'Teacher created successfully.',
      teacher,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateTeacher = async (req, res) => {
  try {
    const teacherId = parseResourceId(req.params.id, 'teacher');
    const { error, value } = validateTeacherPayload(req.body, { requirePassword: false });

    if (error) {
      return res.status(400).json({ error });
    }

    const teacher = await madarsaStore.updateTeacher(teacherId, value);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    return res.status(200).json({
      message: 'Teacher updated successfully.',
      teacher,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacherId = parseResourceId(req.params.id, 'teacher');
    const deleted = await madarsaStore.deleteTeacher(teacherId);

    if (!deleted) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    return res.status(200).json({ message: 'Teacher deleted successfully.' });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteAllTeachers = async (req, res) => {
  try {
    const result = await madarsaStore.deleteAllTeachers();
    return res.status(200).json({
      message: 'All teacher accounts and their assigned course records were deleted.',
      ...result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const listCourses = async (req, res) => {
  try {
    const courses = await madarsaStore.listCourses();
    return res.status(200).json(courses);
  } catch (error) {
    return sendError(res, error);
  }
};

const createCourse = async (req, res) => {
  try {
    const { error, value } = validateCoursePayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const course = await madarsaStore.createCourse(value);
    return res.status(201).json({
      message: 'Course created successfully.',
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateCourse = async (req, res) => {
  try {
    const courseId = parseResourceId(req.params.id, 'course');
    const { error, value } = validateCoursePayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const course = await madarsaStore.updateCourse(courseId, value);

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    return res.status(200).json({
      message: 'Course updated successfully.',
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteCourse = async (req, res) => {
  try {
    const courseId = parseResourceId(req.params.id, 'course');
    const deleted = await madarsaStore.deleteCourse(courseId);

    if (!deleted) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    return res.status(200).json({ message: 'Course deleted successfully.' });
  } catch (error) {
    return sendError(res, error);
  }
};

const listEvents = async (req, res) => {
  try {
    const events = await madarsaStore.listEvents();
    return res.status(200).json(events);
  } catch (error) {
    return sendError(res, error);
  }
};

const createEvent = async (req, res) => {
  try {
    const { error, value } = validateEventPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const eventItem = await madarsaStore.createEvent(value);
    return res.status(201).json({
      message: 'Event created successfully.',
      event: eventItem,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateEvent = async (req, res) => {
  try {
    const eventId = parseResourceId(req.params.id, 'event');
    const { error, value } = validateEventPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const eventItem = await madarsaStore.updateEvent(eventId, value);

    if (!eventItem) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.status(200).json({
      message: 'Event updated successfully.',
      event: eventItem,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteEvent = async (req, res) => {
  try {
    const eventId = parseResourceId(req.params.id, 'event');
    const deleted = await madarsaStore.deleteEvent(eventId);

    if (!deleted) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (error) {
    return sendError(res, error);
  }
};

const getAttendanceOverview = async (req, res) => {
  try {
    const courseId = parseResourceId(req.query.course_id, 'course');
    const attendanceDate = String(req.query.attendance_date || '').trim();

    if (!attendanceDate) {
      return res.status(400).json({ error: 'attendance_date is required.' });
    }

    const attendance = await madarsaStore.getAttendanceByCourseAndDate({
      course_id: courseId,
      attendance_date: attendanceDate,
    });

    return res.status(200).json(attendance);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createCourse,
  createEvent,
  createStudent,
  createTeacher,
  deleteCourse,
  deleteEvent,
  deleteStudent,
  deleteTeacher,
  deleteAllTeachers,
  getAttendanceOverview,
  getDashboard,
  getSiteContent,
  listCourses,
  listEvents,
  listStudents,
  listTeachers,
  updateCourse,
  updateEvent,
  updateSiteContent,
  updateProfile,
  updateStudent,
  updateTeacher,
};
