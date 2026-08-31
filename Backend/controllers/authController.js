const madarsaStore = require('../data/madarsaStore');
const { createAuthToken, verifyPassword } = require('../utils/auth');
const sendError = require('../utils/sendError');
const { isEmailConfigured, sendPasswordResetEmail } = require('../utils/email');
const {
  validateAdminLoginPayload,
  validateForgotPasswordPayload,
  validatePasswordResetPayload,
  validateTeacherLoginPayload,
  validateTeacherPayload,
} = require('../utils/validators');

const HEAD_SIGNUP_CODE = process.env.HEAD_SIGNUP_CODE || 'DarulHudaHead2026';

const getFrontendOrigin = () => {
  if (process.env.FRONTEND_ORIGIN) {
    return String(process.env.FRONTEND_ORIGIN).replace(/\/+$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:5173';
};

const getAdminEnvCredentials = () => ({
  username: String(process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase(),
  password: String(process.env.ADMIN_PASSWORD || 'Admin123').trim(),
});

const buildAuthenticatedUser = (account, roleOverride = null) => {
  if (!account) {
    return null;
  }

  const role = roleOverride || account.role || 'teacher';

  if (account.id) {
    const user = {
      role,
      account_id: account.id,
      display_name: account.full_name,
      email: account.email,
      profile_image: account.profile_image || null,
    };

    if (role === 'teacher') {
      user.teacher_id = account.id;
    }

    return user;
  }

  return {
    role,
    username: account.username,
    display_name: account.display_name || 'Head of Madarsa',
    email: account.email || null,
  };
};

const createLoginResponse = (account, roleOverride = null) => {
  const user = buildAuthenticatedUser(account, roleOverride);
  const { profile_image, ...tokenUser } = user || {};
  const token = createAuthToken(tokenUser);

  return {
    token,
    user,
  };
};

const loginHead = async (req, res) => {
  try {
    const rawIdentifier = String(req.body?.email || req.body?.username || req.body?.identifier || '').trim();
    const rawPassword = String(req.body?.password || '').trim();

    if (!rawIdentifier || !rawPassword) {
      const { error } = validateAdminLoginPayload(req.body);
      if (error) {
        return res.status(400).json({ error });
      }
    }

    const normalizedIdentifier = rawIdentifier.toLowerCase();
    const envAdmin = getAdminEnvCredentials();

    if (normalizedIdentifier === envAdmin.username && rawPassword === envAdmin.password) {
      return res.status(200).json(
        createLoginResponse(
          {
            username: envAdmin.username,
            display_name: 'Administrator',
            email: `${envAdmin.username}@local.admin`,
          },
          'head'
        )
      );
    }

    if (!normalizedIdentifier || !rawPassword) {
      return res.status(400).json({ error: 'email or username and password are required.' });
    }

    if (!normalizedIdentifier.includes('@')) {
      return res.status(401).json({ error: 'Invalid head credentials.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
      return res.status(400).json({ error: 'A valid head email is required.' });
    }

    const headAccount = await madarsaStore.getTeacherCredentialsByEmail(normalizedIdentifier, {
      role: 'head',
    });

    if (!headAccount || !verifyPassword(rawPassword, headAccount.password_hash)) {
      return res.status(401).json({ error: 'Invalid head credentials.' });
    }

    return res.status(200).json(createLoginResponse(headAccount, 'head'));
  } catch (error) {
    return sendError(res, error);
  }
};

const loginTeacher = async (req, res) => {
  try {
    const { error, value } = validateTeacherLoginPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const teacher = await madarsaStore.getTeacherCredentialsByEmail(value.email, {
      role: 'teacher',
    });

    if (!teacher || !verifyPassword(value.password, teacher.password_hash)) {
      return res.status(401).json({ error: 'Invalid teacher credentials.' });
    }

    return res.status(200).json(createLoginResponse(teacher, 'teacher'));
  } catch (error) {
    return sendError(res, error);
  }
};

const signupHead = async (req, res) => {
  try {
    const setupCode = String(req.body.setup_code || '').trim();

    if (setupCode !== HEAD_SIGNUP_CODE) {
      return res.status(403).json({ error: 'Invalid head setup code.' });
    }

    const hasHeadAccount = await madarsaStore.hasHeadAccount();

    if (hasHeadAccount) {
      return res.status(409).json({ error: 'A head account already exists.' });
    }

    const { error, value } = validateTeacherPayload(req.body, { requirePassword: true });

    if (error) {
      return res.status(400).json({ error });
    }

    const existingHead = await madarsaStore.getTeacherCredentialsByEmail(value.email, {
      role: 'head',
    });

    if (existingHead) {
      return res.status(409).json({ error: 'A head account with this email already exists.' });
    }

    const headAccount = await madarsaStore.createHeadAccount(value);
    return res.status(201).json(createLoginResponse(headAccount, 'head'));
  } catch (error) {
    return sendError(res, error);
  }
};

const resetHeadAccount = async (req, res) => {
  try {
    const setupCode = String(req.body.setup_code || '').trim();

    if (setupCode !== HEAD_SIGNUP_CODE) {
      return res.status(403).json({ error: 'Invalid head setup code.' });
    }

    const hadHeadAccount = await madarsaStore.hasHeadAccount();

    if (!hadHeadAccount) {
      return res.status(200).json({
        message: 'No head account exists to remove.',
        head_account_removed: false,
      });
    }

    const removed = await madarsaStore.deleteHeadAccount();
    return res.status(200).json({
      message: removed
        ? 'Existing head account removed successfully. You can create a new one with your own credentials.'
        : 'No head account was removed.',
      head_account_removed: removed,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const signupTeacher = async (req, res) => {
  try {
    const { error, value } = validateTeacherPayload(req.body, { requirePassword: true });

    if (error) {
      return res.status(400).json({ error });
    }

    const existingTeacher = await madarsaStore.getTeacherCredentialsByEmail(value.email, {
      role: 'teacher',
    });

    if (existingTeacher) {
      return res.status(409).json({ error: 'A teacher account with this email already exists.' });
    }

    const teacherAccount = await madarsaStore.createTeacher(value);
    return res.status(201).json(createLoginResponse(teacherAccount, 'teacher'));
  } catch (error) {
    return sendError(res, error);
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { error, value } = validateForgotPasswordPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const resetInfo = await madarsaStore.requestPasswordReset(value.email);
    const resetLink = `${getFrontendOrigin()}${resetInfo.reset_link}`;

    if (isEmailConfigured()) {
      await sendPasswordResetEmail({
        recipient: resetInfo.email,
        resetLink,
      });
    } else {
      const configurationError = new Error('Email service is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in your deployment environment.');
      configurationError.status = 503;
      throw configurationError;
    }

    return res.status(200).json({
      message: 'If an account exists for that email, a password reset message has been sent.',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { error, value } = validatePasswordResetPayload(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const account = await madarsaStore.resetPasswordWithToken(value.token, value.password);

    return res.status(200).json({
      message: 'Password updated successfully.',
      user: buildAuthenticatedUser(account, account?.role || 'teacher'),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    if (req.auth.role === 'head') {
      const headAccountId = req.auth.account_id || req.auth.head_id || null;

      if (!headAccountId) {
        return res.status(200).json({
          role: 'head',
          username: req.auth.username,
          display_name: req.auth.display_name || 'Head of Madarsa',
        });
      }

      const headAccount = await madarsaStore.getTeacherById(headAccountId, {
        role: 'head',
      });

      if (!headAccount) {
        return res.status(404).json({ error: 'Head account not found.' });
      }

      return res.status(200).json(buildAuthenticatedUser(headAccount, 'head'));
    }

    const teacherId = req.auth.account_id || req.auth.teacher_id;
    const teacher = await madarsaStore.getTeacherById(teacherId, {
      role: 'teacher',
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    return res.status(200).json(buildAuthenticatedUser(teacher, 'teacher'));
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  forgotPassword,
  getCurrentUser,
  loginHead,
  loginTeacher,
  resetHeadAccount,
  resetPassword,
  signupHead,
  signupTeacher,
};
