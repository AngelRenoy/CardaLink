const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

async function initDatabase() {
  try {
    console.log('Initializing CardaLink IAM database schema & user_identities table...');
    
    // Read and run schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSql);

    // Update status constraint if required
    await db.query(`
      DO $$ 
      BEGIN 
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
        ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));
      EXCEPTION
        WHEN OTHERS THEN NULL;
      END $$;
    `);

    console.log('Database schema, status constraints, and user_identities table verified.');

    // Seed default Admin user if not existing
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cardalink.com';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || (process.env.NODE_ENV === 'production' ? null : 'Admin@1234');
    const existingAdmin = await db.query('SELECT id FROM users WHERE role = $1', ['ADMIN']);

    if (existingAdmin.rows.length === 0) {
      if (!adminPassword) {
        console.warn('[DB Security Notice] Production environment detected: ADMIN_INITIAL_PASSWORD environment variable is not set. Skipping automatic admin seeding for security.');
      } else {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        await db.query(
          `INSERT INTO users (full_name, email, phone, role, password_hash, status, is_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            'CardaLink System Administrator',
            adminEmail,
            '+919876543210',
            'ADMIN',
            passwordHash,
            'APPROVED',
            true
          ]
        );
        console.log(`Seeded System Administrator user (${adminEmail}). Credentials separated for environment: ${process.env.NODE_ENV || 'development'}`);
      }
    } else {
      console.log('System Administrator account verified in database.');
    }

    console.log('IAM Database initialization complete.');
    process.exit(0);

  } catch (error) {
    console.error('Failed to initialize IAM database:', error);
    process.exit(1);
  }
}

initDatabase();
