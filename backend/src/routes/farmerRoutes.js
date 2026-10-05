const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, requirePermission, requireOwnership } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { sendSuccess } = require('../utils/responseHandler');

router.use(requireAuth);
router.use(requireRole('FARMER', 'ADMIN'));

// Farmer Dashboard Stats API returning initial values
router.get('/dashboard/stats', (req, res) => {
  sendSuccess(res, 200, 'Farmer dashboard stats retrieved', {
    stats: {
      total_plantations: 0,
      total_harvest_kg: 0,
      total_inventory_kg: 0,
      total_sales: 0,
      total_expenses: 0,
      total_transactions: 0,
      total_fertilizer_usage_kg: 0,
      total_pesticide_usage: 0,
      total_irrigation_records: 0,
      active_harvest_cycles: 0,
      completed_harvest_cycles: 0,
    },
  });
});

// Demonstration Farmer Protected API with Ownership Verification
router.get(
  '/plantations/:farmer_id',
  requirePermission(PERMISSIONS.VIEW_OWN_PLANTATION),
  requireOwnership('farmer_id'),
  (req, res) => {
    sendSuccess(res, 200, 'Access Granted: Farmer plantation data accessed securely', {
      plantation: {
        id: 'PLANT_001',
        farmer_id: req.user.id,
        farmer_name: req.user.full_name,
        estate_name: 'Idukki Western Ghats Cardamom Estate',
        location: 'Vandanmedu, Idukki, Kerala',
        total_area_acres: 14.5,
        variety: 'Spices Board Green Gold (Njallani)',
      },
    });
  }
);

module.exports = router;
