import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import { api } from './services/api';

const getBootstrapSiteContent = (data) => data?.siteContent || data?.site_content || null;
const MADARSA_LOGO = '/Madarsa Logo.jpg';
const getInitialPathname = () => {
  if (typeof window === 'undefined') {
    return '/';
  }

  return window.location.pathname.replace(/\/+$/, '') || '/';
};

const getInitialSearchToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URLSearchParams(window.location.search).get('token') || '';
};

const getInitialPage = () => {
  const pathname = getInitialPathname();
  return pathname === '/login' || pathname === '/reset-password' ? 'login' : 'landing';
};

const getInitialLoginMode = () => {
  const pathname = getInitialPathname();
  return pathname === '/reset-password' ? 'reset-password' : 'head-login';
};

const normalizeUserRole = (user) => {
  if (!user) {
    return user;
  }

  if (user.role === 'admin') {
    return { ...user, role: 'head' };
  }

  return user;
};

export default function App() {
  const [page, setPage] = useState(getInitialPage); // 'landing', 'login', 'dashboard'
  const [loginMode, setLoginMode] = useState(getInitialLoginMode);
  const [resetToken, setResetToken] = useState(getInitialSearchToken);
  const [user, setUser] = useState(null);
  const [siteName, setSiteName] = useState('مدرسہ اسلامیہ دارالہدیٰ');
  const [siteLogo, setSiteLogo] = useState('م');
  const [footerText, setFooterText] = useState('Madarsa Islamia Darul Huda. Serving students with sincerity and structure.');
  const [contentVersion, setContentVersion] = useState(0);

  useEffect(() => {
    // Check if user session exists
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(normalizeUserRole(JSON.parse(storedUser)));
      } catch (error) {
        console.warn('Ignoring invalid saved user session.', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    fetchHeaderConfig();
  }, []);

  useEffect(() => {
    const handleContentUpdated = () => {
      setContentVersion((current) => current + 1);
      fetchHeaderConfig();
    };

    window.addEventListener('madarsa:content-updated', handleContentUpdated);
    return () => window.removeEventListener('madarsa:content-updated', handleContentUpdated);
  }, []);

  useEffect(() => {
    const pathname = getInitialPathname();

    if (pathname === '/login' || pathname === '/reset-password') {
      setPage('login');
      setLoginMode(pathname === '/reset-password' ? 'reset-password' : 'head-login');
      setResetToken(getInitialSearchToken());
    }
  }, []);

  const fetchHeaderConfig = async () => {
    try {
      const data = await api.get('/public/bootstrap');
      const siteContent = getBootstrapSiteContent(data);
      if (siteContent) {
        setSiteName(siteContent.madarsa_name || 'مدرسہ اسلامیہ دارالہدیٰ');
        setSiteLogo(siteContent.logo_text || 'م');
        setFooterText(siteContent.footer_text || 'Madarsa Islamia Darul Huda. Serving students with sincerity and structure.');
      }
    } catch (err) {
      console.error('Bootstrap fetch failed in root:', err);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setLoginMode('head-login');
    setResetToken('');
    setPage('dashboard');
    fetchHeaderConfig(); // Reload if updated
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setLoginMode('head-login');
    setResetToken('');
    setPage('landing');
  };

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header/Navbar */}
      <header className="header-glass site-header" style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(242,236,220,0.94) 100%)',
        borderBottom: '1px solid rgba(15, 76, 58, 0.08)',
        boxShadow: '0 14px 30px rgba(15, 76, 58, 0.08), inset 0 1px 0 rgba(255,255,255,0.35)'
      }}>
        <div className="container site-header-inner" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '80px'
        }}>
          {/* Logo Section */}
          <div className="site-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }} onClick={() => setPage('landing')}>
            <img
                          src={MADARSA_LOGO}
                          alt="Madarsa logo"
              style={{
                width: '54px',
                height: '54px',
                objectFit: 'cover',
                borderRadius: '16px',
                boxShadow: '0 8px 20px rgba(15, 76, 58, 0.18)',
                display: 'block',
                border: '2px solid rgba(15, 76, 58, 0.12)'
              }}
            />
            <div>
              <span style={{
                fontFamily: 'Noto Naskh Arabic, Amiri, serif',
                fontWeight: 700,
                fontSize: '1.6rem',
                color: '#0d473c',
                letterSpacing: '0.02em',
                display: 'block',
              }} className="site-brand-text">
                مدرسہ اسلامیہ دارالہدیٰ
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          {page === 'landing' ? (
            <nav className="site-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <a href="#about" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-dark-muted)' }}>About</a>
              <a href="#login" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-dark-muted)' }} onClick={() => setPage('login')}>Login</a>
              <a href="#schedule" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-dark-muted)' }}>Schedule</a>
              <a href="#courses" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-dark-muted)' }}>Courses</a>
              <a href="#admission" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-dark-muted)' }}>Admission</a>
              <a href="#search" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-dark-muted)' }}>Search Student</a>
              <a href="#events" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-dark-muted)' }}>Events</a>
              <a href="#contact" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-dark-muted)' }}>Contact</a>
            </nav>
          ) : (
            <nav className="site-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <img
                      src={user?.profile_image || MADARSA_LOGO}
                      alt="Admin profile"
                        style={{
                      width: '40px',
                      height: '40px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        display: 'block',
                        border: '2px solid rgba(255,255,255,0.45)'
                      }} />
                    <div style={{ color: 'var(--white)', fontWeight: 700 }}>{user.display_name || user.full_name || user.email}</div>
                  </div>
                  <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.45rem 0.8rem' }}>Logout</button>
                </div>
              ) : (
                <button onClick={() => setPage('landing')} className="btn btn-outline" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>
                  Back to Home Page
                </button>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flexGrow: 1 }}>
        {page === 'landing' && <LandingPage setPage={setPage} refreshKey={contentVersion} />}
        {page === 'login' && (
          <Login
            initialMode={loginMode}
            initialResetToken={resetToken}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {page === 'dashboard' && user && (
          user.role === 'head' || user.role === 'admin' ? (
            <AdminDashboard
              user={user}
              onLogout={handleLogout}
              onAdminProfileUpdated={(profile) => {
                const nextUser = { ...user, ...profile, role: 'head' };
                setUser(nextUser);
                localStorage.setItem('user', JSON.stringify(nextUser));
              }}
            />
          ) : (
            <TeacherDashboard user={user} onLogout={handleLogout} />
          )
        )}
      </main>

      {/* Footer Section */}
      <footer className="site-footer" style={{
        background: 'var(--color-dark)',
        color: 'rgba(255,255,255,0.7)',
        padding: '4rem 0 2rem 0',
        fontFamily: 'var(--font-body)',
        fontSize: '0.9rem'
      }}>
        <div className="container">
          <div className="site-footer-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: '4rem',
            marginBottom: '3rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '3rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.25rem' }}>
                <div style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-dark)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem'
                }}>
                  {siteLogo}
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>
                  {siteName}
                </span>
              </div>
              <p style={{ lineHeight: 1.7, maxWidth: '420px' }}>
                {footerText}
              </p>
            </div>

            <div>
              <h4 style={{ color: 'var(--white)', fontFamily: 'var(--font-heading)', marginBottom: '1.25rem' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="#about" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={() => setPage('landing')}>About Section</a>
                <a href="#courses" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={() => setPage('landing')}>Offered Courses</a>
                <a href="#admission" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={() => setPage('landing')}>Apply Admission</a>
                <a href="#schedule" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={() => setPage('landing')}>Calendar Schedule</a>
              </div>
            </div>

          </div>

          <div className="site-footer-bottom" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.4)'
          }}>
            <div>
              (c) {new Date().getFullYear()} {siteName}. All Rights Reserved.
            </div>
            <div>
              Designed with premium aesthetics and security.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
