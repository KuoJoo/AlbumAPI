const CustomError = require('../utils/customError');
const Album = require('../models/albumModel');

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new CustomError('Access denied. Admins only.', 403));
  }
  next();
};

// Middleware to check if the user owns the album or is an admin
const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return next(new CustomError('Album not found', 404));
    }

    // Allow admins to bypass ownership check
    if (req.user.role === 'admin') {
      return next();
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

module.exports = { isAdmin, isOwnerOrAdmin };