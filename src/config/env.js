require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongodbUri:
    process.env.MONGODB_URI ||
    'mongodb://admin:password@localhost:27017/mobile_commerce?authSource=admin',
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret_for_local_development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

module.exports = env;
