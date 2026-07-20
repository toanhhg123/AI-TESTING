const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailPort === 465, // true for 465, false for other ports
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
});

async function sendMail({ to, subject, html }) {
  try {
    // If no credentials configured, just log to console to prevent crashing and allow offline demo testing!
    if (!env.emailUser || !env.emailPass) {
      console.log('--- MOCK EMAIL SENDER ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('HTML Body:');
      console.log(html);
      console.log('-------------------------');
      return { messageId: 'mock-id-' + Date.now() };
    }

    const info = await transporter.sendMail({
      from: env.emailFrom,
      to,
      subject,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Lỗi khi gửi Email:', error);
    throw error;
  }
}

module.exports = {
  sendMail,
};
