const studentStore = require('../data/studentStore');
const { parseStudentId, validateStudentPayload } = require('../utils/studentValidation');

const addStudent = async (req, res) => {
  try {
    const { error, value } = validateStudentPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const studentId = await studentStore.addStudent(value);

    return res.status(201).json({
      message: 'Student added successfully.',
      studentId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await studentStore.getAllStudents(req.query);

    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const studentId = parseStudentId(req.params.id);

    if (!studentId) {
      return res.status(400).json({ error: 'Invalid student ID.' });
    }

    const student = await studentStore.getStudentById(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.status(200).json(student);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const studentId = parseStudentId(req.params.id);

    if (!studentId) {
      return res.status(400).json({ error: 'Invalid student ID.' });
    }

    const { error, value } = validateStudentPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const updated = await studentStore.updateStudent(studentId, value);

    if (!updated) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.status(200).json({ message: 'Student updated successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const studentId = parseStudentId(req.params.id);

    if (!studentId) {
      return res.status(400).json({ error: 'Invalid student ID.' });
    }

    const deleted = await studentStore.deleteStudent(studentId);

    if (!deleted) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.status(200).json({ message: 'Student deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
