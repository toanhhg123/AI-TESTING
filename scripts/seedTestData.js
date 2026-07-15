const { spawnSync } = require('node:child_process');
const path = require('node:path');

const scripts = ['seedUsers.js', 'seedProducts.js', 'seedCouponsCategories.js'];

for (const script of scripts) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script)], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log('Test data seed completed.');
