const mongoose = require('mongoose');

const dbUri = process.env.NODE_ENV === 'test' ? process.env.TEST_DB_URI : process.env.DB_URI;

mongoose
  .connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to MongoDB: ${dbUri}`);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
  });

module.exports = mongoose;