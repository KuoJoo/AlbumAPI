const CustomError = require('../utils/customError');
const Album = require('../models/albumModel');
const jwt = require('jsonwebtoken');

// Middleware to check if the user has a specific role
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return next(new CustomError('Access denied. Insufficient permissions.', 403));
  }
  next();
};

// Middleware to check if the user owns the album or is an admin
const requireOwnership = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id); // No need to populate unless required
    if (!album) {
      return next(new CustomError('Album not found', 404));
    }

    // Ensure `req.user` exists
    if (!req.user) {
      return next(new CustomError('Unauthorized. No user information available.', 401));
    }

    console.log('Logged-in user ID:', req.user.id); // Debug log
    console.log('Album owner ID:', album.owner.toString()); // Debug log
    console.log('Logged-in user role:', req.user.role); // Debug log

    // Allow admins to bypass ownership check
    if (req.user.role === 'admin') {
      return next(); // Admins can proceed without ownership check
    }

    // Check if the user is the owner
    if (album.owner.toString() !== req.user.id) {
      return next(new CustomError('Access denied. You do not own this album.', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to authenticate and decode JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new CustomError('Unauthorized. No token provided.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message); // Log the error
    return next(new CustomError('Invalid or expired token.', 401));
  }
};

module.exports = { authenticateJWT, requireRole, requireOwnership };