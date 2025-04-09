const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    minlength: 3,
    maxlength: 50
  },
  artist: { 
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: 2025
  },
  genre: {
    type: String,
    required: true,
    enum: ['Suomirock', 'Rock', 'Iskelmä', 'Pop', 'Jazz', 'Metal', 'Blues', 'Rap', 'Country', 'Electronic', 'Classical', 'Reggae', 'Folk', 'Punk', 'Hip-Hop', 'Soul', 'Funk', 'Disco', 'Techno', 'House', 'Dance', 'Indie', 'Alternative', 'R&B', 'Gospel', 'Opera', 'World', 'New Age', 'Ambient', 'Chillout', 'Instrumental', 'Soundtrack', 'Other']
  },
  tracks: [{
    type: Number,
    min: 1,
    max: 100
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Pre-save hook to update the updatedAt timestamp
albumSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Album = mongoose.model('Album', albumSchema);

module.exports = Album;