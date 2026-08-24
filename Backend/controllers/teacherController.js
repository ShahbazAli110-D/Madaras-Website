const madarsaStore = require('../data/madarsaStore');
const sendError = require('../utils/sendError');
const {
  parsePositiveInt,
  validateAttendancePayload,
  validateStudentPayload,
  validateStudentQuery,
  validateTeacherPayload,
} = require('../utils/validators');

const getOverview = async (req, res) => {
  try {
    const teacherId = req.auth.account_id || req.auth.teacher_id;
    const overview = await madarsaStore.getTeacherOverview(teacherId);

    if (!overview) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    const students = await madarsaStore.listStudents({
      teacher_id: teacherId,
    });

    return res.status(200).json({
      ...overview,
      students_count: students.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const teacherId = req.auth.account_id || req.auth.teacher_id;
    const currentTeacher = await madarsaStore.getTeacherById(teacherId, { role: 'teacher' });
    if (!currentTeacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    const { error, value } = validateTeacherPayload({ ...currentTeacher, ...req.body }, { requirePassword: false });
    if (error) {
      return res.status(400).json({ error });
    }

    const teacher = await madarsaStore.updateTeacher(teacherId, value);
    return res.status(200).json({ message: 'Profile updated successfully.', teacher });
  } catch (error) {
    return sendError(res, error);
  }
};

const listStudents = async (req, res) => {
  try {
    const teacherId = req.auth.account_id || req.auth.teacher_id;
    const { value } = validateStudentQuery(req.query);
    const students = await madarsaStore.listStudents({
      ...value,
      teacher_id: teacherId,
    });

    return res.status(200).json(students);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateStudent = async (req, res) => {
  try {
    const teacherId = req.auth.account_id || req.auth.teacher_id;
    const studentId = parsePositiveInt(req.params.id);

    if (!studentId) {
      return res.status(400).json({ error: 'Invalid student ID.' });
    }

    const currentStudent = await madarsaStore.getStudentById(studentId);

    if (!currentStudent) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const currentCourse = await madarsaStore.getCourseById(currentStudent.course_id);

    if (!currentCourse || currentCourse.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'You can only edit students in your assigned courses.' });
    }

    const { error, value } = validateStudentPayload({
      roll_no: currentStudent.roll_no,
      full_name: req.body.full_name ?? currentStudent.full_name,
      father_name: req.body.father_name ?? currentStudent.father_name,
      course_id: currentStudent.course_id,
      age: req.body.age ?? currentStudent.age,
      phone: req.body.phone ?? currentStudent.phone,
      address: req.body.address ?? currentStudent.address,
      admission_status: currentStudent.admission_status,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    const student = await madarsaStore.updateStudent(studentId, value);

    return res.status(200).json({
      message: 'Student updated successfully.',
      student,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getAttendanceSheet = async (req, res) => {
  try {
    const teacherId = req.auth.account_id || req.auth.teacher_id;
    const courseId = parsePositiveInt(req.query.course_id);
    const attendanceDate = String(req.query.attendance_date || '').trim();

    if (!courseId || !attendanceDate) {
      return res.status(400).json({ error: 'course_id and attendance_date are required.' });
    }

    const attendance = await madarsaStore.getAttendanceByCourseAndDate({
      course_id: courseId,
      attendance_date: attendanceDate,
      teacher_id: teacherId,
    });

    return res.status(200).json(attendance);
  } catch (error) {
    return sendError(res, error);
  }
};

const getAttendanceDates = async (req, res) => {
  try {
    const teacherId = req.auth.account_id || req.auth.teacher_id;
    const courseId = parsePositiveInt(req.query.course_id);

    if (!courseId) {
      return res.status(400).json({ error: 'course_id is required.' });
    }

    const attendanceDates = await madarsaStore.listAttendanceDates({
      course_id: courseId,
      teacher_id: teacherId,
    });

    return res.status(200).json({ attendance_dates: attendanceDates });
  } catch (error) {
    return sendError(res, error);
  }
};

const saveAttendance = async (req, res) => {
  try {
    const teacherId = req.auth.account_id || req.auth.teacher_id;
    const { error, value } = validateAttendancePayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const attendance = await madarsaStore.saveAttendanceEntries({
      ...value,
      teacher_id: teacherId,
    });

    return res.status(200).json({
      message: 'Attendance saved successfully.',
      attendance,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAttendanceSheet,
  getAttendanceDates,
  getOverview,
  listStudents,
  saveAttendance,
  updateProfile,
  updateStudent,
};
