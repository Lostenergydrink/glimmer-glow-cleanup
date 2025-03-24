/**
 * Contact form API endpoint
 * Handles form submissions and email notifications
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const csrf = require('csurf');
const router = express.Router();

// Configure CSRF protection
const csrfProtection = csrf({ cookie: true });

// Configure rate limiting
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many contact requests. Please try again in an hour.'
});

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Validation middleware
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
    .escape(),
  body('interest')
    .trim()
    .notEmpty()
    .withMessage('Please specify your area of interest')
    .escape(),
  body('message')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Message must be at least 10 characters long')
    .escape()
];

// Send email notification
async function sendEmailNotification(contactData) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Contact Form Submission - ${contactData.interest}`,
    text: `
Name: ${contactData.name}
Interest: ${contactData.interest}

Message:
${contactData.message}

Contact Info:
Email: ${contactData.email || 'Not provided'}
Phone: ${contactData.phone || 'Not provided'}
    `,
    html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${contactData.name}</p>
<p><strong>Interest:</strong> ${contactData.interest}</p>
<h3>Message:</h3>
<p>${contactData.message}</p>
<h3>Contact Info:</h3>
<p><strong>Email:</strong> ${contactData.email || 'Not provided'}</p>
<p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

// POST /api/contact
router.post('/', csrfProtection, contactLimiter, validateContact, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation failed'
      });
    }

    const { name, interest, message, email, phone } = req.body;

    try {
      // Send email notification
      await sendEmailNotification({ name, interest, message, email, phone });

      // Log submission for debugging (not stored in database)
      console.log(`Contact form submission received - ${name} (${interest})`);

      // Send success response
      res.status(200).json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send your message. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.toString() : undefined
      });
    }
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process your submission. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// GET /api/csrf-token - for testing purposes
router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

module.exports = router;
