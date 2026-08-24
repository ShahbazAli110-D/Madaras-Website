const pool = require('../config/db');
const { createPasswordHash } = require('../utils/auth');
const {
  createPasswordResetToken,
  DEFAULT_PASSWORD_RESET_TOKEN_TTL_SECONDS,
  hashPasswordResetToken,
} = require('../utils/auth');
const {
  DEFAULT_CLOSED_DAYS,
  DEFAULT_OPEN_DAYS,
  WEEK_DAYS,
} = require('../utils/validators');

const useInMemoryDb = String(process.env.USE_IN_MEMORY_DB).toLowerCase() === 'true';
const fs = require('fs');
const path = require('path');
const SITE_CONTENT_FILE = path.join(__dirname, 'site_content.json');
const DATA_FILE = path.join(__dirname, 'data_store.json');

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toIsoString = (value) => {
  if (!value) {
    return null;
  }

  const dateValue = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }

  return dateValue.toISOString();
};

const toDateString = (value) => {
  if (!value) {
    return null;
  }

  const dateValue = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }

  return dateValue.toISOString().slice(0, 10);
};

const serializeScheduleDays = (value) => JSON.stringify(Array.isArray(value) ? value : []);

const deserializeScheduleDays = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [...DEFAULT_OPEN_DAYS];
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : [...DEFAULT_OPEN_DAYS];
  } catch (error) {
    return [...DEFAULT_OPEN_DAYS];
  }
};

const buildRollNo = (seedNumber) => `MD-${String(seedNumber).padStart(4, '0')}`;

const clone = (value) => JSON.parse(JSON.stringify(value));

const seedTimestamp = new Date().toISOString();

const getResetExpiryTimestamp = (ttlSeconds = DEFAULT_PASSWORD_RESET_TOKEN_TTL_SECONDS) =>
  new Date(Date.now() + ttlSeconds * 1000).toISOString();

const isHeadRole = (role) => role === 'head';

