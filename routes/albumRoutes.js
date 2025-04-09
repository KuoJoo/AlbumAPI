const express = require('express');
const Album = require('../models/albumModel');
const CustomError = require('../utils/customError');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');
const { isOwnerOrAdmin } = require('../middleware/roleMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateAlbum = [
  body('title').notEmpty().withMessage('Title is required'),
  body('artist').notEmpty().withMessage('Artist is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Year must be a valid number'),
  body('genre').notEmpty().withMessage('Genre is required'),
  body('tracks').isInt({ min: 1 }).withMessage('Tracks must be a positive number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Public route: Get all albums
router.get('/albums', async (req, res, next) => {
  try {
    const albums = await Album.find().populate('owner', 'name email');
    res.status(200).json(albums);
  } catch (error) {
    next(error);
  }
});

// Public route: Get an album by ID
router.get('/albums/:id', async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id).populate('owner', 'name email');
    if (!album) {
      throw new CustomError('Album not found', 404);
    }
    res.status(200).json(album);
  } catch (error) {
    next(error);
  }
});

// Protected route: Create an album
router.post('/albums', authenticateJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const album = new Album({ ...req.body, owner: req.user.id });
    await album.save();
    res.status(201).json(album);
  } catch (error) {
    next(error);
  }
});

// Protected route: Update an album
router.put('/albums/:id', authenticateJWT, isOwnerOrAdmin, validateAlbum, async (req, res, next) => {
  try {
    const album = await Album.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!album) {
      throw new CustomError('Album not found', 404);
    }
    res.status(200).json(album);
  } catch (error) {
    next(error);
  }
});

// Protected route: Delete an album
router.delete('/albums/:id', authenticateJWT, isOwnerOrAdmin, async (req, res, next) => {
  try {
    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) {
      throw new CustomError('Album not found', 404);
    }
    res.status(200).json({ message: 'Album deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;