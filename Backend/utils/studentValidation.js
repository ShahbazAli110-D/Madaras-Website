const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const parseStudentId = (value) => {
  const studentId = Number(value);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return null;
  }

  return studentId;
};

const parseOptionalAge = (value) => {
  if (value === undefined || value === null || value === '') {
    return { value: null };
  }

  const age = Number(value);

  if (!Number.isInteger(age) || age <= 0 || age > 120) {
    return { error: 'age must be a whole number between 1 and 120.' };
  }

  return { value: age };
};

const parseOptionalPhone = (value) => {
  if (value === undefined || value === null || value === '') {
    return { value: null };
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return { error: 'phone must be a string or number.' };
  }

  const phone = String(value).trim();

  if (phone.length < 7 || phone.length > 20) {
    return { error: 'phone must be between 7 and 20 characters.' };
  }

  return { value: phone };
};

const validateStudentPayload = (payload = {}) => {
  const fullName = sanitizeString(payload.full_name);
  const fatherName = sanitizeString(payload.father_name);
  const className = sanitizeString(payload.class_name);

  if (!fullName || !fatherName || !className) {
    return {
      error: 'full_name, father_name and class_name are required.',
    };
  }

  const ageResult = parseOptionalAge(payload.age);

  if (ageResult.error) {
    return ageResult;
  }

  const phoneResult = parseOptionalPhone(payload.phone);

  if (phoneResult.error) {
    return phoneResult;
  }

  return {
    value: {
      full_name: fullName,
      father_name: fatherName,
      class_name: className,
      age: ageResult.value,
      phone: phoneResult.value,
    },
  };
};

const buildStudentListQuery = (query = {}) => {
  const conditions = [];
  const params = [];

  const search = sanitizeString(query.search);
  const className = sanitizeString(query.class_name);

  if (search) {
    const searchTerm = `%${search}%`;

    conditions.push('(full_name LIKE ? OR father_name LIKE ? OR phone LIKE ?)');
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (className) {
    conditions.push('class_name = ?');
    params.push(className);
  }

  let sql =
    'SELECT id, full_name, father_name, class_name, age, phone, created_at FROM students';

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ' ORDER BY id DESC';

  return { sql, params };
};

module.exports = {
  buildStudentListQuery,
  parseStudentId,
  validateStudentPayload,
};
