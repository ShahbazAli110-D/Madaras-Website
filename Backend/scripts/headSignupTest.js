(async () => {
  try {
    const base = 'http://localhost:5000/api';

    console.log('Signing up head account...');
    const signupRes = await fetch(`${base}/auth/head/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setup_code: process.env.HEAD_SIGNUP_CODE || 'DarulHudaHead2026',
        full_name: 'Automated Head',
        email: 'head.test@example.local',
        password: 'HeadTest123'
      }),
    });

    const signup = await signupRes.json();
    console.log('SIGNUP:', signup);

    if (signupRes.status !== 201 && signupRes.status !== 200) {
      console.log('Signup returned non-success; attempting login anyway.');
    }

    console.log('Logging in as head...');
    const loginRes = await fetch(`${base}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'head.test@example.local', password: 'HeadTest123' }),
    });

    const login = await loginRes.json();
    console.log('LOGIN:', login);

    if (login && login.token) {
      console.log('Login test succeeded; token received.');
    } else {
      console.error('Login test failed; no token returned.');
      process.exit(1);
    }
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
})();
