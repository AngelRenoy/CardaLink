const db = require('../config/db');

class UserIdentityModel {
  static async findByProviderAndId(provider, provider_user_id) {
    const query = `
      SELECT ui.id, ui.user_id, ui.provider, ui.provider_user_id, ui.created_at,
             u.full_name, u.email, u.phone, u.role, u.status, u.is_verified, u.avatar
      FROM user_identities ui
      JOIN users u ON ui.user_id = u.id
      WHERE ui.provider = $1 AND ui.provider_user_id = $2;
    `;
    const result = await db.query(query, [provider, provider_user_id]);
    return result.rows[0] || null;
  }

  static async linkIdentity(user_id, provider, provider_user_id) {
    const query = `
      INSERT INTO user_identities (user_id, provider, provider_user_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (provider, provider_user_id) DO NOTHING
      RETURNING *;
    `;
    const result = await db.query(query, [user_id, provider, provider_user_id]);
    return result.rows[0] || null;
  }
}

module.exports = UserIdentityModel;
