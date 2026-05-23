const pool = require('../config/db');

const addStudent = async (req, res) => {
  try {
    const { full_name, father_name, class_name, age, phone } = req.body;

    if (!full_name || !father_name || !class_name) {
      return res.status(400).json({
        error: 'full_name, father_name and class_name are required.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO students (full_name, father_name, class_name, age, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, father_name, class_name, age || null, phone || null]
    );

    return res.status(201).json({
      message: 'Student added successfully.',
      studentId: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const [students] = await pool.query(
      'SELECT id, full_name, father_name, class_name, age, phone, created_at FROM students ORDER BY id DESC'
    );

    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({ error: 'Invalid student ID.' });
    }

    const { full_name, father_name, class_name, age, phone } = req.body;

    if (!full_name || !father_name || !class_name) {
      return res.status(400).json({
        error: 'full_name, father_name and class_name are required.',
      });
    }

    const [result] = await pool.query(
      `UPDATE students
       SET full_name = ?, father_name = ?, class_name = ?, age = ?, phone = ?
       WHERE id = ?`,
      [full_name, father_name, class_name, age || null, phone || null, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.status(200).json({ message: 'Student updated successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({ error: 'Invalid student ID.' });
    }

    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [studentId]);

    if (result.affectedRows === 0) {
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
  updateStudent,
  deleteStudent,
};