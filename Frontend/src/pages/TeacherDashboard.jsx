import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const today = new Date().toISOString().slice(0, 10);

export default function TeacherDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [attendanceMode, setAttendanceMode] = useState('manage');
  const [attendanceDates, setAttendanceDates] = useState([]);
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceEntries, setAttendanceEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
    }
  }, [activeTab, studentSearch]);

  useEffect(() => {
    if (activeTab === 'attendance' && selectedCourseId) {
      loadAttendance();
    }
  }, [activeTab, selectedCourseId, attendanceDate]);

  useEffect(() => {
    if (activeTab === 'attendance' && selectedCourseId) {
      loadAttendanceDates();
    }
  }, [activeTab, selectedCourseId, attendanceMode]);

  const flash = (message, isError = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(''), 5000);
      return;
    }

    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await api.get('/teacher/overview');
      setOverview(data);
      const firstCourseId = data?.courses?.[0]?.id;
      if (firstCourseId) {
        setSelectedCourseId((current) => current || String(firstCourseId));
      }
    } catch (err) {
      flash(err.message || 'Failed to load teacher portal.', true);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const query = studentSearch ? `?search=${encodeURIComponent(studentSearch)}` : '';
      const data = await api.get(`/teacher/students${query}`);
      setStudents(data || []);
    } catch (err) {
      flash(err.message || 'Failed to load student records.', true);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceDates = async () => {
    if (!selectedCourseId) {
      setAttendanceDates([]);
      return;
    }

    try {
      setHistoryLoading(true);
      const data = await api.get(`/teacher/attendance/dates?course_id=${selectedCourseId}`);
      const dates = data?.attendance_dates || [];
      setAttendanceDates(dates);

      if (attendanceMode === 'history' && dates.length > 0) {
        setAttendanceDate(dates[0]);
      }
    } catch (err) {
      flash(err.message || 'Failed to load attendance history.', true);
      setAttendanceDates([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatAttendanceLabel = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/teacher/attendance?course_id=${selectedCourseId}&attendance_date=${attendanceDate}`);
      const list = data?.students || [];
      setAttendanceStudents(list);
      const nextEntries = {};
      list.forEach((student) => {
        nextEntries[student.student_id] = { status: student.status || 'present', remarks: student.remarks || '' };
      });
      setAttendanceEntries(nextEntries);
    } catch (err) {
      flash(err.message || 'Failed to load attendance sheet.', true);
    } finally {
      setLoading(false);
    }
  };

  const saveStudent = async (event) => {
    event.preventDefault();
    if (!editingStudent?.id) return;

    try {
      setSavingStudent(true);
      await api.put(`/teacher/students/${editingStudent.id}`, {
        full_name: editingStudent.full_name,
        father_name: editingStudent.father_name,
        age: editingStudent.age === '' ? null : Number(editingStudent.age),
        phone: editingStudent.phone,
        address: editingStudent.address,
      });
      flash('Student record updated successfully.');
      setEditingStudent(null);
      loadStudents();
    } catch (err) {
      flash(err.message || 'Failed to update the student record.', true);
    } finally {
      setSavingStudent(false);
    }
  };

  const saveAttendance = async (event) => {
    event.preventDefault();
    try {
      setSavingAttendance(true);
      const entries = attendanceStudents.map((student) => ({
        student_id: student.student_id,
        status: attendanceEntries[student.student_id]?.status || 'present',
        remarks: attendanceEntries[student.student_id]?.remarks || '',
      }));
      await api.post('/teacher/attendance', {
        course_id: Number(selectedCourseId),
        attendance_date: attendanceDate,
        entries,
      });
      flash('Attendance saved successfully.');
      loadAttendanceDates();
    } catch (err) {
      flash(err.message || 'Failed to save attendance.', true);
    } finally {
      setSavingAttendance(false);
    }
  };

  const updateEntry = (studentId, field, value) => {
    setAttendanceEntries((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] || { status: 'present', remarks: '' }), [field]: value },
    }));
  };

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      flash('Choose a JPEG, PNG, or WebP image smaller than 1 MB.', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setOverview((current) => ({ ...current, teacher: { ...current.teacher, profile_image: reader.result } }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setSavingProfile(true);
      await api.put('/teacher/profile', {
        full_name: teacher.full_name,
        email: teacher.email,
        phone: teacher.phone || '',
        qualification: teacher.qualification || '',
        bio: teacher.bio || '',
        profile_image: teacher.profile_image || null,
      });
      flash('Profile updated successfully.');
      await loadOverview();
    } catch (err) {
      flash(err.message || 'Failed to update profile.', true);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading && !overview) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <p>Loading teacher portal...</p>
      </div>
    );
  }

  const courses = overview?.courses || [];
  const teacher = overview?.teacher || user || {};
  const activeCourse = courses.find((course) => String(course.id) === String(selectedCourseId));

  return (
    <div className="container section-padding teacher-shell" style={{ maxWidth: '1200px' }}>
      <div className="dashboard-heading teacher-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>Teacher Portal</p>
          <h2 style={{ margin: '0.35rem 0 0.5rem' }}>Assalamu Alaikum, {teacher.display_name || teacher.full_name || 'Teacher'}</h2>
          <p style={{ margin: 0, color: 'var(--color-dark-muted)' }}>You can review and edit student records, then record attendance. Head-only controls stay unavailable.</p>
        </div>
        <button onClick={onLogout} className="btn btn-outline" style={{ padding: '0.6rem 1rem' }}>Log Out</button>
      </div>

      {error && <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>{success}</div>}

      <div className="teacher-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
        {['overview', 'students', 'attendance', 'profile'].map((tab) => (
          <button key={tab} type="button" className="btn" onClick={() => setActiveTab(tab)} style={{ padding: '0.7rem 1rem', borderRadius: '999px', background: activeTab === tab ? 'var(--color-primary)' : 'var(--gray-100)', color: activeTab === tab ? 'var(--white)' : 'var(--color-dark)' }}>
            {tab === 'overview' ? 'Overview' : tab === 'students' ? 'Student Records' : tab === 'attendance' ? 'Attendance' : 'My Profile'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="teacher-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card"><h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>{courses.length}</h3><p style={{ marginBottom: 0, color: 'var(--color-dark-muted)' }}>Assigned Courses</p></div>
            <div className="card"><h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>{overview?.students_count || 0}</h3><p style={{ marginBottom: 0, color: 'var(--color-dark-muted)' }}>Visible Students</p></div>
            <div className="card"><h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>{teacher.qualification || 'Teacher'}</h3><p style={{ marginBottom: 0, color: 'var(--color-dark-muted)' }}>Role / Qualification</p></div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Assigned Courses</h3>
            <div className="teacher-courses-grid" style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {courses.map((course) => (
                <div key={course.id} style={{ border: '1px solid var(--gray-200)', borderRadius: '14px', padding: '1rem' }}>
                  <strong style={{ color: 'var(--color-primary)' }}>{course.title}</strong>
                  <div style={{ color: 'var(--color-dark-muted)', marginTop: '0.35rem' }}>{course.code}</div>
                  <div style={{ marginTop: '0.35rem' }}>{course.start_time} - {course.end_time}</div>
                  <div style={{ marginTop: '0.35rem', color: 'var(--color-dark-muted)' }}>{(course.schedule_days || []).join(', ')}</div>
                </div>
              ))}
              {courses.length === 0 && <p style={{ marginBottom: 0, color: 'var(--color-dark-muted)' }}>No courses are assigned yet.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form className="card" onSubmit={saveProfile} style={{ maxWidth: '720px' }}>
          <div className="teacher-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            {teacher.profile_image ? <img src={teacher.profile_image} alt={teacher.full_name} style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '84px', height: '84px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '2rem', fontWeight: 700 }}>{(teacher.full_name || 'T').charAt(0)}</div>}
            <div className="form-group" style={{ margin: 0 }}>
              <label>Profile Picture</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfileImage} />
            </div>
          </div>
          <div className="form-group"><label>Full Name</label><input className="form-control" value={teacher.full_name || ''} onChange={(event) => setOverview((current) => ({ ...current, teacher: { ...current.teacher, full_name: event.target.value } }))} required /></div>
          <div className="form-group"><label>Email</label><input className="form-control" type="email" value={teacher.email || ''} onChange={(event) => setOverview((current) => ({ ...current, teacher: { ...current.teacher, email: event.target.value } }))} required /></div>
          <div className="form-group"><label>Phone</label><input className="form-control" value={teacher.phone || ''} onChange={(event) => setOverview((current) => ({ ...current, teacher: { ...current.teacher, phone: event.target.value } }))} /></div>
          <div className="form-group"><label>Qualification</label><input className="form-control" value={teacher.qualification || ''} onChange={(event) => setOverview((current) => ({ ...current, teacher: { ...current.teacher, qualification: event.target.value } }))} /></div>
          <div className="form-group"><label>Biography</label><textarea className="form-control" value={teacher.bio || ''} onChange={(event) => setOverview((current) => ({ ...current, teacher: { ...current.teacher, bio: event.target.value } }))} /></div>
          <button className="btn btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</button>
        </form>
      )}

      {activeTab === 'students' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 320px', marginBottom: 0 }}>
              <label>Search Students</label>
              <input className="form-control" type="text" placeholder="Search by name, roll number, phone, or course" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
            </div>
            <button type="button" className="btn btn-outline" onClick={loadStudents}>Refresh</button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Father Name</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.roll_no}</strong></td>
                    <td>{student.full_name}</td>
                    <td>{student.father_name}</td>
                    <td>{student.course_name || 'N/A'}</td>
                    <td>{student.admission_status}</td>
                    <td>{student.age || 'N/A'}</td>
                    <td>{student.phone || 'N/A'}</td>
                    <td><button type="button" className="btn btn-outline" style={{ padding: '0.45rem 0.75rem' }} onClick={() => setEditingStudent({ ...student, age: student.age ?? '' })}>Edit</button></td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-dark-muted)' }}>No students found for your courses.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {editingStudent && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Edit Student Record</h3>
              <form onSubmit={saveStudent}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group"><label>Full Name</label><input className="form-control" value={editingStudent.full_name || ''} onChange={(e) => setEditingStudent((c) => ({ ...c, full_name: e.target.value }))} required /></div>
                  <div className="form-group"><label>Father Name</label><input className="form-control" value={editingStudent.father_name || ''} onChange={(e) => setEditingStudent((c) => ({ ...c, father_name: e.target.value }))} required /></div>
                  <div className="form-group"><label>Age</label><input className="form-control" type="number" value={editingStudent.age || ''} onChange={(e) => setEditingStudent((c) => ({ ...c, age: e.target.value }))} /></div>
                  <div className="form-group"><label>Phone</label><input className="form-control" value={editingStudent.phone || ''} onChange={(e) => setEditingStudent((c) => ({ ...c, phone: e.target.value }))} /></div>
                </div>
                <div className="form-group"><label>Address</label><textarea className="form-control" rows="3" value={editingStudent.address || ''} onChange={(e) => setEditingStudent((c) => ({ ...c, address: e.target.value }))} /></div>
                <div className="teacher-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingStudent}>{savingStudent ? 'Saving...' : 'Save Student'}</button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingStudent(null)}>Cancel</button>
                  <div style={{ alignSelf: 'center', color: 'var(--color-dark-muted)' }}>Course and admission status are controlled by the head.</div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Attendance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group"><label>Course</label><select className="form-control" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>{courses.map((course) => <option key={course.id} value={course.id}>{course.title} ({course.code})</option>)}</select></div>
              <div className="form-group"><label>Date</label><input className="form-control" type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} /></div>
              <div className="form-group"><label>Mode</label><select className="form-control" value={attendanceMode} onChange={(e) => setAttendanceMode(e.target.value)}>
                <option value="manage">Mark Attendance</option>
                <option value="history">View History</option>
              </select></div>
            </div>
            <button type="button" className="btn btn-outline" onClick={loadAttendance} disabled={!selectedCourseId}>Load</button>
          </div>

          {attendanceMode === 'history' && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Saved Attendance Files</h3>
              <p style={{ margin: 0, color: 'var(--color-dark-muted)' }}>Select a saved attendance date below to open that record.</p>
              <div className="teacher-attendance-dates" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                {historyLoading ? (
                  <span style={{ color: 'var(--color-dark-muted)' }}>Loading saved dates...</span>
                ) : attendanceDates.length === 0 ? (
                  <span style={{ color: 'var(--color-dark-muted)' }}>No saved attendance files found for this course.</span>
                ) : (
                  attendanceDates.map((dateString) => (
                    <button
                      key={dateString}
                      type="button"
                      className="btn btn-outline"
                      style={{
                        background: attendanceDate === dateString ? 'var(--color-primary)' : 'var(--white)',
                        color: attendanceDate === dateString ? 'var(--white)' : 'var(--color-dark)',
                        borderColor: attendanceDate === dateString ? 'var(--color-primary)' : undefined,
                      }}
                      onClick={() => {
                        setAttendanceDate(dateString);
                        loadAttendance();
                      }}
                    >
                      {formatAttendanceLabel(dateString)}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {attendanceMode === 'manage' ? (
            <form onSubmit={saveAttendance}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceStudents.map((student) => {
                      const entry = attendanceEntries[student.student_id] || { status: 'present', remarks: '' };
                      return (
                        <tr key={student.student_id}>
                          <td><strong>{student.roll_no}</strong></td>
                          <td>{student.full_name}</td>
                          <td>
                            <div className="teacher-attendance-status" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                              {['present', 'absent', 'leave'].map((status) => (
                                <label key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <input type="radio" name={`attendance-${student.student_id}`} checked={entry.status === status} onChange={() => updateEntry(student.student_id, 'status', status)} />
                                  {status}
                                </label>
                              ))}
                            </div>
                          </td>
                          <td><input className="form-control" type="text" value={entry.remarks} onChange={(e) => updateEntry(student.student_id, 'remarks', e.target.value)} placeholder="Optional note" /></td>
                        </tr>
                      );
                    })}
                    {attendanceStudents.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-dark-muted)' }}>No students available for this course.</td></tr>}
                  </tbody>
                </table>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={savingAttendance || !attendanceStudents.length}>{savingAttendance ? 'Saving Attendance...' : 'Save Attendance'}</button>
            </form>
          ) : (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Attendance History</h3>
              <p style={{ margin: 0, color: 'var(--color-dark-muted)' }}>This view shows saved attendance records for the selected course and date.</p>
              <div className="table-container" style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceStudents.map((student) => (
                      <tr key={student.student_id}>
                        <td><strong>{student.roll_no}</strong></td>
                        <td>{student.full_name}</td>
                        <td>{student.status || 'present'}</td>
                        <td>{student.remarks || '-'}</td>
                      </tr>
                    ))}
                    {attendanceStudents.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-dark-muted)' }}>No attendance records found for this date.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeCourse && <div style={{ color: 'var(--color-dark-muted)' }}>Current course: {activeCourse.title} ({activeCourse.start_time} - {activeCourse.end_time})</div>}
        </div>
      )}
    </div>
  );
}
