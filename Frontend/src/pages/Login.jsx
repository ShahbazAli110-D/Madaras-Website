import React, { useState } from 'react';
import { api } from '../services/api';

const MODES = {
  HEAD_LOGIN: 'head-login',
  TEACHER_LOGIN: 'teacher-login',
  FORGOT: 'forgot-password',
};

const modeTitle = {
  [MODES.HEAD_LOGIN]: 'Head Login',
  [MODES.TEACHER_LOGIN]: 'Teacher Login',
  [MODES.FORGOT]: 'Forgot Password',
};

const modeHint = {
  [MODES.HEAD_LOGIN]: 'Use admin / Admin123 for default head access, or your registered head email.',
  [MODES.TEACHER_LOGIN]: 'Teachers can update student records and mark attendance.',
  [MODES.FORGOT]: 'Enter your account email to receive a password reset message.',
};

const isMode = (value) => Object.values(MODES).includes(value);

export default function Login({ onLoginSuccess, initialMode = MODES.HEAD_LOGIN, initialResetToken = '' }) {
  const [mode, setMode] = useState(isMode(initialMode) ? initialMode : MODES.HEAD_LOGIN);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHeadSetup, setShowHeadSetup] = useState(false);
  const [headLogin, setHeadLogin] = useState({ identifier: '', password: '' });
  const [headSetup, setHeadSetup] = useState({ fullName: '', email: '', password: '', setupCode: '' });
  const [teacherLogin, setTeacherLogin] = useState({ email: '', password: '' });
  const [forgotPassword, setForgotPassword] = useState({ email: '' });

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const completeSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    onLoginSuccess(data.user);
  };

  const handleHeadLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.post('/auth/admin/login', {
        email: headLogin.identifier.includes('@') ? headLogin.identifier : undefined,
        username: headLogin.identifier.includes('@') ? undefined : headLogin.identifier,
        password: headLogin.password,
      });
      completeSession(data);
    } catch (err) {
      setError(err.message || 'Unable to sign in as head.');
    } finally {
      setLoading(false);
    }
  };

  const handleHeadSetup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.post('/auth/head/signup', {
        setup_code: headSetup.setupCode,
        full_name: headSetup.fullName,
        email: headSetup.email,
        password: headSetup.password,
      });
      completeSession(data);
      setShowHeadSetup(false);
    } catch (err) {
      setError(err.message || 'Unable to create the head account.');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.post('/auth/teacher/login', teacherLogin);
      completeSession(data);
    } catch (err) {
      setError(err.message || 'Unable to sign in as teacher.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/password/forgot', forgotPassword);
      setSuccess('If an account exists for that email, a password reset message has been sent.');
    } catch (err) {
      setError(err.message || 'Unable to generate a password reset token.');
    } finally {
      setLoading(false);
    }
  };

  const autofillTeacher = (email = 'basit@darulhuda.local') => {
    setMode(MODES.TEACHER_LOGIN);
    setTeacherLogin({ email, password: 'Teacher123' });
  };

  const autoLoginTeacher = async (email = 'basit@darulhuda.local') => {
    setMode(MODES.TEACHER_LOGIN);
    setTeacherLogin({ email, password: 'Teacher123' });
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/teacher/login', { email, password: 'Teacher123' });
      completeSession(data);
    } catch (err) {
      setError(err.message || 'Unable to sign in as teacher.');
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div style={{ minHeight: '80vh', padding: '2rem 1rem', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, rgba(19, 54, 78, 0.05), rgba(255,255,255,1))' }}>
      <div className="card login-card" style={{ width: 'min(940px, 100%)', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ margin: 0, color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Portal Access</p>
          <h2 style={{ margin: '0.35rem 0 0.5rem', fontSize: '2rem', color: 'var(--color-primary)' }}>{modeTitle[mode]}</h2>
          <p style={{ margin: 0, color: 'var(--color-dark-muted)', lineHeight: 1.7 }}>{modeHint[mode]}</p>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '1rem' }}>{success}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <button type="button" className="btn" onClick={() => switchMode(MODES.HEAD_LOGIN)} style={{ padding: '0.7rem 1rem', borderRadius: '999px', background: mode === MODES.HEAD_LOGIN ? 'var(--color-primary)' : 'var(--gray-100)', color: mode === MODES.HEAD_LOGIN ? 'var(--white)' : 'var(--color-dark)' }}>Head Login</button>
          <button type="button" className="btn" onClick={() => switchMode(MODES.TEACHER_LOGIN)} style={{ padding: '0.7rem 1rem', borderRadius: '999px', background: mode === MODES.TEACHER_LOGIN ? 'var(--color-primary)' : 'var(--gray-100)', color: mode === MODES.TEACHER_LOGIN ? 'var(--white)' : 'var(--color-dark)' }}>Teacher Login</button>
          <button type="button" className="btn" onClick={() => switchMode(MODES.FORGOT)} style={{ padding: '0.7rem 1rem', borderRadius: '999px', background: mode === MODES.FORGOT ? 'var(--color-primary)' : 'var(--gray-100)', color: mode === MODES.FORGOT ? 'var(--white)' : 'var(--color-dark)' }}>Forgot Password</button>
        </div>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-dark-muted)' }}>Use your admin username or head email to sign in.</div>
        </div>
        {mode === MODES.HEAD_LOGIN && (
          <>
            <form onSubmit={handleHeadLogin} autoComplete="off">
              <div className="form-group"><label>Head Email or Admin Username</label><input className="form-control" type="text" name="head-email" autoComplete="off" placeholder="e.g. head@darulhuda.local or admin" value={headLogin.identifier} onChange={(e) => setHeadLogin((c) => ({ ...c, identifier: e.target.value }))} required /></div>
              <div className="form-group"><label>Password</label><input className="form-control" type="password" name="head-password" autoComplete="new-password" placeholder="Enter your password" value={headLogin.password} onChange={(e) => setHeadLogin((c) => ({ ...c, password: e.target.value }))} required /></div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowHeadSetup(true)}>Set up new head account</button>
                <button type="button" className="btn btn-outline" onClick={() => switchMode(MODES.FORGOT)}>Forgot password?</button>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.95rem' }} disabled={loading}>{loading ? 'Signing in...' : 'Sign In as Head'}</button>
            </form>

            {showHeadSetup && (
              <form onSubmit={handleHeadSetup} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--gray-200)' }} autoComplete="off">
                <div className="form-group"><label>Full Name</label><input className="form-control" type="text" value={headSetup.fullName} onChange={(e) => setHeadSetup((c) => ({ ...c, fullName: e.target.value }))} required /></div>
                <div className="form-group"><label>Head Email</label><input className="form-control" type="email" value={headSetup.email} onChange={(e) => setHeadSetup((c) => ({ ...c, email: e.target.value }))} required /></div>
                <div className="form-group"><label>Password</label><input className="form-control" type="password" value={headSetup.password} onChange={(e) => setHeadSetup((c) => ({ ...c, password: e.target.value }))} required /></div>
                <div className="form-group"><label>Setup Code</label><input className="form-control" type="text" value={headSetup.setupCode} onChange={(e) => setHeadSetup((c) => ({ ...c, setupCode: e.target.value }))} placeholder="DarulHudaHead2026" required /></div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowHeadSetup(false)}>Cancel</button>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.95rem' }} disabled={loading}>{loading ? 'Creating head account...' : 'Create Head Account'}</button>
              </form>
            )}
          </>
        )}
        {mode === MODES.TEACHER_LOGIN && (
          <form onSubmit={handleTeacherLogin} autoComplete="off">
            <div className="form-group"><label>Teacher Email</label><input className="form-control" type="email" name="teacher-email" autoComplete="off" placeholder="e.g. teacher@darulhuda.local" value={teacherLogin.email} onChange={(e) => setTeacherLogin((c) => ({ ...c, email: e.target.value }))} required /></div>
            <div className="form-group"><label>Password</label><input className="form-control" type="password" name="teacher-password" autoComplete="new-password" placeholder="Enter your password" value={teacherLogin.password} onChange={(e) => setTeacherLogin((c) => ({ ...c, password: e.target.value }))} required /></div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => switchMode(MODES.FORGOT)}>Forgot password?</button>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.95rem' }} disabled={loading}>{loading ? 'Signing in...' : 'Sign In as Teacher'}</button>
          </form>
        )}

        {mode === MODES.FORGOT && (
          <form onSubmit={handleForgotPassword}>
            <div className="form-group"><label>Account Email</label><input className="form-control" type="email" value={forgotPassword.email} onChange={(e) => setForgotPassword((c) => ({ ...c, email: e.target.value }))} required /></div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => switchMode(MODES.HEAD_LOGIN)}>Back to login</button>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.95rem' }} disabled={loading}>{loading ? 'Generating reset token...' : 'Generate Reset Token'}</button>
            {/* A password reset message will be sent to the email if an account exists. */}
          </form>
        )}

      </div>
    </div>
  );
}
