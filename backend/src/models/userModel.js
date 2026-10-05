const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const query = `
      SELECT id, full_name, email, phone, role, password_hash, avatar, is_verified, status, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1);
    `;
    const result = await db.query(query, [email.trim()]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const query = `
      SELECT id, full_name, email, phone, role, avatar, is_verified, status, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async createUser({ full_name, email, phone, role, password_hash, status = 'APPROVED' }) {
    const query = `
      INSERT INTO users (full_name, email, phone, role, password_hash, status)
      VALUES ($1, LOWER($2), $3, $4, $5, $6)
      RETURNING id, full_name, email, phone, role, status, is_verified, created_at;
    `;
    const values = [full_name.trim(), email.trim(), phone.trim(), role, password_hash, status];
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = UserModel;
