require('dotenv').config();
require('express-async-errors');
const express = require('express');
const app = express();
const albumRoutes = require('./routes/albumRoutes');
require('./config/db'); // Database connection
const userRoutes = require('./routes/userRoutes');
const CustomError = require('./utils/customError');
const session = require('express-session');
const passport = require('./config/passport');
const sessionStore = require('./config/sessionStore');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');

// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret', // Use a secure secret from .env
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // MongoDB session store
  })
);

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api', albumRoutes); // Existing album routes
app.use('/api', userRoutes); // Existing user routes
app.use('/auth', authRoutes); // New authentication routes

// Error-handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Virhe middleware:', err.stack);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }
  res.status(500).json({
    message: 'Jotain meni vikaan!',
    error: err.message,
  });
});

// Export the app for testing
module.exports = app;

// Start the server only if not in a test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000; // Use PORT from environment variables
  app.listen(PORT, () => {
    console.log(`Serveri käynnissä portissa ${PORT}`);
  });
}