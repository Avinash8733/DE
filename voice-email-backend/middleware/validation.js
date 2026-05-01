const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Email validation rules
const validateEmailComposition = [
  body('to')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid recipient email address'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject must not exceed 200 characters'),
  body('body')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Email body must be between 1 and 10000 characters'),
  body('cc')
    .optional()
    .custom((value) => {
      if (value) {
        const emails = value.split(',').map(email => email.trim());
        for (const email of emails) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Invalid CC email address');
          }
        }
      }
      return true;
    }),
  body('bcc')
    .optional()
    .custom((value) => {
      if (value) {
        const emails = value.split(',').map(email => email.trim());
        for (const email of emails) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Invalid BCC email address');
          }
        }
      }
      return true;
    }),
  handleValidationErrors
];

// Contact validation rules
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors
];

// Voice session validation
const validateVoiceSession = [
  body('sessionType')
    .isIn(['compose', 'navigation', 'read', 'command'])
    .withMessage('Invalid session type'),
  body('transcript')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Transcript must not exceed 5000 characters'),
  body('audioDuration')
    .optional()
    .isInt({ min: 0, max: 300000 })
    .withMessage('Audio duration must be between 0 and 300000 milliseconds'),
  body('confidenceScore')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence score must be between 0 and 1'),
  handleValidationErrors
];

// Parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateEmailFilters = [
  query('folder')
    .optional()
    .isIn(['inbox', 'sent', 'drafts', 'trash'])
    .withMessage('Invalid folder type'),
  query('isRead')
    .optional()
    .isBoolean()
    .withMessage('isRead must be a boolean'),
  query('isStarred')
    .optional()
    .isBoolean()
    .withMessage('isStarred must be a boolean'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateEmailComposition,
  validateContact,
  validateVoiceSession,
  validateId,
  validatePagination,
  validateEmailFilters
};
