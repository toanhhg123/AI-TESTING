const mongoose = require('mongoose');

const connectDatabase = require('../src/config/database');
const Product = require('../src/models/Product');
const { createSlug } = require('../src/utils/slug');

const demoProducts = [
  {
    name: 'iPhone 15 128GB',
    sku: 'IP15-128-BLK',
    brand: 'Apple',
    category: 'Điện thoại',
    price: 19990000,
    salePrice: 18990000,
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80',
    ],
    specifications: {
      screen: '6.1 inch Super Retina XDR',
      chip: 'A16 Bionic',
      storage: '128GB',
      camera: '48MP',
    },
    description: 'iPhone 15 chính hãng, hiệu năng ổn định, camera sắc nét.',
    tags: ['iphone', 'apple', 'ios', 'camera tốt'],
    isFeatured: true,
    soldCount: 42,
  },
  {
    name: 'Samsung Galaxy S24 256GB',
    sku: 'SS-S24-256-GRY',
    brand: 'Samsung',
    category: 'Điện thoại',
    price: 18490000,
    salePrice: 17490000,
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80',
    ],
    specifications: {
      screen: '6.2 inch Dynamic AMOLED',
      ram: '8GB',
      storage: '256GB',
      feature: 'Galaxy AI',
    },
    description: 'Galaxy S24 hỗ trợ Galaxy AI, màn hình đẹp, chụp ảnh linh hoạt.',
    tags: ['samsung', 'android', 'ai', 'camera'],
    isFeatured: true,
    soldCount: 38,
  },
  {
    name: 'Xiaomi 14T Pro',
    sku: 'XM-14TP-256-BLK',
    brand: 'Xiaomi',
    category: 'Điện thoại',
    price: 14990000,
    salePrice: 13990000,
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
    ],
    specifications: {
      screen: '6.67 inch AMOLED',
      ram: '12GB',
      storage: '256GB',
      charging: 'Sạc nhanh',
    },
    description: 'Xiaomi 14T Pro có hiệu năng cao, sạc nhanh và camera hợp tác Leica.',
    tags: ['xiaomi', 'android', 'sạc nhanh', 'hiệu năng'],
    isFeatured: true,
    soldCount: 27,
  },
  {
    name: 'iPad Gen 10 WiFi 64GB',
    sku: 'IPAD-G10-64-BLU',
    brand: 'Apple',
    category: 'Máy tính bảng',
    price: 10990000,
    salePrice: 9990000,
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
    ],
    specifications: {
      screen: '10.9 inch Liquid Retina',
      chip: 'A14 Bionic',
      storage: '64GB',
      connectivity: 'WiFi',
    },
    description: 'iPad Gen 10 phù hợp học tập, ghi chú, giải trí và làm việc nhẹ.',
    tags: ['ipad', 'tablet', 'apple', 'học tập'],
    soldCount: 19,
  },
  {
    name: 'Samsung Galaxy Tab S9 FE',
    sku: 'SS-TABS9FE-128',
    brand: 'Samsung',
    category: 'Máy tính bảng',
    price: 9490000,
    salePrice: 8990000,
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=900&q=80',
    ],
    specifications: {
      screen: '10.9 inch',
      ram: '6GB',
      storage: '128GB',
      pen: 'S Pen',
    },
    description: 'Galaxy Tab S9 FE hỗ trợ S Pen, phù hợp ghi chú và học online.',
    tags: ['samsung', 'tablet', 's pen', 'android'],
    soldCount: 14,
  },
  {
    name: 'AirPods Pro 2',
    sku: 'APP2-USB-C',
    brand: 'Apple',
    category: 'Phụ kiện',
    price: 5990000,
    salePrice: 5290000,
    stock: 40,
    images: [
      'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?auto=format&fit=crop&w=900&q=80',
    ],
    specifications: {
      connection: 'Bluetooth',
      charging: 'USB-C',
      feature: 'Chống ồn chủ động',
    },
    description: 'AirPods Pro 2 chống ồn tốt, kết nối nhanh với hệ sinh thái Apple.',
    tags: ['airpods', 'tai nghe', 'apple', 'phụ kiện'],
    soldCount: 55,
  },
  {
    name: 'Sạc nhanh Anker 30W USB-C',
    sku: 'ANK-30W-USBC',
    brand: 'Anker',
    category: 'Phụ kiện',
    price: 490000,
    salePrice: 390000,
    stock: 120,
    images: [
      'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=900&q=80',
    ],
    specifications: {
      power: '30W',
      port: 'USB-C',
      standard: 'Power Delivery',
    },
    description: 'Củ sạc nhanh nhỏ gọn, tương thích nhiều điện thoại và máy tính bảng.',
    tags: ['anker', 'sạc nhanh', 'usb-c', 'phụ kiện'],
    soldCount: 88,
  },
  {
    name: 'Ốp lưng trong suốt iPhone 15',
    sku: 'CASE-IP15-CLR',
    brand: 'Baseus',
    category: 'Phụ kiện',
    price: 250000,
    salePrice: 190000,
    stock: 200,
    images: [
      'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=80',
    ],
    specifications: {
      material: 'TPU',
      compatibility: 'iPhone 15',
      color: 'Trong suốt',
    },
    description: 'Ốp lưng bảo vệ iPhone 15, thiết kế trong suốt dễ dùng.',
    tags: ['ốp lưng', 'iphone', 'baseus', 'phụ kiện'],
    soldCount: 73,
  },
];

async function seedProducts() {
  await connectDatabase();

  for (const product of demoProducts) {
    await Product.updateOne(
      { sku: product.sku },
      {
        $set: {
          ...product,
          slug: createSlug(product.name),
          status: 'active',
        },
      },
      { upsert: true }
    );
  }

  console.log(`Seeded ${demoProducts.length} demo products.`);
}

seedProducts()
  .catch((error) => {
    console.error('Failed to seed demo products:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
