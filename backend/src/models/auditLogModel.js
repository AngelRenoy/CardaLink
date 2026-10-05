const db = require('../config/db');

class AuditLogModel {
  static async createLog({ user_id = null, email = null, action, details = '', ip_address = null }) {
    try {
      const query = `
        INSERT INTO audit_logs (user_id, email, action, details, ip_address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, email, action, details, ip_address, created_at;
      `;
      const values = [user_id, email, action, details, ip_address];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('[AuditLog Exception]: Failed to insert audit log entry:', error.message);
      return null;
    }
  }

  static async getRecentLogs(limit = 100) {
    const query = `
      SELECT id, user_id, email, action, details, ip_address, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1;
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  }
}

module.exports = AuditLogModel;
