import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(authenticateAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.post('/users/:userId/upgrade-premium', adminController.upgradeUserPremium);
router.post('/users/:userId/deactivate', adminController.deactivateUser);

router.get('/logs', adminController.getAdminLogs);
router.get('/analytics', adminController.getScanAnalytics);

export default router;
