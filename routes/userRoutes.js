require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');
const CustomError = require('../utils/customError');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware'); // Import isAdmin middleware

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password, passwordConfirmation } = req.body;

  if (!name || !email || !password || !passwordConfirmation) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== passwordConfirmation) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully', user: { name, email } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin-only route: Get all users
router.get('/users', authenticateJWT, isAdmin, async (req, res, next) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords from the response
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

// Admin-only route: Get a user by ID
router.get('/users/:id', authenticateJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Exclude password
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

// Admin-only route: Update a user
router.put('/users/:id', authenticateJWT, requireRole('admin'), async (req, res, next) => {
  const { id } = req.params;
  const { password, ...otherFields } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (password) {
      user.password = password; // Password will be hashed in the pre-save hook
    }
    Object.assign(user, otherFields);

    await user.save();
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Admin-only route: Delete a user
router.delete('/users/:id', authenticateJWT, isAdmin, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new CustomError('Email and password are required', 400));
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new CustomError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new CustomError('Invalid email or password', 401);
    }

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1m' } // Access token expires in 15 minutes
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' } // Refresh token expires in 7 days
    );

    // Save refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    // Send tokens to the client
    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true, // Prevent access from JavaScript
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({ accessToken });
  } catch (error) {
    next(error);
  }
});

// Logout route
router.post('/logout', async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(204).send(); // No content
  }

  try {
    // Find the user with the refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(204).send(); // No content
    }

    // Clear the refresh token from the database
    user.refreshToken = null;
    await user.save();

    // Clear the cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Refresh token route
router.post('/refresh-token', async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken; // Read refreshToken from cookies

  if (!refreshToken) {
    return next(new CustomError('Refresh token not provided', 401));
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the user with the refresh token
    const user = await User.findOne({ _id: decoded.userId, refreshToken });
    if (!user) {
      throw new CustomError('Invalid refresh token', 403);
    }

    // Generate a new access token
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Access token expires in 15 minutes
    );

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

module.exports = router;