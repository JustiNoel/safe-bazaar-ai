import express from 'express';
import * as subscriptionController from '../controllers/subscriptionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/pricing', subscriptionController.getPricingPlans);
router.get('/status', authenticateToken, subscriptionController.getSubscriptionStatus);
router.post('/upgrade', authenticateToken, subscriptionController.upgradeToPremium);
router.post('/cancel', authenticateToken, subscriptionController.cancelSubscription);

export default router;
