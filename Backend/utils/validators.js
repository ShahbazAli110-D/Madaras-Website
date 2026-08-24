const WEEK_DAYS = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

const DEFAULT_OPEN_DAYS = WEEK_DAYS.filter((day) => !['Thursday', 'Friday'].includes(day));
const DEFAULT_CLOSED_DAYS = ['Thursday', 'Friday'];
const ATTENDANCE_STATUSES = ['present', 'absent', 'leave'];
const ADMISSION_STATUSES = ['pending', 'active', 'inactive', 'graduated'];

const sanitizeString = (value, maxLength = 255) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
};

const sanitizeText = (value, maxLength = 2000) => sanitizeString(value, maxLength);

const parseProfileImage = (value) => {
  if (value === undefined || value === null || value === '') {
    return { value: null };
  }

  const image = String(value).trim();
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image)) {
    return { error: 'profile_image must be a JPEG, PNG, or WebP image.' };
  }

  if (image.length > 1500000) {
    return { error: 'profile_image must be smaller than 1 MB.' };
  }

  return { value: image };
};

const normalizeCode = (value, fallback = 'COURSE') => {
  const rawCode = sanitizeString(value, 40);

  if (!rawCode) {
    return fallback;
  }

  return rawCode
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
};

const normalizeDayName = (value) => {
  const normalized = sanitizeString(value, 20).toLowerCase();
  return WEEK_DAYS.find((day) => day.toLowerCase() === normalized) || null;
};

const normalizeScheduleDays = (value) => {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const normalizedValues = Array.from(
    new Set(rawValues.map(normalizeDayName).filter(Boolean))
  );

  return normalizedValues.length > 0 ? normalizedValues : [...DEFAULT_OPEN_DAYS];
};

const parsePositiveInt = (value) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
};

const parseOptionalAge = (value) => {
  if (value === undefined || value === null || value === '') {
    return { value: null };
  }

  const age = Number(value);

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    return { error: 'age must be a whole number between 1 and 120.' };
  }

  return { value: age };
};

const parseOptionalPhone = (value) => {
  if (value === undefined || value === null || value === '') {
    return { value: null };
  }

  const phone = String(value).trim();

  if (phone.length < 7 || phone.length > 20) {
    return { error: 'phone must be between 7 and 20 characters.' };
  }

  return { value: phone };
};

const parseOptionalDate = (value, fieldName = 'date') => {
  if (!value) {
    return { value: null };
  }

  const dateValue = sanitizeString(value, 20);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return { error: `${fieldName} must use YYYY-MM-DD format.` };
  }

  return { value: dateValue };
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateAdminLoginPayload = (payload = {}) => {
  const identifier = sanitizeString(payload.email || payload.username || payload.identifier, 160).toLowerCase();
  const password = sanitizeString(payload.password, 120);

  if (!identifier || !password) {
    return { error: 'email or username and password are required.' };
  }

  return { value: { identifier, password } };
};

const validateTeacherLoginPayload = (payload = {}) => {
  const email = sanitizeString(payload.email, 160).toLowerCase();
  const password = sanitizeString(payload.password, 120);

  if (!email || !password) {
    return { error: 'email and password are required.' };
  }

  if (!isValidEmail(email)) {
    return { error: 'A valid teacher email is required.' };
  }

  return { value: { email, password } };
};

const validateForgotPasswordPayload = (payload = {}) => {
  const email = sanitizeString(payload.email, 160).toLowerCase();

  if (!email) {
    return { error: 'email is required.' };
  }

  if (!isValidEmail(email)) {
    return { error: 'A valid email is required.' };
  }

  return { value: { email } };
};

const validateContactMessagePayload = (payload = {}) => {
  const name = sanitizeString(payload.name, 120);
  const email = sanitizeString(payload.email, 160).toLowerCase();
  const message = sanitizeText(payload.message, 3000);

  if (!name || !email || !message) {
    return { error: 'name, email, and message are required.' };
  }

  if (!isValidEmail(email)) {
    return { error: 'A valid email address is required.' };
  }

  return { value: { name, email, message } };
};

