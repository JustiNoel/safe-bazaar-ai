import express from 'express';
import * as scanController from '../controllers/scanController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/quota', authenticateToken, scanController.checkScanQuota);
router.post('/perform', authenticateToken, scanController.performScan);
router.get('/history', authenticateToken, scanController.getScanHistory);
router.get('/:scanId', authenticateToken, scanController.getScanDetails);

export default router;
