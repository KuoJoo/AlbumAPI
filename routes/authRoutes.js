const express = require('express');
const passport = require('passport');

const router = express.Router();

// Login route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err); // Pass any errors to the error-handling middleware
    }
    if (!user) {
      return res.status(401).json({ message: info.message }); // Return error message if login fails
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err); // Pass any errors to the error-handling middleware
      }
      return res.status(200).json({ message: 'Login successful', user }); // Return success message and user info
    });
  })(req, res, next);
});

// Logout route
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Check session route
router.get('/session', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

module.exports = router;