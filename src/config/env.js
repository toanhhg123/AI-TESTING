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
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: Number(process.env.EMAIL_PORT || 587),
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'Mobile Store <noreply@mobilestore.com>',
};

module.exports = env;
