/* eslint-env jest */
const { beforeAll, afterAll, describe, it, expect } = global;
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Your Express app
const Album = require('../models/albumModel');
const albums = require('../scripts/seedTestDatabase'); // Import the dataset
const jwt = require('jsonwebtoken');

beforeAll(async () => {
  // Connect to the test database
  const testDbUri = 'mongodb://localhost:27017/albumiAppTest';
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Seed the database with the dataset
  await Album.deleteMany(); // Clear existing albums
  await Album.insertMany(albums); // Insert test albums
});

afterAll(async () => {
  // Clear the test database and close the connection
  await Album.deleteMany();
  await mongoose.connection.close();
});

describe('DELETE /api/albums/:id', () => {
  it('should delete an album and decrease the album count by one', async () => {
    // Seed the database with a new album to delete
    const albumToDelete = new Album({
      title: 'Album to Delete',
      artist: 'Artist to Delete',
      year: 2020,
      genre: 'Rock',
      tracks: [8],
      owner: '67ec51d45aaeb826d62d9131',
    });
    await albumToDelete.save();

    // Get the initial album count
    const initialCount = await Album.countDocuments();

    // Generate a valid token
    const token = jwt.sign(
      { userId: '67ec51d45aaeb826d62d9131', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send a DELETE request to delete the album
    const response = await request(app)
      .delete(`/api/albums/${albumToDelete._id}`)
      .set('Authorization', `Bearer ${token}`) // Include the token
      .expect(200); // Expect HTTP 200 OK

    // Verify the response contains a success message
    expect(response.body).toEqual({ message: 'Album deleted successfully' });

    // Verify the album count has decreased by one
    const finalCount = await Album.countDocuments();
    expect(finalCount).toBe(initialCount - 1);

    // Verify the album is no longer in the database
    const deletedAlbum = await Album.findById(albumToDelete._id);
    expect(deletedAlbum).toBeNull();
  });

  it('should return 404 when attempting to delete a non-existent album', async () => {
    // Generate a valid token
    const token = jwt.sign(
      { userId: '67ec51d45aaeb826d62d9131', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Use a non-existent album ID
    const nonExistentId = '67ec51d45aaeb826d62d9132';

    // Send a DELETE request to delete the non-existent album
    const response = await request(app)
      .delete(`/api/albums/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`) // Include the token
      .expect(404); // Expect HTTP 404 Not Found

    // Verify the response contains an appropriate error message
    expect(response.body).toEqual({ message: 'Album not found' });
  });
});