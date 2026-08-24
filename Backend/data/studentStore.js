const pool = require('../config/db');
const { buildStudentListQuery } = require('../utils/studentValidation');

const useInMemoryDb = String(process.env.USE_IN_MEMORY_DB).toLowerCase() === 'true';

const inMemoryStudents = [];
let nextStudentId = 1;

const verifyConnection = async () => {
  if (useInMemoryDb) {
    return;
  }

  const connection = await pool.getConnection();
  connection.release();
};

const addStudent = async (student) => {
  if (useInMemoryDb) {
    const newStudent = {
      id: nextStudentId++,
      ...student,
      created_at: new Date().toISOString(),
    };

    inMemoryStudents.unshift(newStudent);

    return newStudent.id;
  }

  const [result] = await pool.query(
    `INSERT INTO students (full_name, father_name, class_name, age, phone)
     VALUES (?, ?, ?, ?, ?)`,
    [student.full_name, student.father_name, student.class_name, student.age, student.phone]
  );

  return result.insertId;
};

const getAllStudents = async (query) => {
  if (useInMemoryDb) {
    const search = typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';
    const className =
      typeof query.class_name === 'string' ? query.class_name.trim().toLowerCase() : '';

    return inMemoryStudents.filter((student) => {
      const matchesSearch =
        !search ||
        student.full_name.toLowerCase().includes(search) ||
        student.father_name.toLowerCase().includes(search) ||
        String(student.phone || '')
          .toLowerCase()
          .includes(search);

      const matchesClass = !className || student.class_name.toLowerCase() === className;

      return matchesSearch && matchesClass;
    });
  }

  const { sql, params } = buildStudentListQuery(query);
  const [students] = await pool.query(sql, params);

  return students;
};

const getStudentById = async (studentId) => {
  if (useInMemoryDb) {
    return inMemoryStudents.find((student) => student.id === studentId) || null;
  }

  const [students] = await pool.query(
    'SELECT id, full_name, father_name, class_name, age, phone, created_at FROM students WHERE id = ? LIMIT 1',
    [studentId]
  );

  return students[0] || null;
};

const updateStudent = async (studentId, student) => {
  if (useInMemoryDb) {
    const existingStudent = inMemoryStudents.find((item) => item.id === studentId);

    if (!existingStudent) {
      return false;
    }

    existingStudent.full_name = student.full_name;
    existingStudent.father_name = student.father_name;
    existingStudent.class_name = student.class_name;
    existingStudent.age = student.age;
    existingStudent.phone = student.phone;

    return true;
  }

  const [result] = await pool.query(
    `UPDATE students
     SET full_name = ?, father_name = ?, class_name = ?, age = ?, phone = ?
     WHERE id = ?`,
    [student.full_name, student.father_name, student.class_name, student.age, student.phone, studentId]
  );

  return result.affectedRows > 0;
};

const deleteStudent = async (studentId) => {
  if (useInMemoryDb) {
    const studentIndex = inMemoryStudents.findIndex((student) => student.id === studentId);

    if (studentIndex === -1) {
      return false;
    }

    inMemoryStudents.splice(studentIndex, 1);

    return true;
  }

  const [result] = await pool.query('DELETE FROM students WHERE id = ?', [studentId]);

  return result.affectedRows > 0;
};

module.exports = {
  addStudent,
  deleteStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  useInMemoryDb,
  verifyConnection,
};