const validatePasswordResetPayload = (payload = {}) => {
  const token = sanitizeString(payload.token, 255);
  const password = sanitizeString(payload.password, 120);

  if (!token || !password) {
    return { error: 'token and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'password must be at least 6 characters long.' };
  }

  return {
    value: {
      token,
      password,
    },
  };
};

const validateStudentPayload = (payload = {}) => {
  const fullName = sanitizeString(payload.full_name, 150);
  const fatherName = sanitizeString(payload.father_name, 150);
  const rollNo = sanitizeString(payload.roll_no, 40).toUpperCase();
  const address = sanitizeText(payload.address, 300);
  const admissionStatus = sanitizeString(payload.admission_status, 20).toLowerCase() || 'pending';
  const courseId = parsePositiveInt(payload.course_id);

  if (!fullName || !fatherName || !courseId) {
    return { error: 'full_name, father_name, and course_id are required.' };
  }

  if (!ADMISSION_STATUSES.includes(admissionStatus)) {
    return {
      error: `admission_status must be one of: ${ADMISSION_STATUSES.join(', ')}.`,
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
      roll_no: rollNo || null,
      full_name: fullName,
      father_name: fatherName,
      course_id: courseId,
      age: ageResult.value,
      phone: phoneResult.value,
      address: address || null,
      admission_status: admissionStatus,
    },
  };
};

const validateStudentQuery = (query = {}) => {
  return {
    value: {
      search: sanitizeString(query.search, 120),
      roll_no: sanitizeString(query.roll_no, 40).toUpperCase(),
      course_id: parsePositiveInt(query.course_id),
      admission_status: sanitizeString(query.admission_status, 20).toLowerCase(),
    },
  };
};

const validateTeacherPayload = (payload = {}, options = {}) => {
  const fullName = sanitizeString(payload.full_name, 150);
  const email = sanitizeString(payload.email, 160).toLowerCase();
  const phoneResult = parseOptionalPhone(payload.phone);
  const qualification = sanitizeString(payload.qualification, 180);
  const bio = sanitizeText(payload.bio, 500);
  const password = sanitizeString(payload.password, 120);
  const profileImageResult = parseProfileImage(payload.profile_image);

  if (!options.partial || fullName || email || qualification || bio || password || payload.phone) {
    if (!fullName || !email) {
      return { error: 'full_name and email are required.' };
    }

    if (!isValidEmail(email)) {
      return { error: 'A valid teacher email is required.' };
    }
  }

  if (phoneResult.error) {
    return phoneResult;
  }

  if (profileImageResult.error) {
    return profileImageResult;
  }

  if (options.requirePassword && password.length < 6) {
    return { error: 'password must be at least 6 characters long.' };
  }

  return {
    value: {
      full_name: fullName,
      email,
      phone: phoneResult.value,
      qualification: qualification || null,
      bio: bio || null,
      profile_image: profileImageResult.value,
      password: password || null,
    },
  };
};

const validateCoursePayload = (payload = {}) => {
  const title = sanitizeString(payload.title, 150);
  const code = normalizeCode(payload.code, normalizeCode(title, 'COURSE'));
  const description = sanitizeText(payload.description, 500);
  const teacherId = parsePositiveInt(payload.teacher_id);
  const startTime = sanitizeString(payload.start_time, 10);
  const endTime = sanitizeString(payload.end_time, 10);
  const scheduleDays = normalizeScheduleDays(payload.schedule_days);
  const isActive =
    payload.is_active === false ||
    payload.is_active === 'false' ||
    payload.is_active === 0 ||
    payload.is_active === '0'
      ? false
      : true;

  if (!title || !teacherId || !startTime || !endTime) {
    return { error: 'title, teacher_id, start_time, and end_time are required.' };
  }

  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return { error: 'start_time and end_time must use HH:MM format.' };
  }

  return {
    value: {
      title,
      code,
      description: description || null,
      teacher_id: teacherId,
      start_time: startTime,
      end_time: endTime,
      schedule_days: scheduleDays,
      is_active: isActive,
    },
  };
};

const validateEventPayload = (payload = {}) => {
  const title = sanitizeString(payload.title, 150);
  const description = sanitizeText(payload.description, 500);
  const location = sanitizeString(payload.location, 180);
  const dateResult = parseOptionalDate(payload.event_date, 'event_date');

  if (!title || !dateResult.value || !description) {
    return { error: 'title, event_date, and description are required.' };
  }

  if (dateResult.error) {
    return dateResult;
  }

  return {
    value: {
      title,
      description,
      location: location || null,
      event_date: dateResult.value,
    },
  };
};

const validateAttendancePayload = (payload = {}) => {
  const courseId = parsePositiveInt(payload.course_id);
  const dateResult = parseOptionalDate(payload.attendance_date, 'attendance_date');
  const entries = Array.isArray(payload.entries) ? payload.entries : [];

  if (!courseId || !dateResult.value || entries.length === 0) {
    return {
      error: 'course_id, attendance_date, and at least one attendance entry are required.',
    };
  }

  if (dateResult.error) {
    return dateResult;
  }

  const normalizedEntries = [];

  for (const entry of entries) {
    const studentId = parsePositiveInt(entry.student_id);
    const status = sanitizeString(entry.status, 20).toLowerCase();
    const remarks = sanitizeText(entry.remarks, 200);

    if (!studentId || !ATTENDANCE_STATUSES.includes(status)) {
      return {
        error: `attendance entries must include valid student_id and status (${ATTENDANCE_STATUSES.join(
          ', '
        )}).`,
      };
    }

    normalizedEntries.push({
      student_id: studentId,
      status,
      remarks: remarks || null,
    });
  }

  return {
    value: {
      course_id: courseId,
      attendance_date: dateResult.value,
      entries: normalizedEntries,
    },
  };
};

