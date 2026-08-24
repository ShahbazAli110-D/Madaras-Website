(async () => {
  try {
    const base = 'http://localhost:5000/api';

    const loginRes = await fetch(`${base}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123' }),
    });

    const login = await loginRes.json();
    console.log('LOGIN:', login);

    const token = login.token;
    if (!token) throw new Error('No auth token received.');

    const teacherRes = await fetch(`${base}/admin/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ full_name: 'Smoke Test Teacher', email: 'smoke.teacher@example.local', password: 'Teacher123', phone: '+100200', qualification: 'Test', bio: 'smoke' }),
    });

    const teacher = await teacherRes.json();
    console.log('TEACHER CREATED:', teacher);

    const teacherId = teacher?.teacher?.id;
    if (!teacherId) throw new Error('Teacher creation failed');

    const courseRes = await fetch(`${base}/admin/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Smoke Course', code: `SMOKE-${Date.now() % 10000}`, description: 'desc', teacher_id: teacherId, start_time: '09:00', end_time: '10:00', schedule_days: ['Saturday','Sunday'], is_active: true }),
    });

    const course = await courseRes.json();
    console.log('COURSE CREATED:', course);

    const courseId = course?.course?.id;
    if (!courseId) throw new Error('Course creation failed');

    const delCourseRes = await fetch(`${base}/admin/courses/${courseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('COURSE DELETE:', await delCourseRes.json());

    const delTeacherRes = await fetch(`${base}/admin/teachers/${teacherId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('TEACHER DELETE:', await delTeacherRes.json());

    console.log('SMOKE TEST COMPLETED SUCCESSFULLY');
  } catch (err) {
    console.error('SMOKE TEST ERROR:', err);
    process.exit(1);
  }
})();
