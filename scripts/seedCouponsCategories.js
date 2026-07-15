const mongoose = require('mongoose');

const connectDatabase = require('../src/config/database');
const Category = require('../src/models/Category');
const Coupon = require('../src/models/Coupon');

const demoCategories = [
  { name: 'Điện thoại', description: 'Các dòng điện thoại di động thông minh chính hãng mới nhất' },
  { name: 'Máy tính bảng', description: 'Máy tính bảng iPad, Samsung Galaxy Tab hỗ trợ học tập, làm việc' },
  { name: 'Âm thanh', description: 'Tai nghe chụp tai, tai nghe TWS, loa Bluetooth chất lượng cao' },
  { name: 'Phụ kiện', description: 'Cáp sạc, củ sạc, ốp lưng, kính cường lực bảo vệ máy' }
];

const demoCoupons = [
  {
    code: 'KM10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    isActive: true
  },
  {
    code: 'GIAM50K',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderAmount: 500000,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    isActive: true
  }
];

async function seed() {
  try {
    await connectDatabase();
    console.log('MongoDB connected for seeding coupons & categories.');

    // Seed Categories
    await Category.deleteMany({});
    console.log('Cleared existing categories.');
    await Category.insertMany(demoCategories);
    console.log(`Seeded ${demoCategories.length} categories.`);

    // Seed Coupons
    await Coupon.deleteMany({});
    console.log('Cleared existing coupons.');
    await Coupon.insertMany(demoCoupons);
    console.log(`Seeded ${demoCoupons.length} coupons.`);

    console.log('Coupons and Categories seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding coupons & categories:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seed();
