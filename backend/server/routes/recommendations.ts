// ============================================
// SipSpot - Recommendations Routes
// AI个性化推荐 + 偏好管理
// ============================================

import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth';
import {
    getRecommendations,
    getNearbyRecommendations,
    getUserPreferences,
    updatePreferences,
    learnFromBehavior,
    resetPreferences,
    getRecommendationStats,
    getExploreRecommendations
} from '../controllers/recommendationController';

// 所有推荐路由都需要认证
router.use(protect);

// 推荐
router.get('/', getRecommendations);
router.post('/nearby', getNearbyRecommendations);
router.get('/explore', getExploreRecommendations);
router.get('/stats', getRecommendationStats);

// 偏好管理
router.get('/preferences', getUserPreferences);
router.put('/preferences', updatePreferences);
router.delete('/preferences', resetPreferences);
router.post('/learn', learnFromBehavior);

export default router;
