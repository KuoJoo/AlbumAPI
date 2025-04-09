const MongoDBStore = require('connect-mongodb-session')(require('express-session'));

const store = new MongoDBStore({
  uri: process.env.DB_URI,
  collection: 'passport-sessions',
});

store.on('error', (error) => {
  console.error('Session store error:', error);
});

module.exports = store;