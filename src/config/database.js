const mongoose = require('mongoose');

const env = require('./env');

async function connectDatabase() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongodbUri);
  console.log('MongoDB connected');
}

module.exports = connectDatabase;