const validateSiteContentPayload = (payload = {}) => {
  const madarsaName = sanitizeString(payload.madarsa_name, 180);
  const logoText = sanitizeString(payload.logo_text, 60);
  const heroTitle = sanitizeString(payload.hero_title, 180);
  const heroDescription = sanitizeText(payload.hero_description, 500);
  const aboutText = sanitizeText(payload.about_text, 1200);
  const admissionText = sanitizeText(payload.admission_text, 800);
  const contactEmail = sanitizeString(payload.contact_email, 160).toLowerCase();
  const contactPhone = sanitizeString(payload.contact_phone, 30);
  const contactAddress = sanitizeText(payload.contact_address, 300);
  const footerText = sanitizeText(payload.footer_text, 220);
  const specialNotice = sanitizeText(payload.special_notice, 240);
  const donationSituation = sanitizeText(payload.donation_situation, 900);
  const donationEasypaisa = sanitizeString(payload.donation_easypaisa, 60);
  const donationJazzCash = sanitizeString(payload.donation_jazzcash, 60);
  let donationItems = null;

  if (payload.donation_items !== undefined) {
    const items = Array.isArray(payload.donation_items) ? payload.donation_items : [];
    const normalized = [];

    for (const it of items) {
      if (typeof it !== 'object' || it === null) continue;
      const title = sanitizeString(it.title, 180);
      const message = sanitizeText(it.message, 900);
      const easypaisa = sanitizeString(it.easypaisa || it.donation_easypaisa, 60);
      const jazzcash = sanitizeString(it.jazzcash || it.donation_jazzcash, 60);

      if (!title && !message && !easypaisa && !jazzcash) continue;

      normalized.push({
        title: title || null,
        message: message || null,
        easypaisa: easypaisa || null,
        jazzcash: jazzcash || null,
      });
    }

    donationItems = normalized.length > 0 ? normalized : null;
  }

  if (!madarsaName || !heroTitle || !heroDescription || !aboutText || !admissionText) {
    return {
      error:
        'madarsa_name, hero_title, hero_description, about_text, and admission_text are required.',
    };
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    return { error: 'contact_email must be a valid email address.' };
  }

  const hasOpenDays = payload.open_days !== undefined;
  const hasClosedDays = payload.closed_days !== undefined;

  let openDays = hasOpenDays ? normalizeScheduleDays(payload.open_days) : [...DEFAULT_OPEN_DAYS];
  let closedDays = hasClosedDays
    ? normalizeScheduleDays(payload.closed_days)
    : [...DEFAULT_CLOSED_DAYS];

  if (hasOpenDays && !hasClosedDays) {
    closedDays = WEEK_DAYS.filter((day) => !openDays.includes(day));
  } else if (!hasOpenDays && hasClosedDays) {
    openDays = WEEK_DAYS.filter((day) => !closedDays.includes(day));
  } else if (hasOpenDays && hasClosedDays) {
    const closedDaySet = new Set(closedDays);
    openDays = WEEK_DAYS.filter((day) => !closedDaySet.has(day));
    closedDays = WEEK_DAYS.filter((day) => closedDaySet.has(day));
  }

  return {
    value: {
      madarsa_name: madarsaName,
      logo_text: logoText || 'DH',
      hero_title: heroTitle,
      hero_description: heroDescription,
      about_text: aboutText,
      admission_text: admissionText,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      contact_address: contactAddress || null,
      footer_text: footerText || null,
      special_notice: specialNotice || null,
      donation_situation: donationSituation || null,
      donation_easypaisa: donationEasypaisa || null,
      donation_jazzcash: donationJazzCash || null,
      donation_items: donationItems,
      closed_days: closedDays,
      open_days: openDays,
    },
  };
};

module.exports = {
  ADMISSION_STATUSES,
  ATTENDANCE_STATUSES,
  DEFAULT_CLOSED_DAYS,
  DEFAULT_OPEN_DAYS,
  WEEK_DAYS,
  normalizeCode,
  normalizeScheduleDays,
  parsePositiveInt,
  sanitizeString,
  validateAdminLoginPayload,
  validateAttendancePayload,
  validateCoursePayload,
  validateContactMessagePayload,
  validateEventPayload,
  validateForgotPasswordPayload,
  validateSiteContentPayload,
  validateStudentPayload,
  validateStudentQuery,
  validatePasswordResetPayload,
  validateTeacherLoginPayload,
  validateTeacherPayload,
};
