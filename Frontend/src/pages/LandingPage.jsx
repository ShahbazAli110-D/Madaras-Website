import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const formatTimeLabel = (value) => {
  if (!value) {
    return 'TBD';
  }

  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const parseDays = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    if (typeof val === 'string') {
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }
};
export default function LandingPage({ setPage, refreshKey = 0 }) {
  // Public bootstrap data
  const [siteContent, setSiteContent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admission form state
  const [admissionForm, setAdmissionForm] = useState({
    full_name: '',
    father_name: '',
    course_id: '',
    age: '',
    phone: '',
    address: ''
  });
  const [admissionSuccess, setAdmissionSuccess] = useState('');
  const [admissionError, setAdmissionError] = useState('');
  const [submittingAdmission, setSubmittingAdmission] = useState(false);

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  // Search state
  const [searchParams, setSearchParams] = useState({
    name: '',
    rollNo: '',
    courseId: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchBootstrapData();
  }, [refreshKey]);

  useEffect(() => {
    if (!admissionSuccess) {
      return undefined;
    }

    const dismissTimer = setTimeout(() => setAdmissionSuccess(''), 1000);
    return () => clearTimeout(dismissTimer);
  }, [admissionSuccess]);

  const fetchBootstrapData = async () => {
    try {
      setLoading(true);
      const data = await api.get('/public/bootstrap');
      const bootstrapSiteContent = data?.siteContent || data?.site_content || null;
      const bootstrapCourses = data?.activeCourses || data?.courses || [];
      const bootstrapEvents = data?.recentEvents || data?.events || [];
      const bootstrapWeeklySchedule = data?.weekly_schedule || data?.weeklySchedule || [];

      setSiteContent(bootstrapSiteContent);
      setCourses(bootstrapCourses);
      setEvents(bootstrapEvents);
      setWeeklySchedule(bootstrapWeeklySchedule);
    } catch (err) {
      console.error('Failed to load landing page data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();
    setAdmissionSuccess('');
    setAdmissionError('');
    setSubmittingAdmission(true);

    try {
      const payload = {
        ...admissionForm,
        course_id: Number(admissionForm.course_id),
        age: admissionForm.age ? Number(admissionForm.age) : null
      };
      const res = await api.post('/public/admissions', payload);
      const rollNumber = res?.student?.roll_no;
      setAdmissionSuccess(
        rollNumber
          ? `Registration successful! Your Roll Number is ${rollNumber}. Please note this down to search your status later.`
          : 'Registration successful! Your application has been submitted for review.'
      );
      setAdmissionForm({
        full_name: '',
        father_name: '',
        course_id: '',
        age: '',
        phone: '',
        address: ''
      });
    } catch (err) {
      setAdmissionError(err.message || 'Failed to submit admission.');
    } finally {
      setSubmittingAdmission(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSuccess('');
    setContactError('');
    setSubmittingContact(true);

    try {
      const response = await api.post('/public/contact', contactForm);
      setContactSuccess(response?.message || 'Your message has been sent successfully.');
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      setContactError(err.message || 'Failed to send your message.');
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setSearching(true);
    setHasSearched(true);

    try {
      const queryParams = new URLSearchParams();
      if (searchParams.name) queryParams.append('search', searchParams.name);
      if (searchParams.rollNo) queryParams.append('roll_no', searchParams.rollNo);
      if (searchParams.courseId) queryParams.append('course_id', searchParams.courseId);

      const results = await api.get(`/public/students/search?${queryParams.toString()}`);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ border: '4px solid rgba(15, 76, 58, 0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'pulseBorder 1s linear infinite' }} />
        <p style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>Loading Madarsa Portal...</p>
      </div>
    );
  }

  const name = siteContent?.madarsa_name || 'Madarsa Islamia Darul Huda';
  const logo = siteContent?.logo_text || 'م';
  const arabicBrandName = 'مدرسة دار الهدى الإسلامية';
  const arabicMadarsaName = 'مدرسة إسلامية دار الهدى شهيد مخدوم بلاول';
  const englishMadarsaName = 'Madarsa Islamia Darul Huda Shaheed Makhdoom Bilawal';
  const duroodText = 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ • اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ';
  const heroTitle = siteContent?.hero_title || 'A trusted digital home for your madarsa community';
  const heroDesc = siteContent?.hero_description || 'بِالْعِلْمِ وَالتَّرْبِيَةِ الصَّالِحَةِ، تُنشِئُ المدرسةُ أجيالًا تُحِبُّ اللهَ وَرَسُولَهُ، وَتَتَحَلَّى بِالْأَخْلاقِ وَالْعِلْمِ. فَهَذَا مَسْرًى إِلَى نُورِ الْعِلْمِ وَالْبِرِّ.';
  const aboutText = siteContent?.about_text || 'مدرسة دار الهدى الإسلامية تُعلي كرامة العلم، وتغرس القيم الإسلامية، وتبني جيلًا متدينًا، متعلمًا، ومخلصًا في خدمة الدين والوطن.';
  const admissionText = siteContent?.admission_text || 'Families can submit admission details online. The head of the madarsa will review submissions.';
  const specialNotice = siteContent?.special_notice || 'Notice: Daily classes resume at regular timings. Admission Portal is now Open.';
  
  return (
    <div>
      {admissionSuccess && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            width: 'min(560px, calc(100% - 2rem))',
            padding: '1rem 1.25rem',
            background: '#166534',
            color: '#fff',
            border: '1px solid #22c55e',
            borderRadius: '10px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)',
            textAlign: 'center',
            fontWeight: 700
          }}
        >
          {admissionSuccess}
        </div>
      )}

      {/* Notice Banner */}
      {specialNotice && (
        <div style={{
          background: 'var(--color-primary)',
          color: 'var(--white)',
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          textAlign: 'center',
          letterSpacing: '0.03em',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          📢 {specialNotice}
        </div>
      )}

      {/* Hero Section */}
      <section id="home" style={{
        position: 'relative',
        minHeight: '680px',
        color: 'var(--white)',
        overflow: 'hidden',
        background: '#0f2f2a'
      }}>
        <img
          src="/Madarsa Picture.jpg"
          alt="Madarsa Campus"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.7) saturate(1.1)',
          }}
        />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(5, 28, 22, 0.88) 0%, rgba(8, 41, 31, 0.66) 40%, rgba(8, 41, 31, 0.36) 100%)',
        }} />

        <div className="container" style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '680px',
          paddingTop: '4rem',
          paddingBottom: '4rem'
        }}>
          <div className="animate-fade-in" style={{
            maxWidth: '980px',
            width: '100%',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            minHeight: '100%'
          }}>
            <div className="arabic-marquee-shell" aria-label={arabicMadarsaName}>
              <div className="arabic-marquee-track">
                <span>{arabicMadarsaName}</span>
                <span aria-hidden="true">{arabicMadarsaName}</span>
                <span aria-hidden="true">{arabicMadarsaName}</span>
              </div>
            </div>

            <div className="arabic-subtitle" style={{
              fontSize: 'clamp(1.25rem, 2vw, 2.1rem)',
              marginBottom: '1rem',
              textShadow: '0 8px 22px rgba(0, 0, 0, 0.35)',
              direction: 'rtl',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #fff8de 0%, #f4dc8b 18%, #e7b44a 48%, #fef6db 70%, #d8a435 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '0.03em'
            }}>
              {englishMadarsaName}
            </div>

            <p style={{
              fontSize: '1.15rem',
              color: 'rgba(255,255,255,0.82)',
              marginBottom: '2rem',
              maxWidth: '660px',
              lineHeight: 1.8,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              {heroDesc}
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto' }}>
              <a href="#admission" className="btn btn-accent">Apply for Admission</a>
              <a href="#courses" className="btn btn-outline" style={{ borderColor: 'var(--white)', color: 'var(--white)' }}>Explore Courses</a>
            </div>
          </div>
        </div>

        <div className="news-marquee" style={{ position: 'relative', zIndex: 1 }}>
          <div className="news-marquee-track" aria-label="Durood Sharif message">
            <div className="news-marquee-item"><span>ﷺ</span><span>{duroodText}</span></div>
            <div className="news-marquee-item"><span>ﷺ</span><span>{duroodText}</span></div>
            <div className="news-marquee-item"><span>ﷺ</span><span>{duroodText}</span></div>
            <div className="news-marquee-item"><span>ﷺ</span><span>{duroodText}</span></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem auto' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>About Us</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Nurturing Islamic Values & Knowledge</h2>
            <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-accent)', margin: '0 auto' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-dark-muted)', marginBottom: '1.5rem', lineHeight: 1.8 }}>
                {aboutText}
              </p>
              <p style={{ color: 'var(--color-dark-muted)', lineHeight: 1.8 }}>
                Our educational platform is dedicated to maintaining high standards of Quranic and Arabic education. By combining dedicated teachers, a structured attendance system, and an organized weekly calendar, we establish an ideal environment for students to focus and succeed.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>{courses.length}</h3>
                <p style={{ fontWeight: 600, color: 'var(--color-dark)' }}>Active Courses</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-dark-muted)', marginTop: '0.5rem' }}>Specially tailored curriculum</p>
              </div>
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '2.5rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>{events.length}</h3>
                <p style={{ fontWeight: 600, color: 'var(--color-dark)' }}>Upcoming Events</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-dark-muted)', marginTop: '0.5rem' }}>Community gatherings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule / Vacation Section */}
      <section id="schedule" style={{ backgroundColor: 'var(--color-primary-light)', padding: '5rem 0' }}>
        <div className="container">
          <div style={{
            backgroundColor: 'var(--white)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '3rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'grid',
            gridTemplateColumns: '1fr 1.05fr',
            gap: '3rem',
            alignItems: 'start'
          }}>
            <div>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Weekly System</span>
              <h2 style={{ fontSize: '2rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>Madarsa Class Schedule</h2>
              <p style={{ color: 'var(--color-dark-muted)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
                Use the course editor in the admin dashboard to set the timing and teaching days that fit your madarsa routine.
              </p>
              <p style={{ color: 'var(--color-dark-muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
                The weekly calendar on the right reflects your saved course timings and instructor assignments automatically.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#dcfce7', color: '#15803d', borderRadius: '999px', fontWeight: 600 }}>
                  Open Saturday to Wednesday
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '999px', fontWeight: 600 }}>
                  Closed Thursday & Friday (Vacation)
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', padding: '1rem 1.15rem', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)', color: 'var(--color-dark-muted)', lineHeight: 1.7 }}>
                Tip: change course days, timing, or instructor names from the admin course panel and this calendar updates after save.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>Weekly Open / Closed Days</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Open Days</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(parseDays(siteContent?.open_days || siteContent?.openDays || []) || []).length > 0 ? (
                      (parseDays(siteContent?.open_days || siteContent?.openDays || [])).map((d) => (
                        <div key={d} style={{ padding: '0.45rem 0.75rem', borderRadius: '999px', background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                          {d}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--color-dark-muted)' }}>No open days configured.</div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Closed Days</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(parseDays(siteContent?.closed_days || siteContent?.closedDays || []) || []).length > 0 ? (
                      (parseDays(siteContent?.closed_days || siteContent?.closedDays || [])).map((d) => (
                        <div key={d} style={{ padding: '0.45rem 0.75rem', borderRadius: '999px', background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
                          {d}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--color-dark-muted)' }}>No closed days configured.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section id="donation" className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem auto' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Donate</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Support Needy Students and Families</h2>
            <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-accent)', margin: '0 auto' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'stretch' }}>
            <div style={{ padding: '2rem', borderRadius: '20px', background: 'var(--color-primary-light)', color: 'var(--color-dark)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Donation Situation</h3>
              <p style={{ color: 'var(--color-dark-muted)', lineHeight: 1.8 }}>
                {siteContent?.donation_situation || 'Your support helps provide food, uniforms, tuition, and school supplies for students facing financial hardship.'}
              </p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {(siteContent?.donation_items && siteContent.donation_items.length > 0) ? (
                siteContent.donation_items.map((item, i) => (
                  <div key={i} style={{ padding: '1.8rem', borderRadius: '20px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>{item.title}</div>
                    <div style={{ color: 'var(--color-dark-muted)', marginBottom: '0.5rem' }}>{item.message}</div>
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                      <div style={{ fontWeight: 700 }}>Easypaisa: <span style={{ fontWeight: 500 }}>{item.easypaisa || 'N/A'}</span></div>
                      <div style={{ fontWeight: 700 }}>JazzCash: <span style={{ fontWeight: 500 }}>{item.jazzcash || 'N/A'}</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ padding: '1.8rem', borderRadius: '20px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Easypaisa</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-dark)' }}>
                      {siteContent?.donation_easypaisa || 'Not configured'}
                    </div>
                  </div>
                  <div style={{ padding: '1.8rem', borderRadius: '20px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>JazzCash</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-dark)' }}>
                      {siteContent?.donation_jazzcash || 'Not configured'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="section-padding" style={{ backgroundColor: 'var(--gray-50)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem auto' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Curriculum</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Offered Islamic Courses</h2>
            <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-accent)', margin: '0 auto' }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {courses.map((course) => (
              <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  {course.teacher_profile_image ? (
                    <img src={course.teacher_profile_image} alt={course.teacher_name || 'Instructor'} style={{ width: '58px', height: '58px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-accent)' }} />
                  ) : (
                    <div style={{ width: '58px', height: '58px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '1.35rem', fontWeight: 700 }}>{(course.teacher_name || 'I').charAt(0)}</div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-dark-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Instructor</div>
                    <strong style={{ color: 'var(--color-dark)' }}>{course.teacher_name || 'Assigned Instructor'}</strong>
                    {course.teacher_qualification && <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{course.teacher_qualification}</div>}
                  </div>
                </div>
                <span style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem'
                }}>
                  {course.code}
                </span>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>{course.title}</h3>
                <p style={{ color: 'var(--color-dark-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', flexGrow: 1 }}>
                  {course.description}
                </p>
                <div style={{
                  borderTop: '1px solid var(--gray-200)',
                  paddingTop: '1rem',
                  marginTop: 'auto',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--color-dark-muted)'
                }}>
                  <div>
                    <strong>About Teacher:</strong>
                    <div style={{ color: 'var(--color-dark)', fontWeight: 500 }}>{course.teacher_bio || 'Dedicated to student learning and character.'}</div>
                  </div>
                  <div>
                    <strong>Timings:</strong>
                    <div style={{ color: 'var(--color-dark)', fontWeight: 500 }}>{course.start_time} - {course.end_time}</div>
                  </div>
                </div>
              </div>
            ))}

            {courses.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-dark-muted)' }}>
                No active courses available right now.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Admission Section */}
      <section id="admission" className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '5rem', alignItems: 'flex-start' }}>
          <div>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Admissions</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Submit Student Registration</h2>
            <p style={{ color: 'var(--color-dark-muted)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              {admissionText}
            </p>
            <p style={{ color: 'var(--color-dark-muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
              Please fill out all required fields on the application registry form. Once submitted, your registration is set to <strong>Pending</strong>. Our Head of Madarsa will review the application and assign/approve you to your course.
            </p>
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--border-radius-md)', borderLeft: '4px solid var(--color-primary)' }}>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Need Assistance?</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-dark-muted)' }}>
                If you encounter issues during admission form registry, please contact our support team immediately.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: '3rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Student Registry Form</h3>
            
            {admissionSuccess && (
              <div role="status" aria-live="polite" style={{ padding: '1rem', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ✓ {admissionSuccess}
              </div>
            )}

            {admissionError && (
              <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ✗ {admissionError}
              </div>
            )}

            <form onSubmit={handleAdmissionSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Student Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Abdullah Ali"
                    value={admissionForm.full_name}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Father's Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Rashid Ali"
                    value={admissionForm.father_name}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, father_name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min="4"
                    max="50"
                    className="form-control"
                    placeholder="e.g. 12"
                    value={admissionForm.age}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Course *</label>
                  <select
                    required
                    className="form-control"
                    value={admissionForm.course_id}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, course_id: e.target.value })}
                  >
                    <option value="">Select a Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title} ({course.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. +92 300 1234567"
                  value={admissionForm.phone}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Residential Address</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="e.g. Main Street, Pakistan"
                  value={admissionForm.address}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, address: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem' }}
                disabled={submittingAdmission}
              >
                {submittingAdmission ? 'Submitting Registry...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section id="search" className="section-padding" style={{ backgroundColor: 'var(--gray-50)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem auto' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Search Portal</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Verify Student Registry / Enrollment</h2>
            <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-accent)', margin: '0 auto' }} />
          </div>

          <div className="card" style={{ maxWidth: '850px', margin: '0 auto 3rem auto' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Roll Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MD-1001"
                  value={searchParams.rollNo}
                  onChange={(e) => setSearchParams({ ...searchParams, rollNo: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Student Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Hamza"
                  value={searchParams.name}
                  onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Course Filter</label>
                <select
                  className="form-control"
                  value={searchParams.courseId}
                  onChange={(e) => setSearchParams({ ...searchParams, courseId: e.target.value })}
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '44px' }} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {hasSearched && (
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Search Results ({searchResults.length})</h3>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((student, index) => (
                      <tr key={`${student.admission_status}-${index}`}>
                        <td>
                          <span className={`badge badge-${
                            student.admission_status === 'active' ? 'success' :
                            student.admission_status === 'pending' ? 'warning' : 'info'
                          }`}>
                            {student.admission_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {searchResults.length === 0 && (
                      <tr>
                        <td style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-dark-muted)' }}>
                          No students found matching search filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Special Events Section */}
      <section id="events" className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem auto' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Notice Board</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Special Events & Announcments</h2>
            <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-accent)', margin: '0 auto' }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2.5rem'
          }}>
            {events.map((event) => (
              <div key={event.id} className="card" style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--color-accent)' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  📅 {new Date(event.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>{event.title}</h3>
                <p style={{ color: 'var(--color-dark-muted)', fontSize: '0.95rem', flexGrow: 1, marginBottom: '1.5rem' }}>
                  {event.description}
                </p>
                {event.location && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-dark-muted)', borderTop: '1px solid var(--gray-200)', paddingTop: '0.8rem' }}>
                    📍 Location: <strong>{event.location}</strong>
                  </div>
                )}
              </div>
            ))}

            {events.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-dark-muted)' }}>
                No events currently scheduled. Check back soon!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-padding" style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem auto' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Contact Info</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Get in Touch</h2>
            <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-accent)', margin: '0 auto' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '5rem', alignItems: 'center' }}>
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Contact Address & Support</h3>
              <p style={{ color: 'var(--color-dark-muted)', marginBottom: '2.5rem' }}>
                Feel free to visit us or reach out via phone/email for any questions concerning enrollment, teaching, or event sponsorship.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem', marginTop: '0.2rem' }}>📍</div>
                  <div>
                    <strong>Location Address:</strong>
                    <div style={{ color: 'var(--color-dark-muted)', marginTop: '0.25rem' }}>{siteContent?.contact_address || 'Main Road, Community Campus, Pakistan'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem', marginTop: '0.2rem' }}>✉</div>
                  <div>
                    <strong>Email Address:</strong>
                    <div style={{ color: 'var(--color-dark-muted)', marginTop: '0.25rem' }}>{siteContent?.contact_email || 'info@darulhuda.local'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem', marginTop: '0.2rem' }}>📞</div>
                  <div>
                    <strong>Phone Contact:</strong>
                    <div style={{ color: 'var(--color-dark-muted)', marginTop: '0.25rem' }}>{siteContent?.contact_phone || '+92 300 1234567'}</div>
                  </div>
                </div>
              </div>
            </div>

            <form className="card" style={{ padding: '2.5rem' }} onSubmit={handleContactSubmit}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Send Quick Message</h3>
              {contactSuccess && <div style={{ padding: '0.75rem', marginBottom: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px' }}>{contactSuccess}</div>}
              {contactError && <div style={{ padding: '0.75rem', marginBottom: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>{contactError}</div>}
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" className="form-control" placeholder="e.g. Zafar Iqbal" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Your Email Address</label>
                <input type="email" className="form-control" placeholder="e.g. zafar@email.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Message Content</label>
                <textarea className="form-control" rows="3" placeholder="How can we assist you?" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submittingContact}>
                {submittingContact ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
