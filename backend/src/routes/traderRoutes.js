const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');

router.use(requireAuth);

// GET /api/trader/dashboard/stats
router.get('/dashboard/stats', requireRole('TRADER'), async (req, res) => {
  try {
    const user = req.user;
    const availableRes = await db.query("SELECT COUNT(*) FROM marketplace_listings WHERE status = 'AVAILABLE' AND available_quantity_kg > 0");
    const harvestsRes = await db.query("SELECT COUNT(*) FROM harvest_records WHERE dried_quantity_kg > 0");
    const pendingRes = await db.query("SELECT COUNT(*) FROM purchase_requests WHERE trader_id = $1 AND status = 'PENDING'", [user.id]);
    const purchasedRes = await db.query("SELECT COALESCE(SUM(requested_quantity_kg), 0) as total FROM purchase_requests WHERE trader_id = $1 AND status = 'COMPLETED'", [user.id]);
    const inventoryRes = await db.query("SELECT COALESCE(SUM(quantity_kg), 0) as total FROM inventory_items WHERE owner_id = $1 AND status = 'IN_STOCK'", [user.id]);
    const salesRes = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM sale_records WHERE farmer_id = $1 OR buyer_id = $1", [user.id]);
    const ordersRes = await db.query("SELECT COUNT(*) FROM export_supply_requests WHERE trader_id = $1 AND status IN ('PENDING', 'ACCEPTED')", [user.id]);
    const txRes = await db.query("SELECT COUNT(*) FROM transaction_records WHERE sender_id = $1 OR receiver_id = $1", [user.id]);

    sendSuccess(res, 200, 'Trader stats loaded', {
      stats: {
        available_cardamom: parseInt(availableRes.rows[0].count) + parseInt(harvestsRes.rows[0].count),
        pending_purchase_requests: parseInt(pendingRes.rows[0].count),
        total_purchased_kg: parseFloat(purchasedRes.rows[0].total),
        current_inventory_kg: parseFloat(inventoryRes.rows[0].total),
        total_sales: parseFloat(salesRes.rows[0].total),
        active_orders: parseInt(ordersRes.rows[0].count),
        transactions: parseInt(txRes.rows[0].count)
      }
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// GET /api/trader/marketplace
router.get('/marketplace', async (req, res) => {
  try {
    const listingsRes = await db.query(`
      SELECT m.*, u.full_name as farmer_name, u.phone as farmer_phone, p.name as plantation_name, p.location
      FROM marketplace_listings m
      JOIN users u ON m.farmer_id = u.id
      LEFT JOIN plantations p ON m.plantation_id = p.id
      WHERE m.status = 'AVAILABLE' AND m.available_quantity_kg > 0
      ORDER BY m.created_at DESC
    `);

    const harvestsRes = await db.query(`
      SELECT h.*, u.full_name as farmer_name, u.phone as farmer_phone, p.name as plantation_name, p.location
      FROM harvest_records h
      JOIN users u ON h.farmer_id = u.id
      LEFT JOIN plantations p ON h.plantation_id = p.id
      WHERE h.dried_quantity_kg > 0
      ORDER BY h.harvest_date DESC
    `);

    const listings = listingsRes.rows.map(r => ({ ...r, available_quantity_kg: parseFloat(r.available_quantity_kg), price_per_kg: parseFloat(r.price_per_kg) }));
    
    harvestsRes.rows.forEach(h => {
      listings.push({
        id: `h-${h.id}`,
        farmer_id: h.farmer_id,
        farmer_name: h.farmer_name,
        farmer_phone: h.farmer_phone,
        variety: h.variety,
        available_quantity_kg: parseFloat(h.dried_quantity_kg),
        unit: 'KG',
        price_per_kg: 1800.00,
        grade: h.grade || '8mm Bold',
        plantation_id: h.plantation_id,
        plantation_name: h.plantation_name || 'Highland Cardamom Estate',
        location: h.location || 'Vandanmedu, Idukki',
        harvest_record_id: h.id,
        status: 'AVAILABLE',
        available_date: h.harvest_date,
        notes: h.notes || 'Premium organic dry cured cardamom.'
      });
    });

    sendSuccess(res, 200, 'Marketplace loaded', { marketplace: listings });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// GET /api/trader/exporters
router.get('/exporters', requireRole('TRADER'), async (req, res) => {
  try {
    const exportersRes = await db.query(
      "SELECT id, full_name as name, email, phone FROM users WHERE role = 'EXPORTER' AND status = 'APPROVED'"
    );
    sendSuccess(res, 200, 'Exporters loaded', { exporters: exportersRes.rows });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

module.exports = router;
