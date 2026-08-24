CREATE DATABASE IF NOT EXISTS madarsa_db;
USE madarsa_db;

CREATE TABLE IF NOT EXISTS teachers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(160) NOT NULL,
  role ENUM('head', 'teacher') NOT NULL DEFAULT 'teacher',
  phone VARCHAR(20) NULL,
  qualification VARCHAR(180) NULL,
  bio TEXT NULL,
  profile_image MEDIUMTEXT NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_reset_token_hash VARCHAR(255) NULL,
  password_reset_expires_at TIMESTAMP NULL DEFAULT NULL,
  password_reset_requested_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teachers_email (email)
);

CREATE TABLE IF NOT EXISTS courses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT NULL,
  teacher_id INT UNSIGNED NOT NULL,
  start_time CHAR(5) NOT NULL,
  end_time CHAR(5) NOT NULL,
  schedule_days TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_code (code),
  CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id)
);

CREATE TABLE IF NOT EXISTS students (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  roll_no VARCHAR(40) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  father_name VARCHAR(150) NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  age TINYINT UNSIGNED NULL,
  phone VARCHAR(20) NULL,
  address VARCHAR(300) NULL,
  admission_status ENUM('pending', 'active', 'inactive', 'graduated') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_roll_no (roll_no),
  KEY idx_students_course_id (course_id),
  KEY idx_students_full_name (full_name),
  CONSTRAINT fk_students_course FOREIGN KEY (course_id) REFERENCES courses (id)
);

CREATE TABLE IF NOT EXISTS events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(180) NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_events_event_date (event_date)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  attendance_date DATE NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  teacher_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  status ENUM('present', 'absent', 'leave') NOT NULL,
  remarks VARCHAR(200) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_day (attendance_date, course_id, student_id),
  KEY idx_attendance_course_date (course_id, attendance_date),
  CONSTRAINT fk_attendance_course FOREIGN KEY (course_id) REFERENCES courses (id),
  CONSTRAINT fk_attendance_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id),
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students (id)
);

CREATE TABLE IF NOT EXISTS site_content (
  id TINYINT UNSIGNED NOT NULL,
  madarsa_name VARCHAR(180) NOT NULL,
  logo_text VARCHAR(60) NOT NULL,
  hero_title VARCHAR(180) NOT NULL,
  hero_description TEXT NOT NULL,
  about_text TEXT NOT NULL,
  admission_text TEXT NOT NULL,
  contact_email VARCHAR(160) NULL,
  contact_phone VARCHAR(30) NULL,
  contact_address VARCHAR(300) NULL,
  footer_text VARCHAR(220) NULL,
  special_notice VARCHAR(240) NULL,
  donation_items TEXT NULL,
  donation_situation TEXT NULL,
  donation_easypaisa VARCHAR(60) NULL,
  donation_jazzcash VARCHAR(60) NULL,
  closed_days TEXT NOT NULL,
  open_days TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT INTO site_content (
  id,
  madarsa_name,
  logo_text,
  hero_title,
  hero_description,
  about_text,
  admission_text,
  contact_email,
  contact_phone,
  contact_address,
  footer_text,
  special_notice,
  donation_situation,
  donation_easypaisa,
  donation_jazzcash,
  donation_items,
  closed_days,
  open_days
)
VALUES (
  1,
  'Madarsa Islamia Darul Huda',
  'DH',
  'A trusted digital home for your madarsa community',
  'Share your mission, manage admissions, organize classes, and let teachers record daily attendance from one place.',
  'Madarsa Islamia Darul Huda is dedicated to nurturing Quranic learning, strong character, and a disciplined love for sacred knowledge in a well-organized environment.',
  'Families can submit admission details online. The head of the madarsa can review students, assign courses, and manage progress through the admin section.',
  'info@darulhuda.local',
  '+92 300 1234567',
  'Main Road, Community Campus, Pakistan',
  'Madarsa Islamia Darul Huda. Serving students with sincerity and structure.',
  'You can replace the landing page hero picture later with your own madarsa image.',
  'Help us provide food, uniforms and tuition for needy students this month.',
  JSON_ARRAY(
    JSON_OBJECT('title', 'Student Relief Fund', 'message', 'Provide immediate assistance for education, uniforms and meals for the most needy families.', 'easypaisa', '+92 300 1234567', 'jazzcash', '+92 321 7654321')
  ),
  '+92 300 1234567',
  '+92 321 7654321',
  '["Thursday","Friday"]',
  '["Saturday","Sunday","Monday","Tuesday","Wednesday"]'
)
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
  donation_items = VALUES(donation_items),
  donation_situation = VALUES(donation_situation),
  donation_easypaisa = VALUES(donation_easypaisa),
  donation_jazzcash = VALUES(donation_jazzcash),
  closed_days = VALUES(closed_days),
  open_days = VALUES(open_days);
