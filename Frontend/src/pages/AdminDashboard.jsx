import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const WEEK_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_COURSE_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

const buildCourseForm = (course = {}, fallbackTeacherId = '') => ({
  id: course.id,
  title: course.title || '',
  code: course.code || '',
  description: course.description || '',
  teacher_id: course.teacher_id ?? fallbackTeacherId,
  start_time: course.start_time || '08:00',
  end_time: course.end_time || '10:00',
  schedule_days: Array.isArray(course.schedule_days) ? [...course.schedule_days] : [...DEFAULT_COURSE_DAYS],
  is_active: typeof course.is_active === 'boolean' ? course.is_active : true,
});

export default function AdminDashboard({ user, onLogout, onAdminProfileUpdated }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  
  // Lists
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Site settings
  const [siteConfig, setSiteConfig] = useState({
    madarsa_name: '',
    logo_text: '',
    hero_title: '',
    hero_description: '',
    about_text: '',
    admission_text: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    footer_text: '',
    special_notice: '',
    donation_situation: '',
    donation_easypaisa: '',
    donation_jazzcash: '',
    closed_days: '["Thursday","Friday"]',
    open_days: '["Saturday","Sunday","Monday","Tuesday","Wednesday"]'
  });

  // Donation items list (dynamic)
  const [donationList, setDonationList] = useState([]);
  const [donationForm, setDonationForm] = useState(null); // { title, message, easypaisa, jazzcash, idx }

  // Edit / Form state
  const [studentForm, setStudentForm] = useState(null); // { id, full_name, father_name, age, course_id, phone, address, admission_status }
  const [teacherForm, setTeacherForm] = useState(null); // { id, full_name, email, phone, qualification, bio, password }
  const [courseForm, setCourseForm] = useState(null);   // { id, title, code, description, teacher_id, start_time, end_time, schedule_days: [] }
  const [eventForm, setEventForm] = useState(null);     // { id, title, description, location, event_date }

  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [adminProfileImage, setAdminProfileImage] = useState(user?.profile_image || '');

  useEffect(() => {
    fetchDashboardDetails();
  }, []);

  const showMsg = (msg, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setTimeout(() => setActionError(''), 5000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(''), 5000);
    }
  };

  const notifyPublicContentUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('madarsa:content-updated'));
    }
  };

  const fetchDashboardDetails = async () => {
    try {
      setLoading(true);
      const [metrics, publicData] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/public/bootstrap'),
      ]);
      setDashboardData(metrics);

      // Load all lists
      const stList = await api.get('/admin/students');
      setStudents(stList);

      const tcList = await api.get('/admin/teachers');
      setTeachers(tcList.length > 0 ? tcList : (publicData?.teachers || []));

      const coList = await api.get('/admin/courses');
      setCourses(coList);

      const evList = await api.get('/admin/events');
      setEvents(evList);

      const siteData = await api.get('/admin/site-content');
      if (siteData) {
        setSiteConfig({
          ...siteData,
          closed_days: typeof siteData.closed_days === 'string' ? siteData.closed_days : JSON.stringify(siteData.closed_days),
          open_days: typeof siteData.open_days === 'string' ? siteData.open_days : JSON.stringify(siteData.open_days)
        });
        setDonationList(Array.isArray(siteData.donation_items) ? siteData.donation_items : []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showMsg('Failed to load portal databases.', true);
    } finally {
      setLoading(false);
    }
  };

  // Student Actions
  const handleApproveStudent = async (studentId) => {
    try {
      const studentObj = students.find((s) => s.id === studentId);
      if (!studentObj) return;
      await api.put(`/admin/students/${studentId}`, {
        ...studentObj,
        admission_status: 'active'
      });
      showMsg('Student registry approved successfully!');
      await fetchDashboardDetails();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleRejectStudent = async (studentId) => {
    try {
      const studentObj = students.find((s) => s.id === studentId);
      if (!studentObj) return;
      await api.put(`/admin/students/${studentId}`, {
        ...studentObj,
        admission_status: 'inactive'
      });
      showMsg('Student registration rejected and marked inactive.');
      await fetchDashboardDetails();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...studentForm,
        course_id: Number(studentForm.course_id),
        age: studentForm.age ? Number(studentForm.age) : null
      };

      if (studentForm.id) {
        await api.put(`/admin/students/${studentForm.id}`, payload);
        showMsg('Student registry updated.');
      } else {
        await api.post('/admin/students', payload);
        showMsg('New student added successfully.');
      }
      setStudentForm(null);
      fetchDashboardDetails();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student registration?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      showMsg('Student record removed.');
      await fetchDashboardDetails();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  // Teacher Actions
  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      if (teacherForm.id) {
        await api.put(`/admin/teachers/${teacherForm.id}`, teacherForm);
        showMsg(`Teacher profile updated successfully for ${teacherForm.full_name}.`);
      } else {
        const result = await api.post('/admin/teachers', teacherForm);
        teacherForm.id = result.teacher?.id;
        showMsg(`New teacher profile created successfully for ${teacherForm.full_name}.`);
      }
      const selectedCourseIds = new Set((teacherForm.course_ids || []).map(Number));
      for (const course of courses) {
        if (selectedCourseIds.has(course.id) && String(course.teacher_id) !== String(teacherForm.id)) {
          await api.put(`/admin/courses/${course.id}`, { ...course, teacher_id: Number(teacherForm.id) });
        }
      }
      setTeacherForm(null);
      await fetchDashboardDetails();
      notifyPublicContentUpdated();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Delete this teacher? Ensure no courses are currently assigned to them.')) return;
    try {
      await api.delete(`/admin/teachers/${id}`);
      showMsg('Teacher record removed.');
      await fetchDashboardDetails();
      notifyPublicContentUpdated();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteAllTeachers = async () => {
    if (!window.confirm('Delete ALL teachers, their assigned courses, and students enrolled in those courses? The head admin account will remain.')) return;
    try {
      const result = await api.delete('/admin/teachers');
      showMsg(`${result.teachers_deleted || 0} teachers and ${result.courses_deleted || 0} courses deleted.`);
      setTeacherForm(null);
      setCourseForm(null);
      await fetchDashboardDetails();
      notifyPublicContentUpdated();
    } catch (err) {
      showMsg(err.message || 'Failed to delete all teachers.', true);
    }
  };

  // Course Actions
  const toggleCourseDay = (day) => {
    setCourseForm((current) => {
      if (!current) return current;
      const selectedDays = Array.isArray(current.schedule_days) ? current.schedule_days : [];
      const nextDays = selectedDays.includes(day)
        ? selectedDays.filter((item) => item !== day)
        : [...selectedDays, day];

      return { ...current, schedule_days: nextDays };
    });
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      if (!Array.isArray(courseForm.schedule_days) || courseForm.schedule_days.length === 0) {
        showMsg('Select at least one schedule day for this course.', true);
        return;
      }

      const previousCourse = courseForm.id ? courses.find((item) => item.id === courseForm.id) : null;
      const selectedTeacher = teachers.find((teacher) => String(teacher.id) === String(courseForm.teacher_id));
      const selectedTeacherName = selectedTeacher?.full_name || 'Selected instructor';
      const timingChanged = previousCourse
        ? previousCourse.start_time !== courseForm.start_time || previousCourse.end_time !== courseForm.end_time
        : true;
      const instructorChanged = previousCourse
        ? String(previousCourse.teacher_id) !== String(courseForm.teacher_id)
        : true;
      const daysChanged = previousCourse
        ? JSON.stringify(previousCourse.schedule_days || []) !== JSON.stringify(courseForm.schedule_days || [])
        : true;
      const changeSummary = [];

      if (instructorChanged) {
        changeSummary.push(`Instructor: ${selectedTeacherName}`);
      }

      if (timingChanged) {
        changeSummary.push(`Timing: ${courseForm.start_time} - ${courseForm.end_time}`);
      }

      if (daysChanged) {
        changeSummary.push(`Days: ${courseForm.schedule_days.join(', ')}`);
      }

      const payload = {
        ...courseForm,
        teacher_id: courseForm.teacher_id ? Number(courseForm.teacher_id) : null,
        schedule_days: [...courseForm.schedule_days],
        is_active: Boolean(courseForm.is_active)
      };

      if (courseForm.id) {
        await api.put(`/admin/courses/${courseForm.id}`, payload);
        showMsg(`${courseForm.title} updated. ${changeSummary.join(' | ') || 'Schedule saved.'}`);
      } else {
        await api.post('/admin/courses', payload);
        showMsg(`${courseForm.title} published. ${changeSummary.join(' | ') || 'Schedule saved.'}`);
      }
      setCourseForm(null);
      await fetchDashboardDetails();
      notifyPublicContentUpdated();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course? All students under this course must be reassigned first.')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      showMsg('Course removed.');
      await fetchDashboardDetails();
      notifyPublicContentUpdated();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  // Event Actions
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      if (eventForm.id) {
        await api.put(`/admin/events/${eventForm.id}`, eventForm);
        showMsg('Event details updated.');
      } else {
        await api.post('/admin/events', eventForm);
        showMsg('New event announced.');
      }
      setEventForm(null);
      await fetchDashboardDetails();
      notifyPublicContentUpdated();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event notice?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      showMsg('Event deleted.');
      await fetchDashboardDetails();
      notifyPublicContentUpdated();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  // Site Configurations
  const handleSaveSiteConfig = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...siteConfig,
        closed_days: JSON.parse(siteConfig.closed_days),
        open_days: JSON.parse(siteConfig.open_days),
        donation_items: donationList
      };
      await api.put('/admin/site-content', payload);
      showMsg('Site settings updated successfully.');
      await fetchDashboardDetails();
      notifyPublicContentUpdated();
    } catch (err) {
      showMsg('Verify format: closed_days & open_days must be valid JSON string arrays.', true);
    }
  };

  const saveAdminProfile = async (event) => {
    event.preventDefault();
    try {
      const result = await api.put('/admin/profile', {
        full_name: user?.display_name || 'Head of Madarsa',
        email: user?.email || '',
        profile_image: adminProfileImage || null,
      });
      if (result.account) {
        onAdminProfileUpdated?.(result.account);
      }
      showMsg('Admin profile picture updated successfully.');
    } catch (err) {
      showMsg(err.message || 'Failed to update admin profile.', true);
    }
  };

  const dashboardMetrics = dashboardData?.metrics || {};
  const pendingStudentCount = students.filter((student) => student.admission_status === 'pending').length;
  const activeStudentCount = students.filter((student) => student.admission_status === 'active').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading database panels...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '85vh', backgroundColor: 'var(--white)' }}>
      {actionSuccess && (
        <div
          role="status"
          aria-live="polite"
          onClick={() => setActionSuccess('')}
          style={{
            position: 'fixed',
            top: '1.25rem',
            right: '1.25rem',
            zIndex: 50,
            maxWidth: '360px',
            padding: '1rem 1.1rem',
            borderRadius: '14px',
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.15)',
            cursor: 'pointer'
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Success</strong>
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          onClick={() => setActionError('')}
          style={{
            position: 'fixed',
            top: '1.25rem',
            right: '1.25rem',
            zIndex: 60,
            maxWidth: '360px',
            padding: '1rem 1.1rem',
            borderRadius: '14px',
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.15)',
            cursor: 'pointer'
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Error</strong>
          <span>{actionError}</span>
        </div>
      )}

      {/* Sidebar Panel */}
      <div style={{
        background: 'var(--gray-50)',
        borderRight: '1px solid var(--gray-200)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem'
      }}>
        <h4 style={{ color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: '1rem' }}>
          Head of Madarsa Dashboard
        </h4>
        {[
          { id: 'dashboard', label: '📊 Metrics Overview' },
          { id: 'students', label: '🎓 Students' },
          { id: 'teachers', label: '👨‍🏫 Teachers' },
          { id: 'courses', label: '📚 Course Catalog' },
          { id: 'events', label: '📅 Special Events' },
          { id: 'site_settings', label: '⚙️ Website Settings' },
          { id: 'admin_profile', label: '👤 Admin Profile' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setActionSuccess('');
              setActionError('');
              setStudentForm(null);
              setTeacherForm(null);
              setCourseForm(null);
              setEventForm(null);
            }}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              padding: '0.7rem 1rem',
              fontSize: '0.9rem',
              backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--white)' : 'var(--color-dark)',
              borderRadius: '8px'
            }}
          >
            {tab.label}
          </button>
        ))}

        <button
          onClick={onLogout}
          className="btn btn-outline"
          style={{ marginTop: 'auto', padding: '0.6rem', fontSize: '0.9rem' }}
        >
          Logout Portal
        </button>
      </div>

      {/* Content Space */}
      <div style={{ padding: '3rem' }}>
        {/* Tab 1: Dashboard metrics */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ marginBottom: '2rem', color: 'var(--color-primary)' }}>Metrics Summary Overview</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>{students.length}</h3>
                <p style={{ color: 'var(--color-dark-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Total Students Enrolled</p>
              </div>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>{pendingStudentCount}</h3>
                <p style={{ color: 'var(--color-dark-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Pending Student Applications</p>
              </div>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>{teachers.length}</h3>
                <p style={{ color: 'var(--color-dark-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Active Teachers</p>
              </div>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>{courses.length}</h3>
                <p style={{ color: 'var(--color-dark-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Offered Courses</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--color-primary)' }}>{activeStudentCount}</h4>
                <p style={{ margin: 0, color: 'var(--color-dark-muted)' }}>Active Students</p>
              </div>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--color-primary)' }}>{dashboardMetrics.attendance_marked_courses ?? 0}</h4>
                <p style={{ margin: 0, color: 'var(--color-dark-muted)' }}>Attendance Marked Courses</p>
              </div>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--color-primary)' }}>{events.filter((eventItem) => eventItem.event_date >= new Date().toISOString().slice(0, 10)).length}</h4>
                <p style={{ margin: 0, color: 'var(--color-dark-muted)' }}>Upcoming Events</p>
              </div>
            </div>

            <h3 style={{ marginBottom: '1.5rem' }}>Pending Registration Approvals</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Father Name</th>
                    <th>Course Requested</th>
                    <th>Age</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter((s) => s.admission_status === 'pending').map((student) => (
                    <tr key={student.id}>
                      <td><strong>{student.full_name}</strong></td>
                      <td>{student.father_name}</td>
                      <td>{student.course_name} ({student.course_code})</td>
                      <td>{student.age || 'N/A'}</td>
                      <td>{student.phone}</td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleApproveStudent(student.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Approve Registry
                        </button>
                        <button onClick={() => handleDeleteStudent(student.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.filter((s) => s.admission_status === 'pending').length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-dark-muted)' }}>
                        No pending student admission submissions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Students CRUD */}
        {activeTab === 'students' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--color-primary)' }}>Student Registry Database</h2>
              <button
                className="btn btn-primary"
                onClick={() => setStudentForm({ full_name: '', father_name: '', age: '', course_id: courses[0]?.id || '', phone: '', address: '', admission_status: 'active' })}
              >
                + Register Student
              </button>
            </div>

            {studentForm && (
              <div className="card" style={{ marginBottom: '2.5rem', maxWidth: '650px' }}>
                <h3>{studentForm.id ? 'Edit Student Details' : 'Manual Student Registration'}</h3>
                <form onSubmit={handleSaveStudent} style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" required className="form-control" value={studentForm.full_name} onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Father's Name</label>
                      <input type="text" required className="form-control" value={studentForm.father_name} onChange={(e) => setStudentForm({ ...studentForm, father_name: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Age</label>
                      <input type="number" className="form-control" value={studentForm.age || ''} onChange={(e) => setStudentForm({ ...studentForm, age: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Course Enrollment</label>
                      <select className="form-control" value={studentForm.course_id} onChange={(e) => setStudentForm({ ...studentForm, course_id: e.target.value })} required>
                        <option value="">Choose Course</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="text" className="form-control" value={studentForm.phone || ''} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Admission Status</label>
                      <select className="form-control" value={studentForm.admission_status} onChange={(e) => setStudentForm({ ...studentForm, admission_status: e.target.value })} required>
                        <option value="pending">Pending Approval</option>
                        <option value="active">Active Enrollment</option>
                        <option value="inactive">Inactive</option>
                        <option value="graduated">Graduated</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <textarea className="form-control" value={studentForm.address || ''} onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary">Save Student</button>
                    <button type="button" className="btn btn-outline" onClick={() => setStudentForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Father Name</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td><strong>{student.roll_no}</strong></td>
                      <td>{student.full_name}</td>
                      <td>{student.father_name}</td>
                      <td>{student.course_name}</td>
                      <td>
                        <span className={`badge badge-${
                          student.admission_status === 'active' ? 'success' :
                          student.admission_status === 'pending' ? 'warning' : 'info'
                        }`}>
                          {student.admission_status}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {student.admission_status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveStudent(student.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                              Approve
                            </button>
                            <button onClick={() => handleRejectStudent(student.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                              Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => setStudentForm(student)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteStudent(student.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admin_profile' && (
          <form className="card" onSubmit={saveAdminProfile} style={{ maxWidth: '620px' }}>
            <h2 style={{ color: 'var(--color-primary)' }}>Admin Profile</h2>
            <p style={{ color: 'var(--color-dark-muted)' }}>Update the profile picture shown for the head administrator account.</p>
            {adminProfileImage && <img src={adminProfileImage} alt="Admin profile" style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '50%', marginBottom: '1rem' }} />}
            <div className="form-group">
              <label>Profile Picture</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
                  showMsg('Choose a JPEG, PNG, or WebP image smaller than 1 MB.', true);
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setAdminProfileImage(reader.result);
                reader.readAsDataURL(file);
              }} />
            </div>
            <button className="btn btn-primary" type="submit">Save Admin Profile</button>
          </form>
        )}

        {/* Tab 3: Teachers CRUD */}
        {activeTab === 'teachers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--color-primary)' }}>Teacher Faculty Directory</h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setTeacherForm({ full_name: '', email: '', phone: '', qualification: '', bio: '', profile_image: '', password: '', course_ids: [] })}
                >
                  + Create Teacher Profile
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAllTeachers} disabled={teachers.length === 0}>
                  Delete All Teachers
                </button>
              </div>
            </div>

            {teacherForm && (
              <div className="card" style={{ marginBottom: '2.5rem', maxWidth: '650px' }}>
                <h3>{teacherForm.id ? 'Edit Teacher Details' : 'Register New Teacher'}</h3>
                <form onSubmit={handleSaveTeacher} style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Teacher Full Name</label>
                      <input type="text" required className="form-control" value={teacherForm.full_name} onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" required className="form-control" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="text" className="form-control" value={teacherForm.phone || ''} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Credentials Password {teacherForm.id && '(Leave blank to keep unchanged)'}</label>
                      <input type="password" className="form-control" value={teacherForm.password || ''} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} required={!teacherForm.id} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Assign Courses</label>
                    <select
                      className="form-control"
                      multiple
                      value={(teacherForm.course_ids || []).map(String)}
                      onChange={(event) => setTeacherForm({ ...teacherForm, course_ids: Array.from(event.target.selectedOptions, (option) => Number(option.value)) })}
                      style={{ minHeight: '120px' }}
                    >
                      {courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.title}</option>)}
                    </select>
                    <small style={{ color: 'var(--color-dark-muted)' }}>Select courses this teacher should teach.</small>
                  </div>
                  <div className="form-group">
                    <label>Qualification Title</label>
                    <input type="text" className="form-control" value={teacherForm.qualification || ''} onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })} placeholder="e.g. Hifz and Tajweed Instructor" />
                  </div>
                  <div className="form-group">
                    <label>Profile Picture</label>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
                        showMsg('Choose a JPEG, PNG, or WebP image smaller than 1 MB.', true);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setTeacherForm((current) => ({ ...current, profile_image: reader.result }));
                      reader.readAsDataURL(file);
                    }} />
                    {teacherForm.profile_image && <img src={teacherForm.profile_image} alt="Teacher profile" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />}
                  </div>
                  <div className="form-group">
                    <label>Biography / Skills</label>
                    <textarea className="form-control" value={teacherForm.bio || ''} onChange={(e) => setTeacherForm({ ...teacherForm, bio: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary">Save Teacher</button>
                    <button type="button" className="btn btn-outline" onClick={() => setTeacherForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Qualification</th>
                    <th>Courses</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td><strong>{teacher.full_name}</strong></td>
                      <td>{teacher.email}</td>
                      <td>{teacher.phone || 'N/A'}</td>
                      <td>{teacher.qualification || 'N/A'}</td>
                      <td>{teacher.courses?.length ? teacher.courses.map((course) => course.title).join(', ') : 'No courses assigned'}</td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setTeacherForm(teacher)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteTeacher(teacher.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Courses CRUD */}
        {activeTab === 'courses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--color-primary)' }}>Active Courses Catalog</h2>
              <button
                className="btn btn-primary"
                onClick={() => setCourseForm(buildCourseForm({}, teachers[0]?.id || ''))}
              >
                + New Course
              </button>
            </div>

            {courseForm && (
              <div className="card" style={{ marginBottom: '2.5rem', maxWidth: '650px' }}>
                <h3>Course & Schedule Editor</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--color-dark-muted)', lineHeight: 1.7 }}>
                  Edit the instructor, timing, and weekly days here. The public schedule and course cards refresh after you save.
                </p>
                <form onSubmit={handleSaveCourse} style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Course Title</label>
                      <input type="text" required className="form-control" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Course Code</label>
                      <input type="text" required className="form-control" value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Assigned Teacher Faculty</label>
                      <select className="form-control" value={courseForm.teacher_id} onChange={(e) => setCourseForm({ ...courseForm, teacher_id: e.target.value })} required>
                        <option value="">Choose Teacher</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select className="form-control" value={courseForm.is_active ? 'true' : 'false'} onChange={(e) => setCourseForm({ ...courseForm, is_active: e.target.value === 'true' })} required>
                        <option value="true">Active Catalog</option>
                        <option value="false">Hidden</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Start Time</label>
                      <input type="time" required className="form-control" value={courseForm.start_time} onChange={(e) => setCourseForm({ ...courseForm, start_time: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input type="time" required className="form-control" value={courseForm.end_time} onChange={(e) => setCourseForm({ ...courseForm, end_time: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Schedule Days</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                      {WEEK_DAYS.map((day) => {
                        const selected = Array.isArray(courseForm.schedule_days) && courseForm.schedule_days.includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleCourseDay(day)}
                            className="btn"
                            style={{
                              padding: '0.55rem 0.85rem',
                              borderRadius: '999px',
                              border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--gray-200)'}`,
                              background: selected ? 'var(--color-primary-light)' : 'var(--white)',
                              color: selected ? 'var(--color-primary)' : 'var(--color-dark)',
                              fontWeight: 600
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--color-dark-muted)' }}>
                      Select the days this course should appear in the public schedule.
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-control" value={courseForm.description || ''} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
                  </div>
                  <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '14px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                    <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.75rem' }}>Live Preview</div>
                    <div style={{ display: 'grid', gap: '0.5rem', color: 'var(--color-dark)' }}>
                      <div><strong>Course:</strong> {courseForm.title || 'Course title preview'}</div>
                      <div><strong>Instructor:</strong> {teachers.find((teacher) => String(teacher.id) === String(courseForm.teacher_id))?.full_name || 'Select an instructor'}</div>
                      <div><strong>Timing:</strong> {courseForm.start_time || '--:--'} - {courseForm.end_time || '--:--'}</div>
                      <div><strong>Days:</strong> {Array.isArray(courseForm.schedule_days) && courseForm.schedule_days.length > 0 ? courseForm.schedule_days.join(', ') : 'No days selected'}</div>
                      <div><strong>Status:</strong> {courseForm.is_active ? 'Active Catalog' : 'Hidden'}</div>
                    </div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--color-dark-muted)', lineHeight: 1.6 }}>
                      This is the exact course card style the public site will use after you save.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button type="button" className="btn btn-outline" onClick={() => setCourseForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Instructor Name</th>
                    <th>Schedule Days</th>
                    <th>Timing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td><strong>{course.code}</strong></td>
                      <td>{course.title}</td>
                      <td>{course.teacher_name || 'Unassigned'}</td>
                      <td>{Array.isArray(course.schedule_days) && course.schedule_days.length > 0 ? course.schedule_days.join(', ') : 'N/A'}</td>
                      <td>{course.start_time} - {course.end_time}</td>
                      <td>
                        <span className={`badge badge-${course.is_active ? 'success' : 'danger'}`}>
                          {course.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setCourseForm(buildCourseForm(course, teachers[0]?.id || ''))} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Edit Schedule
                        </button>
                        <button onClick={() => handleDeleteCourse(course.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Events CRUD */}
        {activeTab === 'events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--color-primary)' }}>Announcements & Special Events Notice Board</h2>
              <button
                className="btn btn-primary"
                onClick={() => setEventForm({ title: '', description: '', location: '', event_date: new Date().toISOString().slice(0, 10) })}
              >
                + Schedule Event
              </button>
            </div>

            {eventForm && (
              <div className="card" style={{ marginBottom: '2.5rem', maxWidth: '650px' }}>
                <h3>{eventForm.id ? 'Edit Special Event Notice' : 'Schedule New Event'}</h3>
                <form onSubmit={handleSaveEvent} style={{ marginTop: '1.5rem' }}>
                  <div className="form-group">
                    <label>Event / Announcement Title</label>
                    <input type="text" required className="form-control" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Date of Event</label>
                      <input type="date" required className="form-control" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Location / Venue</label>
                      <input type="text" className="form-control" value={eventForm.location || ''} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="e.g. Main Hall" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Event Description</label>
                    <textarea className="form-control" rows="4" value={eventForm.description || ''} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary">Publish Notice</button>
                    <button type="button" className="btn btn-outline" onClick={() => setEventForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Location Venue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td><strong>{event.event_date}</strong></td>
                      <td>{event.title}</td>
                      <td>{event.location || 'N/A'}</td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setEventForm(event)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Site settings */}
        {activeTab === 'site_settings' && (
          <div style={{ maxWidth: '750px' }}>
            <h2 style={{ marginBottom: '2rem', color: 'var(--color-primary)' }}>Site Variables & Content Configuration</h2>
            
            <div className="card">
              <form onSubmit={handleSaveSiteConfig}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.2rem' }}>
                  <div className="form-group">
                    <label>Madarsa Corporate Name</label>
                    <input type="text" required className="form-control" value={siteConfig.madarsa_name} onChange={(e) => setSiteConfig({ ...siteConfig, madarsa_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Navbar Logo Initials</label>
                    <input type="text" required className="form-control" value={siteConfig.logo_text} onChange={(e) => setSiteConfig({ ...siteConfig, logo_text: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notice Banner Bulletin Text</label>
                  <input type="text" className="form-control" value={siteConfig.special_notice || ''} onChange={(e) => setSiteConfig({ ...siteConfig, special_notice: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Hero Welcome Title</label>
                  <input type="text" required className="form-control" value={siteConfig.hero_title} onChange={(e) => setSiteConfig({ ...siteConfig, hero_title: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Hero Catchphrase Description</label>
                  <textarea required className="form-control" rows="3" value={siteConfig.hero_description} onChange={(e) => setSiteConfig({ ...siteConfig, hero_description: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>About Us Description Paragraph</label>
                  <textarea required className="form-control" rows="4" value={siteConfig.about_text} onChange={(e) => setSiteConfig({ ...siteConfig, about_text: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Admission Guidelines Text</label>
                  <textarea required className="form-control" rows="3" value={siteConfig.admission_text} onChange={(e) => setSiteConfig({ ...siteConfig, admission_text: e.target.value })} />
                </div>

                <h3 style={{ margin: '2rem 0 1rem 0', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem', color: 'var(--color-primary)' }}>Contact Support Details</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <div className="form-group">
                    <label>Public Contact Email</label>
                    <input type="email" className="form-control" value={siteConfig.contact_email || ''} onChange={(e) => setSiteConfig({ ...siteConfig, contact_email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Public Contact Phone</label>
                    <input type="text" className="form-control" value={siteConfig.contact_phone || ''} onChange={(e) => setSiteConfig({ ...siteConfig, contact_phone: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Public Street Address</label>
                  <input type="text" className="form-control" value={siteConfig.contact_address || ''} onChange={(e) => setSiteConfig({ ...siteConfig, contact_address: e.target.value })} />
                </div>
                <h3 style={{ margin: '2rem 0 1rem 0', color: 'var(--color-primary)' }}>Donation Section</h3>

                <div className="form-group">
                  <label>Donation Situation Message</label>
                  <textarea className="form-control" rows="4" value={siteConfig.donation_situation || ''} onChange={(e) => setSiteConfig({ ...siteConfig, donation_situation: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <div className="form-group">
                    <label>Easypaisa Account Number</label>
                    <input type="text" className="form-control" value={siteConfig.donation_easypaisa || ''} onChange={(e) => setSiteConfig({ ...siteConfig, donation_easypaisa: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>JazzCash Account Number</label>
                    <input type="text" className="form-control" value={siteConfig.donation_jazzcash || ''} onChange={(e) => setSiteConfig({ ...siteConfig, donation_jazzcash: e.target.value })} />
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0 }}>Donation Items</h4>
                    <button type="button" className="btn btn-primary" onClick={() => setDonationForm({ title: '', message: '', easypaisa: '', jazzcash: '', idx: -1 })}>+ Add Item</button>
                  </div>

                  {donationForm && (
                    <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <input className="form-control" placeholder="Title" value={donationForm.title} onChange={(e) => setDonationForm({ ...donationForm, title: e.target.value })} />
                        <textarea className="form-control" rows={3} placeholder="Message" value={donationForm.message} onChange={(e) => setDonationForm({ ...donationForm, message: e.target.value })} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                          <input className="form-control" placeholder="Easypaisa" value={donationForm.easypaisa} onChange={(e) => setDonationForm({ ...donationForm, easypaisa: e.target.value })} />
                          <input className="form-control" placeholder="JazzCash" value={donationForm.jazzcash} onChange={(e) => setDonationForm({ ...donationForm, jazzcash: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          <button className="btn btn-primary" onClick={() => {
                            const copy = [...donationList];
                            if (donationForm.idx >= 0) {
                              copy[donationForm.idx] = { title: donationForm.title, message: donationForm.message, easypaisa: donationForm.easypaisa, jazzcash: donationForm.jazzcash };
                            } else {
                              copy.push({ title: donationForm.title, message: donationForm.message, easypaisa: donationForm.easypaisa, jazzcash: donationForm.jazzcash });
                            }
                            setDonationList(copy);
                            setDonationForm(null);
                          }}>Save Item</button>
                          <button className="btn btn-outline" onClick={() => setDonationForm(null)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {donationList.length === 0 && <div style={{ color: 'var(--color-dark-muted)' }}>No donation items configured.</div>}
                    {donationList.map((item, idx) => (
                      <div key={idx} className="card" style={{ padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.title || 'Untitled'}</div>
                          <div style={{ color: 'var(--color-dark-muted)', fontSize: '0.95rem' }}>{item.message}</div>
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.6rem' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Easypaisa: <span style={{ fontWeight: 500 }}>{item.easypaisa || 'N/A'}</span></div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>JazzCash: <span style={{ fontWeight: 500 }}>{item.jazzcash || 'N/A'}</span></div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline" onClick={() => setDonationForm({ ...item, idx })}>Edit</button>
                          <button className="btn btn-danger" onClick={() => {
                            if (!window.confirm('Delete this donation item?')) return;
                            const copy = donationList.filter((_, i) => i !== idx);
                            setDonationList(copy);
                          }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Schedule: Closed Days (JSON Array String)</label>
                    <input type="text" required className="form-control" value={siteConfig.closed_days} onChange={(e) => setSiteConfig({ ...siteConfig, closed_days: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Schedule: Open Days (JSON Array String)</label>
                    <input type="text" required className="form-control" value={siteConfig.open_days} onChange={(e) => setSiteConfig({ ...siteConfig, open_days: e.target.value })} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '0.9rem' }}>
                  Publish Site Configuration
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
