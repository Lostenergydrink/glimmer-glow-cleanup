import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// In test environment, load test-specific env vars
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
}

const app = express();
const port = process.env.PORT || 8080;

// Initialize Supabase client
const supabaseUrl = process.env.NODE_ENV === 'test' ? process.env.TEST_SUPABASE_URL : process.env.SUPABASE_URL;
const supabaseKey = process.env.NODE_ENV === 'test' ? process.env.TEST_SUPABASE_KEY : process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Setup email transport
let emailTransport;
if (process.env.NODE_ENV === 'test') {
  // For tests, we'll use the transport from test-setup
  // The actual transport will be injected during tests
  emailTransport = {
    sendMail: async (mailOptions) => {
      console.log('Test mode - email sending skipped');
      return { messageId: 'test-message-id' };
    }
  };
} else {
  // Production email transport
  emailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// If running in test mode, expose the transport for tests to replace
if (process.env.NODE_ENV === 'test') {
  app.set('emailTransport', emailTransport);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// CSRF protection
const csrfProtection = csrf({ cookie: true });
app.use((req, res, next) => {
  // Skip CSRF for test environment with special header
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-skip-csrf']) {
    req.csrfToken = () => 'test-token';
    next();
  } else {
    csrfProtection(req, res, next);
  }
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Initialize global rate limit store for tests
if (process.env.NODE_ENV === 'test' && !global.rateLimitStore) {
  global.rateLimitStore = {
    // Simple in-memory store implementation
    hits: {},
    resetAll: function () {
      this.hits = {};
    },
    incr: function (key, cb) {
      if (!this.hits[key]) {
        this.hits[key] = 0;
      }
      this.hits[key]++;
      cb(null, this.hits[key]);
    },
    decrement: function (key) {
      if (this.hits[key]) {
        this.hits[key]--;
      }
    }
  };
}

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'test'
    ? (parseInt(process.env.TEST_RATE_LIMIT_WINDOW_MS) || 1000)
    : (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000),
  max: process.env.NODE_ENV === 'test'
    ? (parseInt(process.env.TEST_RATE_LIMIT_MAX_REQUESTS) || 5)
    : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5),
  // Use a custom store for testing
  store: process.env.NODE_ENV === 'test' ? global.rateLimitStore : undefined
});

app.use('/api/contact', limiter);

// Contact form endpoint
app.post('/api/contact', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('interest').trim().notEmpty().withMessage('Interest is required'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    const { name, interest, message, email, phone } = req.body;

    // Store in database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{
        name,
        interest,
        message,
        email,
        phone,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw {
        message: 'Database error',
        details: error,
        hint: '',
        code: error.code || ''
      };
    }

    try {
      // Send email notification
      await emailTransport.sendMail({
        from: process.env.NODE_ENV === 'test' ? process.env.TEST_EMAIL_USER : process.env.SMTP_FROM,
        to: process.env.NODE_ENV === 'test' ? process.env.TEST_ADMIN_EMAIL : process.env.ADMIN_EMAIL,
        subject: `New Contact Form Submission: ${interest}`,
        text: `Name: ${name}\nInterest: ${interest}\nMessage: ${message}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Interest:</strong> ${interest}</p>
          <p><strong>Email:</strong> ${email || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <h3>Message:</h3>
          <p>${message}</p>
        `
      });
    } catch (emailError) {
      // Log but don't fail if email sending fails
      console.warn('Email sending failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      data: data ? data[0] : null
    });
  } catch (error) {
    console.error('Contact form error:', {
      message: error.message,
      details: error.stack,
      hint: error.hint || '',
      code: error.code || ''
    });

    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while processing your request.',
      details: error.details || error.toString(),
      hint: error.hint || '',
      code: error.code || ''
    });
  }
});

// Error handler for CSRF token errors
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({
      success: false,
      message: 'Invalid CSRF token. Please try again.'
    });
  } else {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Serve static files
app.use(express.static('public'));

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export for testing
export default server;
