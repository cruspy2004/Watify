const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function seedAdminUser() {
  const adminName = process.env.ADMIN_NAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminName || !adminEmail || !adminPassword) {
    console.log('Admin seed skipped because ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD is missing');
    return;
  }

  console.log(`Ensuring admin user exists for ${adminEmail}...`);

  const existingUser = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  if (existingUser.rows.length === 0) {
    await query(
      'INSERT INTO users (name, email, password, role, active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      [adminName, adminEmail, hashedPassword, 'admin', true]
    );

    console.log(`Admin user created for ${adminEmail}`);
    return;
  }

  await query(
    'UPDATE users SET name = $1, password = $2, role = $3, active = $4, updated_at = NOW() WHERE email = $5',
    [adminName, hashedPassword, 'admin', true, adminEmail]
  );

  console.log(`Admin user refreshed for ${adminEmail}`);
}

module.exports = {
  seedAdminUser,
};