const inMemoryState = {
  nextTeacherId: 4,
  nextCourseId: 4,
  nextStudentId: 5,
  nextEventId: 4,
  nextAttendanceId: 1,
  siteContent: {
    madarsa_name: 'Madarsa Islamia Darul Huda',
    logo_text: 'DH',
    hero_title: 'A trusted digital home for your madarsa community',
    hero_description:
      'قُلْ هُوَ اللَّهُ أَحَدٌ، وَبِالْعِلْمِ وَالْحِفْظِ وَالتَّرْبِيَةِ نُرَبِّي الْأَجْيَالَ، وَنُنَظِّمُ الدَّرْسَ وَالْإِدَارَةَ وَالْحُضُورَ بِحُسْنِ نِيَّةٍ وَتَوْحِيدٍ، فِي مَسَارٍ يَسْتَقِيمُ إِلَى رِضَا اللَّهِ.',
    about_text:
      'Madarsa Islamia Darul Huda is dedicated to nurturing Quranic learning, strong character, and a disciplined love for sacred knowledge in a well-organized environment.',
    admission_text:
      'Families can submit admission details online. The head of the madarsa can review students, assign courses, and manage progress through the admin section.',
    contact_email: 'info@darulhuda.local',
    contact_phone: '+92 300 1234567',
    contact_address: 'Main Road, Community Campus, Pakistan',
    footer_text: 'Madarsa Islamia Darul Huda. Serving students with sincerity and structure.',
    special_notice: '',
    donation_situation: 'Help us provide food, uniforms and tuition for needy students this month.',
    donation_easypaisa: '+92 300 1234567',
    donation_jazzcash: '+92 321 7654321',
    donation_items: [
      {
        title: 'Student Relief Fund',
        message: 'Provide immediate assistance for education, uniforms and meals for the most needy families.',
        easypaisa: '+92 300 1234567',
        jazzcash: '+92 321 7654321',
      }
    ],
    closed_days: [...DEFAULT_CLOSED_DAYS],
    open_days: [...DEFAULT_OPEN_DAYS],
    updated_at: seedTimestamp,
  },
  teachers: [
    {
      id: 1,
      full_name: 'Qari Abdul Basit',
      email: 'basit@darulhuda.local',
      role: 'teacher',
      phone: '+92 300 0001001',
      qualification: 'Hifz and Tajweed Instructor',
      bio: 'Leads Hifz memorization and tajweed improvement with daily revision support.',
      profile_image: null,
      password_hash: createPasswordHash('Teacher123'),
      password_reset_token_hash: null,
      password_reset_expires_at: null,
      password_reset_requested_at: null,
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
    {
      id: 2,
      full_name: 'Maulana Saeed Ahmed',
      email: 'saeed@darulhuda.local',
      role: 'teacher',
      phone: '+92 300 0001002',
      qualification: 'Arabic and Fiqh Teacher',
      bio: 'Teaches Arabic foundation, fiqh, and adab with a structured class routine.',
      profile_image: null,
      password_hash: createPasswordHash('Teacher123'),
      password_reset_token_hash: null,
      password_reset_expires_at: null,
      password_reset_requested_at: null,
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
    {
      id: 3,
      full_name: 'Ustani Ayesha Noor',
      email: 'ayesha@darulhuda.local',
      role: 'teacher',
      phone: '+92 300 0001003',
      qualification: 'Nazra and Early Learning Teacher',
      bio: 'Supports younger students with Nazra, duas, and foundational Islamic studies.',
      profile_image: null,
      password_hash: createPasswordHash('Teacher123'),
      password_reset_token_hash: null,
      password_reset_expires_at: null,
      password_reset_requested_at: null,
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
  ],
  courses: [
    {
      id: 1,
      title: 'Hifz ul Quran',
      code: 'HIFZ-01',
      description: 'Memorization with daily sabak, sabqi, and manzil revision.',
      teacher_id: 1,
      start_time: '08:00',
      end_time: '10:00',
      schedule_days: [...DEFAULT_OPEN_DAYS],
      is_active: true,
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
    {
      id: 2,
      title: 'Arabic and Fiqh',
      code: 'ARABIC-02',
      description: 'Arabic language foundations, fiqh basics, and classroom discussion.',
      teacher_id: 2,
      start_time: '08:00',
      end_time: '10:00',
      schedule_days: [...DEFAULT_OPEN_DAYS],
      is_active: true,
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
    {
      id: 3,
      title: 'Nazra and Duas',
      code: 'NAZRA-03',
      description: 'Nazra fluency, tajweed basics, short surahs, and masnoon duas.',
      teacher_id: 3,
      start_time: '08:00',
      end_time: '10:00',
      schedule_days: [...DEFAULT_OPEN_DAYS],
      is_active: true,
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
  ],
  students: [
    {
      id: 1,
      roll_no: 'MD-1001',
      full_name: 'Muhammad Hamza',
      father_name: 'Rashid Ali',
      course_id: 1,
      age: 13,
      phone: '+92 300 1111001',
      address: 'North Block',
      admission_status: 'active',
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
    {
      id: 2,
      roll_no: 'MD-1002',
      full_name: 'Ahmed Raza',
      father_name: 'Javed Iqbal',
      course_id: 1,
      age: 12,
      phone: '+92 300 1111002',
      address: 'Central Street',
      admission_status: 'active',
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
    {
      id: 3,
      roll_no: 'MD-1003',
      full_name: 'Zainab Fatima',
      father_name: 'Sohail Ahmed',
      course_id: 2,
      age: 14,
      phone: '+92 300 1111003',
      address: 'Garden Town',
      admission_status: 'active',
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
    {
      id: 4,
      roll_no: 'MD-1004',
      full_name: 'Maryam Noor',
      father_name: 'Naseem Khan',
      course_id: 3,
      age: 10,
      phone: '+92 300 1111004',
      address: 'Model Colony',
      admission_status: 'pending',
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
  ],
  events: [
    {
      id: 1,
      title: 'Annual Dastar Bandi',
      description: 'Celebrating the progress of Hifz students with families and teachers.',
      location: 'Main Hall',
      event_date: '2026-06-20',
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
    {
      id: 2,
      title: 'Parents and Teachers Meeting',
      description: 'A review session for attendance, adab, and academic progress.',
      location: 'Madarsa Office',
      event_date: '2026-06-28',
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
    {
      id: 3,
      title: 'Summer Tajweed Workshop',
      description: 'A focused workshop for pronunciation and recitation improvement.',
      location: 'Classroom Block B',
      event_date: '2026-07-05',
      created_at: seedTimestamp,
      updated_at: seedTimestamp,
    },
  ],
  attendance: [],
};

const persistInMemoryState = () => {
  if (!useInMemoryDb) {
    return;
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      nextTeacherId: inMemoryState.nextTeacherId,
      nextCourseId: inMemoryState.nextCourseId,
      nextStudentId: inMemoryState.nextStudentId,
      nextEventId: inMemoryState.nextEventId,
      nextAttendanceId: inMemoryState.nextAttendanceId,
      siteContent: inMemoryState.siteContent,
      teachers: inMemoryState.teachers,
      courses: inMemoryState.courses,
      students: inMemoryState.students,
      events: inMemoryState.events,
      attendance: inMemoryState.attendance,
    }, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to persist in-memory database state:', err && err.message);
  }
};

const loadPersistedState = () => {
  if (!useInMemoryDb || !fs.existsSync(DATA_FILE)) {
    return;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return;
    }

    inMemoryState.nextTeacherId = Number(parsed.nextTeacherId || inMemoryState.nextTeacherId);
    inMemoryState.nextCourseId = Number(parsed.nextCourseId || inMemoryState.nextCourseId);
    inMemoryState.nextStudentId = Number(parsed.nextStudentId || inMemoryState.nextStudentId);
    inMemoryState.nextEventId = Number(parsed.nextEventId || inMemoryState.nextEventId);
    inMemoryState.nextAttendanceId = Number(parsed.nextAttendanceId || inMemoryState.nextAttendanceId);
    inMemoryState.siteContent = { ...inMemoryState.siteContent, ...(parsed.siteContent || {}) };
    inMemoryState.teachers = Array.isArray(parsed.teachers) ? parsed.teachers : inMemoryState.teachers;
    inMemoryState.courses = Array.isArray(parsed.courses) ? parsed.courses : inMemoryState.courses;
    inMemoryState.students = Array.isArray(parsed.students) ? parsed.students : inMemoryState.students;
    inMemoryState.events = Array.isArray(parsed.events) ? parsed.events : inMemoryState.events;
    inMemoryState.attendance = Array.isArray(parsed.attendance) ? parsed.attendance : inMemoryState.attendance;
  } catch (err) {
    console.warn('Failed to load persisted in-memory database state:', err && err.message);
  }
};

// Load persisted site content when using in-memory DB mode
if (useInMemoryDb) {
  try {
    if (fs.existsSync(SITE_CONTENT_FILE)) {
      const raw = fs.readFileSync(SITE_CONTENT_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryState.siteContent = {
          ...inMemoryState.siteContent,
          ...parsed,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load persisted site content:', err && err.message);
  }

  loadPersistedState();
}

const verifyConnection = async () => {
  if (useInMemoryDb) {
    return;
  }

  const connection = await pool.getConnection();
  connection.release();
};

const requireInMemoryTeacher = (teacherId, role = null) =>
  inMemoryState.teachers.find(
    (teacher) => teacher.id === teacherId && (!role || teacher.role === role)
  ) || null;

const findInMemoryTeacherByEmail = (email, role = null) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  return (
    inMemoryState.teachers.find(
      (teacher) =>
        String(teacher.email || '').trim().toLowerCase() === normalizedEmail &&
        (!role || teacher.role === role)
    ) || null
  );
};

const hasHeadAccountInMemory = () => inMemoryState.teachers.some((teacher) => teacher.role === 'head');

const requireInMemoryCourse = (courseId) =>
  inMemoryState.courses.find((course) => course.id === courseId) || null;

const decorateTeacher = (teacher) => {
  if (!teacher) {
    return null;
  }

  const {
    password_hash,
    password_reset_token_hash,
    password_reset_expires_at,
    password_reset_requested_at,
    ...publicTeacher
  } = teacher;
  return clone(publicTeacher);
};

const decoratePublicTeacher = (teacher) => {
  if (!teacher) {
    return null;
  }

  return {
    id: teacher.id,
    full_name: teacher.full_name,
    qualification: teacher.qualification,
    bio: teacher.bio,
    profile_image: teacher.profile_image || null,
  };
};

const decorateCourse = (course) => {
  if (!course) {
    return null;
  }

  const teacher = requireInMemoryTeacher(course.teacher_id);

  return {
    ...clone(course),
    teacher_name: teacher ? teacher.full_name : null,
    teacher_qualification: teacher ? teacher.qualification : null,
    teacher_bio: teacher ? teacher.bio : null,
    teacher_profile_image: teacher ? teacher.profile_image || null : null,
  };
};

const decorateStudent = (student) => {
  if (!student) {
    return null;
  }

  const course = requireInMemoryCourse(student.course_id);
  const teacher = course ? requireInMemoryTeacher(course.teacher_id) : null;

  return {
    ...clone(student),
    course_name: course ? course.title : null,
    course_code: course ? course.code : null,
    teacher_name: teacher ? teacher.full_name : null,
  };
};

const decorateEvent = (eventItem) => clone(eventItem);

const getNextRollNo = async () => {
  if (useInMemoryDb) {
    return buildRollNo(1000 + inMemoryState.nextStudentId);
  }

  const [rows] = await pool.query('SELECT COALESCE(MAX(id), 0) + 1000 AS next_seed FROM students');
  return buildRollNo(rows[0].next_seed);
};

const mapTeacherRow = (row) => ({
  id: row.id,
  full_name: row.full_name,
  email: row.email,
  role: row.role || 'teacher',
  phone: row.phone,
  qualification: row.qualification,
  bio: row.bio,
  profile_image: row.profile_image || null,
  password_hash: row.password_hash,
  password_reset_token_hash: row.password_reset_token_hash || null,
  password_reset_expires_at: toIsoString(row.password_reset_expires_at),
  password_reset_requested_at: toIsoString(row.password_reset_requested_at),
  created_at: toIsoString(row.created_at),
  updated_at: toIsoString(row.updated_at),
});

const mapCourseRow = (row) => ({
  id: row.id,
  title: row.title,
  code: row.code,
  description: row.description,
  teacher_id: row.teacher_id,
  teacher_name: row.teacher_name || null,
  teacher_qualification: row.teacher_qualification || null,
  teacher_bio: row.teacher_bio || null,
  teacher_profile_image: row.teacher_profile_image || null,
  start_time: row.start_time,
  end_time: row.end_time,
  schedule_days: deserializeScheduleDays(row.schedule_days),
  is_active: Boolean(row.is_active),
  created_at: toIsoString(row.created_at),
  updated_at: toIsoString(row.updated_at),
});

const mapStudentRow = (row) => ({
  id: row.id,
  roll_no: row.roll_no,
  full_name: row.full_name,
  father_name: row.father_name,
  course_id: row.course_id,
  course_name: row.course_name || null,
  course_code: row.course_code || null,
  teacher_name: row.teacher_name || null,
  age: row.age,
  phone: row.phone,
  address: row.address,
  admission_status: row.admission_status,
  created_at: toIsoString(row.created_at),
  updated_at: toIsoString(row.updated_at),
});

const mapEventRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  location: row.location,
  event_date: toDateString(row.event_date),
  created_at: toIsoString(row.created_at),
  updated_at: toIsoString(row.updated_at),
});

const listCourses = async () => {
  if (useInMemoryDb) {
    return inMemoryState.courses
      .map(decorateCourse)
      .sort((left, right) => right.id - left.id);
  }

  const [rows] = await pool.query(
    `SELECT c.id, c.title, c.code, c.description, c.teacher_id, c.start_time, c.end_time,
            c.schedule_days, c.is_active, c.created_at, c.updated_at,
            t.full_name AS teacher_name, t.qualification AS teacher_qualification,
            t.bio AS teacher_bio, t.profile_image AS teacher_profile_image
     FROM courses c
     LEFT JOIN teachers t ON t.id = c.teacher_id
     ORDER BY c.id DESC`
  );

  return rows.map(mapCourseRow);
};

const getCourseById = async (courseId) => {
  if (useInMemoryDb) {
    return decorateCourse(requireInMemoryCourse(courseId));
  }

  const [rows] = await pool.query(
    `SELECT c.id, c.title, c.code, c.description, c.teacher_id, c.start_time, c.end_time,
            c.schedule_days, c.is_active, c.created_at, c.updated_at,
            t.full_name AS teacher_name, t.qualification AS teacher_qualification,
            t.bio AS teacher_bio, t.profile_image AS teacher_profile_image
     FROM courses c
     LEFT JOIN teachers t ON t.id = c.teacher_id
     WHERE c.id = ?
     LIMIT 1`,
    [courseId]
  );

  return rows[0] ? mapCourseRow(rows[0]) : null;
};

const listTeachers = async () => {
  if (useInMemoryDb) {
    const courses = await listCourses();
    return inMemoryState.teachers
      .filter((teacher) => teacher.role === 'teacher')
      .map((teacher) => ({
        ...decorateTeacher(teacher),
        courses: courses.filter((course) => course.teacher_id === teacher.id),
        course_ids: courses.filter((course) => course.teacher_id === teacher.id).map((course) => course.id),
      }));
  }

  const [rows] = await pool.query(
    `SELECT id, full_name, email, role, phone, qualification, bio, profile_image,
            password_hash, password_reset_token_hash, password_reset_expires_at,
            password_reset_requested_at, created_at, updated_at
     FROM teachers
     WHERE role = 'teacher'
     ORDER BY id DESC`
  );

  const courses = await listCourses();
  return rows.map(mapTeacherRow).map((teacher) => ({
    ...decorateTeacher(teacher),
    courses: courses.filter((course) => course.teacher_id === teacher.id),
    course_ids: courses.filter((course) => course.teacher_id === teacher.id).map((course) => course.id),
  }));
};

const getTeacherById = async (teacherId, options = {}) => {
  const role = options.role || null;

  if (useInMemoryDb) {
    return decorateTeacher(requireInMemoryTeacher(teacherId, role));
  }

  const roleClause = role ? 'AND role = ?' : '';
  const [rows] = await pool.query(
    `SELECT id, full_name, email, role, phone, qualification, bio, profile_image,
            password_hash, password_reset_token_hash, password_reset_expires_at,
            password_reset_requested_at, created_at, updated_at
     FROM teachers
     WHERE id = ?
     ${roleClause}
     LIMIT 1`,
    role ? [teacherId, role] : [teacherId]
  );

  return rows[0] ? decorateTeacher(mapTeacherRow(rows[0])) : null;
};

const getTeacherCredentialsByEmail = async (email, options = {}) => {
  const role = options.role || null;

  if (useInMemoryDb) {
    const teacher = findInMemoryTeacherByEmail(email, role) || null;
    return teacher ? clone(teacher) : null;
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const roleClause = role ? 'AND role = ?' : '';
  const [rows] = await pool.query(
    `SELECT id, full_name, email, role, phone, qualification, bio, profile_image,
            password_hash, password_reset_token_hash, password_reset_expires_at,
            password_reset_requested_at, created_at, updated_at
     FROM teachers
     WHERE LOWER(email) = ?
     ${roleClause}
     LIMIT 1`,
    role ? [normalizedEmail, role] : [normalizedEmail]
  );

  return rows[0] ? mapTeacherRow(rows[0]) : null;
};

const ensureCourseExists = async (courseId) => {
  const course = await getCourseById(courseId);

  if (!course) {
    throw createHttpError(404, 'Course not found.');
  }

  return course;
};

const ensureTeacherExists = async (teacherId) => {
  const teacher = await getTeacherById(teacherId);

  if (!teacher) {
    throw createHttpError(404, 'Teacher not found.');
  }

  return teacher;
};

const createTeacher = async (teacher) => {
  const role = isHeadRole(teacher.role) ? 'head' : 'teacher';

  if (useInMemoryDb) {
    const emailAlreadyExists = inMemoryState.teachers.some((item) => item.email === teacher.email);

    if (emailAlreadyExists) {
      throw createHttpError(409, 'A teacher with this email already exists.');
    }

    const timestamp = new Date().toISOString();
    const record = {
      id: inMemoryState.nextTeacherId++,
      full_name: teacher.full_name,
      email: teacher.email,
      role,
      phone: teacher.phone,
      qualification: teacher.qualification,
      bio: teacher.bio,
      profile_image: teacher.profile_image || null,
      password_hash: createPasswordHash(teacher.password || 'Teacher123'),
      password_reset_token_hash: null,
      password_reset_expires_at: null,
      password_reset_requested_at: null,
      created_at: timestamp,
      updated_at: timestamp,
    };

    inMemoryState.teachers.unshift(record);
    persistInMemoryState();
    return decorateTeacher(record);
  }

  const existingTeacher = await getTeacherCredentialsByEmail(teacher.email);

  if (existingTeacher) {
    throw createHttpError(409, 'A teacher with this email already exists.');
  }

  const [result] = await pool.query(
    `INSERT INTO teachers (full_name, email, role, phone, qualification, bio, profile_image, password_hash,
                           password_reset_token_hash, password_reset_expires_at, password_reset_requested_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
    [
      teacher.full_name,
      teacher.email,
      role,
      teacher.phone,
      teacher.qualification,
      teacher.bio,
      teacher.profile_image || null,
      createPasswordHash(teacher.password || 'Teacher123'),
    ]
  );

  return getTeacherById(result.insertId);
};

const updateTeacher = async (teacherId, teacher, options = {}) => {
  const expectedRole = options.role || 'teacher';

  if (useInMemoryDb) {
    const currentTeacher = inMemoryState.teachers.find((item) => item.id === teacherId);

    if (!currentTeacher || currentTeacher.role !== expectedRole) {
      return null;
    }

    const emailConflict = inMemoryState.teachers.some(
      (item) => item.id !== teacherId && item.email === teacher.email
    );

    if (emailConflict) {
      throw createHttpError(409, 'A teacher with this email already exists.');
    }

    currentTeacher.full_name = teacher.full_name;
    currentTeacher.email = teacher.email;
    currentTeacher.phone = teacher.phone;
    currentTeacher.qualification = teacher.qualification;
    currentTeacher.bio = teacher.bio;
    currentTeacher.profile_image = teacher.profile_image || null;
    currentTeacher.updated_at = new Date().toISOString();

    if (teacher.password) {
      currentTeacher.password_hash = createPasswordHash(teacher.password);
      currentTeacher.password_reset_token_hash = null;
      currentTeacher.password_reset_expires_at = null;
      currentTeacher.password_reset_requested_at = null;
    }

    persistInMemoryState();
    return decorateTeacher(currentTeacher);
  }

  const [teacherRows] = await pool.query(
    `SELECT id, full_name, email, role, phone, qualification, bio, profile_image, password_hash,
            password_reset_token_hash, password_reset_expires_at, password_reset_requested_at
     FROM teachers
     WHERE id = ? AND role = ?
     LIMIT 1`,
    [teacherId, expectedRole]
  );

  if (!teacherRows[0]) {
    return null;
  }

  const currentTeacher = mapTeacherRow(teacherRows[0]);
  const existingTeacher = await getTeacherCredentialsByEmail(teacher.email);

  if (existingTeacher && existingTeacher.id !== teacherId) {
    throw createHttpError(409, 'A teacher with this email already exists.');
  }

  await pool.query(
    `UPDATE teachers
    SET full_name = ?, email = ?, phone = ?, qualification = ?, bio = ?, profile_image = ?,
         password_hash = ?, password_reset_token_hash = NULL,
         password_reset_expires_at = NULL, password_reset_requested_at = NULL,
         updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND role = ?`,
    [
      teacher.full_name,
      teacher.email,
      teacher.phone,
      teacher.qualification,
      teacher.bio,
      teacher.profile_image || null,
      teacher.password ? createPasswordHash(teacher.password) : currentTeacher.password_hash,
      teacherId,
      expectedRole,
    ]
  );

  return getTeacherById(teacherId);
};

const deleteTeacher = async (teacherId) => {
  const assignedCourses = await listCourses();

  if (assignedCourses.some((course) => course.teacher_id === teacherId)) {
    throw createHttpError(409, 'Reassign or delete this teacher’s courses before removing them.');
  }

  if (useInMemoryDb) {
    const teacherIndex = inMemoryState.teachers.findIndex(
      (item) => item.id === teacherId && item.role === 'teacher'
    );

    if (teacherIndex === -1) {
      return false;
    }

    inMemoryState.teachers.splice(teacherIndex, 1);
    persistInMemoryState();
    persistInMemoryState();
    return true;
  }

  const [result] = await pool.query('DELETE FROM teachers WHERE id = ? AND role = "teacher"', [
    teacherId,
  ]);
  return result.affectedRows > 0;
};

const deleteAllTeachers = async () => {
  if (useInMemoryDb) {
    const teacherIds = new Set(
      inMemoryState.teachers.filter((teacher) => teacher.role === 'teacher').map((teacher) => teacher.id)
    );
    const courseIds = new Set(
      inMemoryState.courses.filter((course) => teacherIds.has(course.teacher_id)).map((course) => course.id)
    );

    inMemoryState.attendance = inMemoryState.attendance.filter((record) => !courseIds.has(record.course_id) && !teacherIds.has(record.teacher_id));
    inMemoryState.students = inMemoryState.students.filter((student) => !courseIds.has(student.course_id));
    inMemoryState.courses = inMemoryState.courses.filter((course) => !courseIds.has(course.id));
    inMemoryState.teachers = inMemoryState.teachers.filter((teacher) => teacher.role !== 'teacher');
    persistInMemoryState();
    return { teachers_deleted: teacherIds.size, courses_deleted: courseIds.size };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [teacherRows] = await connection.query('SELECT id FROM teachers WHERE role = "teacher"');
    const teacherIds = teacherRows.map((teacher) => teacher.id);

    if (teacherIds.length === 0) {
      await connection.commit();
      return { teachers_deleted: 0, courses_deleted: 0 };
    }

    const teacherPlaceholders = teacherIds.map(() => '?').join(', ');
    const [courseRows] = await connection.query(
      `SELECT id FROM courses WHERE teacher_id IN (${teacherPlaceholders})`,
      teacherIds
    );
    const courseIds = courseRows.map((course) => course.id);

    if (courseIds.length > 0) {
      const coursePlaceholders = courseIds.map(() => '?').join(', ');
      await connection.query(`DELETE FROM attendance_records WHERE course_id IN (${coursePlaceholders})`, courseIds);
      await connection.query(`DELETE FROM students WHERE course_id IN (${coursePlaceholders})`, courseIds);
      await connection.query(`DELETE FROM courses WHERE id IN (${coursePlaceholders})`, courseIds);
    }

    await connection.query(`DELETE FROM teachers WHERE id IN (${teacherPlaceholders}) AND role = "teacher"`, teacherIds);
    await connection.commit();
    return { teachers_deleted: teacherIds.length, courses_deleted: courseIds.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const createHeadAccount = async (account) => {
  if (await hasHeadAccount()) {
    throw createHttpError(409, 'A head account already exists.');
  }

  return createTeacher({ ...account, role: 'head' });
};

const deleteHeadAccount = async () => {
  if (useInMemoryDb) {
    const headIndex = inMemoryState.teachers.findIndex((teacher) => teacher.role === 'head');

    if (headIndex === -1) {
      return false;
    }

    inMemoryState.teachers.splice(headIndex, 1);
    persistInMemoryState();
    return true;
  }

  const [result] = await pool.query('DELETE FROM teachers WHERE role = "head"');
  return result.affectedRows > 0;
};

const hasHeadAccount = async () => {
  if (useInMemoryDb) {
    return hasHeadAccountInMemory();
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS head_count
     FROM teachers
     WHERE role = 'head'
     LIMIT 1`
  );

  return Number(rows[0]?.head_count || 0) > 0;
};

const requestPasswordReset = async (email) => {
  const teacher = await getTeacherCredentialsByEmail(email);

  if (!teacher) {
    throw createHttpError(404, 'No account was found for this email address.');
  }

  const resetToken = createPasswordResetToken();
  const resetTokenHash = hashPasswordResetToken(resetToken);
  const resetExpiry = getResetExpiryTimestamp();
  const resetRequestedAt = new Date().toISOString();

  if (useInMemoryDb) {
    const record = inMemoryState.teachers.find((item) => item.id === teacher.id);

    if (!record) {
      throw createHttpError(404, 'No account was found for this email address.');
    }

    record.password_reset_token_hash = resetTokenHash;
    record.password_reset_expires_at = resetExpiry;
    record.password_reset_requested_at = resetRequestedAt;
  } else {
    await pool.query(
      `UPDATE teachers
       SET password_reset_token_hash = ?, password_reset_expires_at = ?, password_reset_requested_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [resetTokenHash, resetExpiry, teacher.id]
    );
  }

  return {
    email: teacher.email,
    role: teacher.role,
    reset_token: resetToken,
    reset_link: `/reset-password?token=${resetToken}`,
    expires_at: resetExpiry,
  };
};

const resetPasswordWithToken = async (token, password) => {
  const tokenHash = hashPasswordResetToken(token);
  const nowIso = new Date().toISOString();

  if (useInMemoryDb) {
    const record = inMemoryState.teachers.find(
      (item) =>
        item.password_reset_token_hash === tokenHash &&
        item.password_reset_expires_at &&
        item.password_reset_expires_at > nowIso
    );

    if (!record) {
      throw createHttpError(400, 'Reset token is invalid or expired.');
    }

    record.password_hash = createPasswordHash(password);
    record.password_reset_token_hash = null;
    record.password_reset_expires_at = null;
    record.password_reset_requested_at = null;
    record.updated_at = nowIso;

    return decorateTeacher(record);
  }

  const [rows] = await pool.query(
    `SELECT id, full_name, email, role, phone, qualification, bio, password_hash,
            password_reset_token_hash, password_reset_expires_at, password_reset_requested_at,
            created_at, updated_at
     FROM teachers
     WHERE password_reset_token_hash = ? AND password_reset_expires_at > ?
     LIMIT 1`,
    [tokenHash, nowIso]
  );

  if (!rows[0]) {
    throw createHttpError(400, 'Reset token is invalid or expired.');
  }

  await pool.query(
    `UPDATE teachers
     SET password_hash = ?, password_reset_token_hash = NULL,
         password_reset_expires_at = NULL, password_reset_requested_at = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [createPasswordHash(password), rows[0].id]
  );

  return decorateTeacher(mapTeacherRow(rows[0]));
};

const createCourse = async (course) => {
  await ensureTeacherExists(course.teacher_id);

  if (useInMemoryDb) {
    const codeConflict = inMemoryState.courses.some((item) => item.code === course.code);

    if (codeConflict) {
      throw createHttpError(409, 'A course with this code already exists.');
    }

    const timestamp = new Date().toISOString();
    const record = {
      id: inMemoryState.nextCourseId++,
      title: course.title,
      code: course.code,
      description: course.description,
      teacher_id: course.teacher_id,
      start_time: course.start_time,
      end_time: course.end_time,
      schedule_days: [...course.schedule_days],
      is_active: course.is_active,
      created_at: timestamp,
      updated_at: timestamp,
    };

    inMemoryState.courses.unshift(record);
    persistInMemoryState();
    return decorateCourse(record);
  }

  const [existingRows] = await pool.query('SELECT id FROM courses WHERE code = ? LIMIT 1', [course.code]);

  if (existingRows[0]) {
    throw createHttpError(409, 'A course with this code already exists.');
  }

  const [result] = await pool.query(
    `INSERT INTO courses (title, code, description, teacher_id, start_time, end_time, schedule_days, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      course.title,
      course.code,
      course.description,
      course.teacher_id,
      course.start_time,
      course.end_time,
      serializeScheduleDays(course.schedule_days),
      course.is_active ? 1 : 0,
    ]
  );

  return getCourseById(result.insertId);
};

const updateCourse = async (courseId, course) => {
  await ensureTeacherExists(course.teacher_id);

  if (useInMemoryDb) {
    const currentCourse = inMemoryState.courses.find((item) => item.id === courseId);

    if (!currentCourse) {
      return null;
    }

    const codeConflict = inMemoryState.courses.some(
      (item) => item.id !== courseId && item.code === course.code
    );

    if (codeConflict) {
      throw createHttpError(409, 'A course with this code already exists.');
    }

    currentCourse.title = course.title;
    currentCourse.code = course.code;
    currentCourse.description = course.description;
    currentCourse.teacher_id = course.teacher_id;
    currentCourse.start_time = course.start_time;
    currentCourse.end_time = course.end_time;
    currentCourse.schedule_days = [...course.schedule_days];
    currentCourse.is_active = course.is_active;
    currentCourse.updated_at = new Date().toISOString();

    return decorateCourse(currentCourse);
  }

  const [conflictRows] = await pool.query(
    'SELECT id FROM courses WHERE code = ? AND id <> ? LIMIT 1',
    [course.code, courseId]
  );

  if (conflictRows[0]) {
    throw createHttpError(409, 'A course with this code already exists.');
  }

  const [result] = await pool.query(
    `UPDATE courses
     SET title = ?, code = ?, description = ?, teacher_id = ?, start_time = ?, end_time = ?,
         schedule_days = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      course.title,
      course.code,
      course.description,
      course.teacher_id,
      course.start_time,
      course.end_time,
      serializeScheduleDays(course.schedule_days),
      course.is_active ? 1 : 0,
      courseId,
    ]
  );

  return result.affectedRows > 0 ? getCourseById(courseId) : null;
};

const deleteCourse = async (courseId) => {
  const students = await listStudents({});

  if (students.some((student) => student.course_id === courseId)) {
    throw createHttpError(409, 'Move or remove students from this course before deleting it.');
  }

  if (useInMemoryDb) {
    const courseIndex = inMemoryState.courses.findIndex((item) => item.id === courseId);

    if (courseIndex === -1) {
      return false;
    }

    inMemoryState.courses.splice(courseIndex, 1);
    inMemoryState.attendance = inMemoryState.attendance.filter((item) => item.course_id !== courseId);
    return true;
  }

  const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [courseId]);
  return result.affectedRows > 0;
};

const listStudents = async (filters = {}) => {
  if (useInMemoryDb) {
    const search = String(filters.search || '').toLowerCase();
    const rollNo = String(filters.roll_no || '').toUpperCase();
    const courseId = filters.course_id || null;
    const admissionStatus = String(filters.admission_status || '').toLowerCase();
    const teacherId = filters.teacher_id || null;

    return inMemoryState.students
      .filter((student) => {
        const course = requireInMemoryCourse(student.course_id);
        const teacher = course ? requireInMemoryTeacher(course.teacher_id) : null;
        const matchesSearch =
          !search ||
          student.full_name.toLowerCase().includes(search) ||
          student.father_name.toLowerCase().includes(search) ||
          String(student.phone || '')
            .toLowerCase()
            .includes(search) ||
          student.roll_no.toLowerCase().includes(search) ||
          String(course?.title || '')
            .toLowerCase()
            .includes(search);
        const matchesRoll = !rollNo || student.roll_no === rollNo;
        const matchesCourse = !courseId || student.course_id === courseId;
        const matchesStatus = !admissionStatus || student.admission_status === admissionStatus;
        const matchesTeacher = !teacherId || teacher?.id === teacherId;

        return matchesSearch && matchesRoll && matchesCourse && matchesStatus && matchesTeacher;
      })
      .sort((left, right) => right.id - left.id)
      .map(decorateStudent);
  }

  const conditions = [];
  const params = [];

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      '(s.full_name LIKE ? OR s.father_name LIKE ? OR s.phone LIKE ? OR s.roll_no LIKE ? OR c.title LIKE ?)'
    );
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (filters.roll_no) {
    conditions.push('s.roll_no = ?');
    params.push(filters.roll_no);
  }

  if (filters.course_id) {
    conditions.push('s.course_id = ?');
    params.push(filters.course_id);
  }

  if (filters.admission_status) {
    conditions.push('s.admission_status = ?');
    params.push(filters.admission_status);
  }

  if (filters.teacher_id) {
    conditions.push('c.teacher_id = ?');
    params.push(filters.teacher_id);
  }

  let sql = `SELECT s.id, s.roll_no, s.full_name, s.father_name, s.course_id, s.age, s.phone, s.address,
                    s.admission_status, s.created_at, s.updated_at,
                    c.title AS course_name, c.code AS course_code, t.full_name AS teacher_name
             FROM students s
             LEFT JOIN courses c ON c.id = s.course_id
             LEFT JOIN teachers t ON t.id = c.teacher_id`;

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ' ORDER BY s.id DESC';

  const [rows] = await pool.query(sql, params);
  return rows.map(mapStudentRow);
};

const getStudentById = async (studentId) => {
  if (useInMemoryDb) {
    const student = inMemoryState.students.find((item) => item.id === studentId) || null;
    return decorateStudent(student);
  }

  const [rows] = await pool.query(
    `SELECT s.id, s.roll_no, s.full_name, s.father_name, s.course_id, s.age, s.phone, s.address,
            s.admission_status, s.created_at, s.updated_at,
            c.title AS course_name, c.code AS course_code, t.full_name AS teacher_name
     FROM students s
     LEFT JOIN courses c ON c.id = s.course_id
     LEFT JOIN teachers t ON t.id = c.teacher_id
     WHERE s.id = ?
     LIMIT 1`,
    [studentId]
  );

  return rows[0] ? mapStudentRow(rows[0]) : null;
};

const createStudent = async (student, options = {}) => {
  await ensureCourseExists(student.course_id);
  const rollNo = student.roll_no || (await getNextRollNo());

  if (useInMemoryDb) {
    const rollConflict = inMemoryState.students.some((item) => item.roll_no === rollNo);

    if (rollConflict) {
      throw createHttpError(409, 'A student with this roll number already exists.');
    }

    const timestamp = new Date().toISOString();
    const record = {
      id: inMemoryState.nextStudentId++,
      roll_no: rollNo,
      full_name: student.full_name,
      father_name: student.father_name,
      course_id: student.course_id,
      age: student.age,
      phone: student.phone,
      address: student.address,
      admission_status: options.forceStatus || student.admission_status,
      created_at: timestamp,
      updated_at: timestamp,
    };

    inMemoryState.students.unshift(record);
    return decorateStudent(record);
  }

  const [existingRows] = await pool.query('SELECT id FROM students WHERE roll_no = ? LIMIT 1', [rollNo]);

  if (existingRows[0]) {
    throw createHttpError(409, 'A student with this roll number already exists.');
  }

  const [result] = await pool.query(
    `INSERT INTO students (roll_no, full_name, father_name, course_id, age, phone, address, admission_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rollNo,
      student.full_name,
      student.father_name,
      student.course_id,
      student.age,
      student.phone,
      student.address,
      options.forceStatus || student.admission_status,
    ]
  );

  return getStudentById(result.insertId);
};

const updateStudent = async (studentId, student) => {
  await ensureCourseExists(student.course_id);

  if (useInMemoryDb) {
    const currentStudent = inMemoryState.students.find((item) => item.id === studentId);

    if (!currentStudent) {
      return null;
    }

    if (student.roll_no && student.roll_no !== currentStudent.roll_no) {
      const rollConflict = inMemoryState.students.some(
        (item) => item.id !== studentId && item.roll_no === student.roll_no
      );

      if (rollConflict) {
        throw createHttpError(409, 'A student with this roll number already exists.');
      }
    }

    currentStudent.roll_no = student.roll_no || currentStudent.roll_no;
    currentStudent.full_name = student.full_name;
    currentStudent.father_name = student.father_name;
    currentStudent.course_id = student.course_id;
    currentStudent.age = student.age;
    currentStudent.phone = student.phone;
    currentStudent.address = student.address;
    currentStudent.admission_status = student.admission_status;
    currentStudent.updated_at = new Date().toISOString();

    return decorateStudent(currentStudent);
  }

  const currentStudent = await getStudentById(studentId);

  if (!currentStudent) {
    return null;
  }

  const rollNo = student.roll_no || currentStudent.roll_no;

  const [conflictRows] = await pool.query(
    'SELECT id FROM students WHERE roll_no = ? AND id <> ? LIMIT 1',
    [rollNo, studentId]
  );

  if (conflictRows[0]) {
    throw createHttpError(409, 'A student with this roll number already exists.');
  }

  await pool.query(
    `UPDATE students
     SET roll_no = ?, full_name = ?, father_name = ?, course_id = ?, age = ?, phone = ?, address = ?,
         admission_status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      rollNo,
      student.full_name,
      student.father_name,
      student.course_id,
      student.age,
      student.phone,
      student.address,
      student.admission_status,
      studentId,
    ]
  );

  return getStudentById(studentId);
};

const deleteStudent = async (studentId) => {
  if (useInMemoryDb) {
    const studentIndex = inMemoryState.students.findIndex((item) => item.id === studentId);

    if (studentIndex === -1) {
      return false;
    }

    inMemoryState.students.splice(studentIndex, 1);
    inMemoryState.attendance = inMemoryState.attendance.filter((item) => item.student_id !== studentId);
    return true;
  }

  const [result] = await pool.query('DELETE FROM students WHERE id = ?', [studentId]);
  return result.affectedRows > 0;
};

const listEvents = async () => {
  if (useInMemoryDb) {
    return inMemoryState.events
      .map(decorateEvent)
      .sort((left, right) => String(left.event_date).localeCompare(String(right.event_date)));
  }

  const [rows] = await pool.query(
    `SELECT id, title, description, location, event_date, created_at, updated_at
     FROM events
     ORDER BY event_date ASC, id DESC`
  );

  return rows.map(mapEventRow);
};

const createEvent = async (eventItem) => {
  if (useInMemoryDb) {
    const timestamp = new Date().toISOString();
    const record = {
      id: inMemoryState.nextEventId++,
      title: eventItem.title,
      description: eventItem.description,
      location: eventItem.location,
      event_date: eventItem.event_date,
      created_at: timestamp,
      updated_at: timestamp,
    };

    inMemoryState.events.push(record);
    return decorateEvent(record);
  }

  const [result] = await pool.query(
    `INSERT INTO events (title, description, location, event_date)
     VALUES (?, ?, ?, ?)`,
    [eventItem.title, eventItem.description, eventItem.location, eventItem.event_date]
  );

  const [rows] = await pool.query(
    `SELECT id, title, description, location, event_date, created_at, updated_at
     FROM events
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return rows[0] ? mapEventRow(rows[0]) : null;
};

const updateEvent = async (eventId, eventItem) => {
  if (useInMemoryDb) {
    const currentEvent = inMemoryState.events.find((item) => item.id === eventId);

    if (!currentEvent) {
      return null;
    }

    currentEvent.title = eventItem.title;
    currentEvent.description = eventItem.description;
    currentEvent.location = eventItem.location;
    currentEvent.event_date = eventItem.event_date;
    currentEvent.updated_at = new Date().toISOString();

    return decorateEvent(currentEvent);
  }

  const [result] = await pool.query(
    `UPDATE events
     SET title = ?, description = ?, location = ?, event_date = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [eventItem.title, eventItem.description, eventItem.location, eventItem.event_date, eventId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT id, title, description, location, event_date, created_at, updated_at
     FROM events
     WHERE id = ?
     LIMIT 1`,
    [eventId]
  );

  return rows[0] ? mapEventRow(rows[0]) : null;
};

const deleteEvent = async (eventId) => {
  if (useInMemoryDb) {
    const eventIndex = inMemoryState.events.findIndex((item) => item.id === eventId);

    if (eventIndex === -1) {
      return false;
    }

    inMemoryState.events.splice(eventIndex, 1);
    return true;
  }

  const [result] = await pool.query('DELETE FROM events WHERE id = ?', [eventId]);
  return result.affectedRows > 0;
};

const getSiteContent = async () => {
  if (useInMemoryDb) {
    return clone(inMemoryState.siteContent);
  }

  const [rows] = await pool.query(
      `SELECT id, madarsa_name, logo_text, hero_title, hero_description, about_text, admission_text,
        contact_email, contact_phone, contact_address, footer_text, special_notice,
        donation_situation, donation_easypaisa, donation_jazzcash, donation_items,
        closed_days, open_days, updated_at
     FROM site_content
     WHERE id = 1
     LIMIT 1`
  );

  if (!rows[0]) {
    return {
      madarsa_name: 'Madarsa Islamia Darul Huda',
      logo_text: 'DH',
      hero_title: 'Madarsa website',
      hero_description: '',
      about_text: '',
      admission_text: '',
      contact_email: null,
      contact_phone: null,
      contact_address: null,
      footer_text: null,
      special_notice: null,
      closed_days: [...DEFAULT_CLOSED_DAYS],
      open_days: [...DEFAULT_OPEN_DAYS],
      updated_at: null,
    };
  }

  return {
    madarsa_name: rows[0].madarsa_name,
    logo_text: rows[0].logo_text,
    hero_title: rows[0].hero_title,
    hero_description: rows[0].hero_description,
    about_text: rows[0].about_text,
    admission_text: rows[0].admission_text,
    contact_email: rows[0].contact_email,
    contact_phone: rows[0].contact_phone,
    contact_address: rows[0].contact_address,
    footer_text: rows[0].footer_text,
    special_notice: rows[0].special_notice,
    donation_situation: rows[0].donation_situation || null,
    donation_easypaisa: rows[0].donation_easypaisa || null,
    donation_jazzcash: rows[0].donation_jazzcash || null,
    donation_items: rows[0].donation_items ? (() => {
      try { return JSON.parse(rows[0].donation_items); } catch (e) { return null; }
    })() : null,
    closed_days: deserializeScheduleDays(rows[0].closed_days),
    open_days: deserializeScheduleDays(rows[0].open_days),
    updated_at: toIsoString(rows[0].updated_at),
  };
};

const updateSiteContent = async (content) => {
  if (useInMemoryDb) {
    inMemoryState.siteContent = {
      ...inMemoryState.siteContent,
      ...content,
      updated_at: new Date().toISOString(),
    };

    // Persist to disk so changes survive restarts
    try {
      fs.writeFileSync(SITE_CONTENT_FILE, JSON.stringify(inMemoryState.siteContent, null, 2), 'utf8');
    } catch (err) {
      console.warn('Failed to persist site content to file:', err && err.message);
    }

    persistInMemoryState();
    return clone(inMemoryState.siteContent);
  }

  await pool.query(
     `INSERT INTO site_content
       (id, madarsa_name, logo_text, hero_title, hero_description, about_text, admission_text,
        contact_email, contact_phone, contact_address, footer_text, special_notice, donation_situation,
        donation_easypaisa, donation_jazzcash, donation_items, closed_days, open_days)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       madarsa_name = VALUES(madarsa_name),
       logo_text = VALUES(logo_text),
       hero_title = VALUES(hero_title),
       hero_description = VALUES(hero_description),
       about_text = VALUES(about_text),
       admission_text = VALUES(admission_text),
       contact_email = VALUES(contact_email),
       contact_phone = VALUES(contact_phone),
       contact_address = VALUES(contact_address),
       footer_text = VALUES(footer_text),
       special_notice = VALUES(special_notice),
      donation_situation = VALUES(donation_situation),
      donation_easypaisa = VALUES(donation_easypaisa),
      donation_jazzcash = VALUES(donation_jazzcash),
      donation_items = VALUES(donation_items),
      closed_days = VALUES(closed_days),
      open_days = VALUES(open_days),
       updated_at = CURRENT_TIMESTAMP`,
    [
      content.madarsa_name,
      content.logo_text,
      content.hero_title,
      content.hero_description,
      content.about_text,
      content.admission_text,
      content.contact_email,
      content.contact_phone,
      content.contact_address,
      content.footer_text,
      content.special_notice,
      content.donation_situation,
      content.donation_easypaisa,
      content.donation_jazzcash,
      content.donation_items ? JSON.stringify(content.donation_items) : null,
      serializeScheduleDays(content.closed_days),
      serializeScheduleDays(content.open_days),
    ]
  );

  return getSiteContent();
};

const buildWeeklySchedule = async (siteContent = null) => {
  const courses = await listCourses();
  const effectiveContent = siteContent || (await getSiteContent());
  const closedDaySet = new Set(
    Array.isArray(effectiveContent?.closed_days) && effectiveContent.closed_days.length > 0
      ? effectiveContent.closed_days
      : DEFAULT_CLOSED_DAYS
  );

  return WEEK_DAYS.map((day) => {
    const dayCourses = courses.filter((course) => course.schedule_days.includes(day));
    const isOpen = !closedDaySet.has(day);

    return {
      day,
      is_open: isOpen,
      note: !isOpen
        ? 'Weekly vacation'
        : dayCourses.length > 0
          ? `${dayCourses.length} class${dayCourses.length > 1 ? 'es' : ''} scheduled`
          : 'Madarsa open for regular class operations',
      courses: dayCourses.map((course) => ({
        id: course.id,
        title: course.title,
        teacher_name: course.teacher_name,
        start_time: course.start_time,
        end_time: course.end_time,
      })),
    };
  });
};

const getPublicBootstrap = async () => {
  const [content, courses, teachers, events, students, headAccountExists] = await Promise.all([
    getSiteContent(),
    listCourses(),
    listTeachers(),
    listEvents(),
    listStudents({}),
    hasHeadAccount(),
  ]);
  const activeCourses = courses.filter((course) => course.is_active);
  const weeklySchedule = await buildWeeklySchedule(content);

  return {
    siteContent: content,
    site_content: content,
    activeCourses,
    courses: activeCourses,
    recentEvents: events,
    teachers: teachers.map(decoratePublicTeacher),
    events,
    weekly_schedule: weeklySchedule,
    stats: {
      student_count: students.length,
      course_count: activeCourses.length,
      teacher_count: teachers.length,
    },
    auth: {
      has_head_account: headAccountExists,
      head_signup_allowed: !headAccountExists,
    },
  };
};

const searchStudentsPublic = async (filters = {}) => {
  const students = await listStudents(filters);

  return students.map((student) => ({
    admission_status: student.admission_status,
  }));
};

const createAdmission = async (student) => createStudent(student, { forceStatus: 'pending' });

const listAttendanceDates = async ({ course_id, teacher_id = null }) => {
  const course = await getCourseById(course_id);

  if (!course) {
    throw createHttpError(404, 'Course not found.');
  }

  if (teacher_id && course.teacher_id !== teacher_id) {
    throw createHttpError(403, 'You can only manage attendance for your assigned courses.');
  }

  if (useInMemoryDb) {
    const dates = Array.from(
      new Set(
        inMemoryState.attendance
          .filter((record) => record.course_id === course_id)
          .map((record) => record.attendance_date)
      )
    );

    return dates.sort((left, right) => right.localeCompare(left));
  }

  const [rows] = await pool.query(
    `SELECT DISTINCT attendance_date
     FROM attendance_records
     WHERE course_id = ?
     ORDER BY attendance_date DESC`,
    [course_id]
  );

  return rows.map((row) => toDateString(row.attendance_date));
};

const getAttendanceByCourseAndDate = async ({ course_id, attendance_date, teacher_id = null }) => {
  const course = await getCourseById(course_id);

  if (!course) {
    throw createHttpError(404, 'Course not found.');
  }

  if (teacher_id && course.teacher_id !== teacher_id) {
    throw createHttpError(403, 'You can only manage attendance for your assigned courses.');
  }

  if (useInMemoryDb) {
    const students = inMemoryState.students
      .filter((student) => student.course_id === course_id)
      .map(decorateStudent)
      .sort((left, right) => left.roll_no.localeCompare(right.roll_no));

    const recordsByStudentId = new Map(
      inMemoryState.attendance
        .filter((record) => record.course_id === course_id && record.attendance_date === attendance_date)
        .map((record) => [record.student_id, record])
    );

    return {
      course,
      attendance_date,
      students: students.map((student) => ({
        student_id: student.id,
        roll_no: student.roll_no,
        full_name: student.full_name,
        status: recordsByStudentId.get(student.id)?.status || 'present',
        remarks: recordsByStudentId.get(student.id)?.remarks || '',
      })),
    };
  }

  const [studentRows] = await pool.query(
    `SELECT s.id, s.roll_no, s.full_name
     FROM students s
     WHERE s.course_id = ?
     ORDER BY s.roll_no ASC, s.full_name ASC`,
    [course_id]
  );

  const [attendanceRows] = await pool.query(
    `SELECT student_id, status, remarks
     FROM attendance_records
     WHERE course_id = ? AND attendance_date = ?`,
    [course_id, attendance_date]
  );

  const attendanceMap = new Map(attendanceRows.map((row) => [row.student_id, row]));

  return {
    course,
    attendance_date,
    students: studentRows.map((row) => ({
      student_id: row.id,
      roll_no: row.roll_no,
      full_name: row.full_name,
      status: attendanceMap.get(row.id)?.status || 'present',
      remarks: attendanceMap.get(row.id)?.remarks || '',
    })),
  };
};

const saveAttendanceEntries = async ({ course_id, attendance_date, entries, teacher_id = null }) => {
  const course = await getCourseById(course_id);

  if (!course) {
    throw createHttpError(404, 'Course not found.');
  }

  if (teacher_id && course.teacher_id !== teacher_id) {
    throw createHttpError(403, 'You can only manage attendance for your assigned courses.');
  }

  const effectiveTeacherId = teacher_id || course.teacher_id;
  const students = await listStudents({ course_id });
  const validStudentIds = new Set(students.map((student) => student.id));

  for (const entry of entries) {
    if (!validStudentIds.has(entry.student_id)) {
      throw createHttpError(400, 'Attendance entries must belong to students of the selected course.');
    }
  }

  if (useInMemoryDb) {
    entries.forEach((entry) => {
      const existingRecord = inMemoryState.attendance.find(
        (item) =>
          item.course_id === course_id &&
          item.student_id === entry.student_id &&
          item.attendance_date === attendance_date
      );

      if (existingRecord) {
        existingRecord.teacher_id = effectiveTeacherId;
        existingRecord.status = entry.status;
        existingRecord.remarks = entry.remarks;
        existingRecord.updated_at = new Date().toISOString();
        return;
      }

      const timestamp = new Date().toISOString();
      inMemoryState.attendance.push({
        id: inMemoryState.nextAttendanceId++,
        course_id,
        teacher_id: effectiveTeacherId,
        student_id: entry.student_id,
        attendance_date,
        status: entry.status,
        remarks: entry.remarks,
        created_at: timestamp,
        updated_at: timestamp,
      });
    });

    return getAttendanceByCourseAndDate({ course_id, attendance_date, teacher_id: effectiveTeacherId });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const entry of entries) {
      await connection.query(
        `INSERT INTO attendance_records
           (attendance_date, course_id, teacher_id, student_id, status, remarks)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           teacher_id = VALUES(teacher_id),
           status = VALUES(status),
           remarks = VALUES(remarks),
           updated_at = CURRENT_TIMESTAMP`,
        [attendance_date, course_id, effectiveTeacherId, entry.student_id, entry.status, entry.remarks]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getAttendanceByCourseAndDate({ course_id, attendance_date, teacher_id: effectiveTeacherId });
};

const getTeacherOverview = async (teacherId) => {
  const teacher = await getTeacherById(teacherId, { role: 'teacher' });

  if (!teacher) {
    return null;
  }

  const courses = (await listCourses()).filter((course) => course.teacher_id === teacherId);
  return { teacher, courses };
};

const getAdminDashboard = async () => {
  const [students, courses, teachers, events] = await Promise.all([
    listStudents({}),
    listCourses(),
    listTeachers(),
    listEvents(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  let attendanceMarkedCourses = 0;

  if (useInMemoryDb) {
    attendanceMarkedCourses = new Set(
      inMemoryState.attendance
        .filter((record) => record.attendance_date === today)
        .map((record) => record.course_id)
    ).size;
  } else {
    const [rows] = await pool.query(
      `SELECT COUNT(DISTINCT course_id) AS attendance_marked_courses
       FROM attendance_records
       WHERE attendance_date = ?`,
      [today]
    );

    attendanceMarkedCourses = Number(rows[0]?.attendance_marked_courses || 0);
  }

  return {
    metrics: {
      student_count: students.length,
      active_student_count: students.filter((student) => student.admission_status === 'active').length,
      teacher_count: teachers.length,
      course_count: courses.length,
      upcoming_event_count: events.filter((eventItem) => eventItem.event_date >= today).length,
      attendance_marked_courses: attendanceMarkedCourses,
    },
    latest_students: students.slice(0, 5),
    upcoming_events: events.filter((eventItem) => eventItem.event_date >= today).slice(0, 5),
  };
};

module.exports = {
  createAdmission,
  createCourse,
  createEvent,
  createHeadAccount,
  createStudent,
  createTeacher,
  deleteCourse,
  deleteEvent,
  deleteHeadAccount,
  deleteStudent,
  deleteTeacher,
  getAdminDashboard,
  getAttendanceByCourseAndDate,
  getCourseById,
  getPublicBootstrap,
  listAttendanceDates,
  getSiteContent,
  getStudentById,
  getTeacherById,
  getTeacherCredentialsByEmail,
  getTeacherOverview,
  hasHeadAccount,
  listCourses,
  listEvents,
  listStudents,
  listTeachers,
  requestPasswordReset,
  saveAttendanceEntries,
  searchStudentsPublic,
  resetPasswordWithToken,
  updateCourse,
  updateEvent,
  updateSiteContent,
  updateStudent,
  updateTeacher,
  useInMemoryDb,
  verifyConnection,
};
