const mongoose = require('mongoose');
const Album = require('../models/albumModel');

// Luo uusi albumi
const createAlbum = async (req, res) => {
  const album = new Album(req.body);
  await album.save();
  res.status(201).json(album);
};

// Hae kaikki albumit
const getAllAlbums = async (req, res) => {
  const { sortBy = 'artist', order = 'asc', numericFilters, fields, search } = req.query;
  const sortOrder = order === 'desc' ? -1 : 1;

  const queryObject = {};

  if (numericFilters) {
    const operatorMap = {
      '>': '$gt',
      '<': '$lt',
      '>=': '$gte',
      '<=': '$lte',
      '=': '$eq'
    };
    const regEx = /\b(>|>=|=|<|<=)\b/g;
    let filters = numericFilters.replace(regEx, match => `-${operatorMap[match]}-`);
    filters.split(',').forEach((item) => {
      const [field, operator, value] = item.split('-');
      if (field === 'year') {
        queryObject[field] = { [operator]: Number(value) };
      }
    });
  }

  if (search) {
    queryObject.$or = [
      { artist: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.query.genre) {
    queryObject.genre = { $in: req.query.genre.split(',') };
  }

  const selectedFields = fields ? fields.split(',').join(' ') : '';

  const albums = await Album.find(queryObject)
    .select(selectedFields)
    .sort({ [sortBy]: sortOrder });

  res.status(200).json(albums);
};

// Hae albumi ID:llä
const getAlbumById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Virheellinen albumi-ID' });
  }

  const album = await Album.findById(req.params.id);
  if (!album) {
    return res.status(404).json({ message: 'Albumia ei löydy' });
  }
  res.status(200).json(album);
};

// Päivitä albumi
const updateAlbum = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Virheellinen albumi-ID' });
  }

  const album = await Album.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!album) {
    return res.status(404).json({ message: 'Albumia ei löydy' });
  }
  res.status(200).json(album);
};

// Poista albumi
const deleteAlbum = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Virheellinen albumi-ID' });
  }

  const album = await Album.findByIdAndDelete(req.params.id);
  if (!album) {
    return res.status(404).json({ message: 'Albumia ei löydy' });
  }
  res.status(200).json({ message: 'Albumi poistettu' });
};

module.exports = { createAlbum, getAllAlbums, getAlbumById, updateAlbum, deleteAlbum };