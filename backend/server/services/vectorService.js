// ============================================
// SipSpot - Vector Math Service
// 余弦相似度计算 + 咖啡馆排序 + 用户偏好向量计算
// 纯数学，无外部依赖，可独立测试
// ============================================

'use strict';

// ============================================
// 基础向量运算
// ============================================

/**
 * 计算两个向量的余弦相似度
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} -1 到 1，越接近 1 越相似
 */
function cosineSimilarity(a, b) {
    if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
        return 0;
    }
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot  += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * L2 归一化向量（使模长为 1）
 * @param {number[]} v
 * @returns {number[]}
 */
function normalizeVector(v) {
    if (!v || v.length === 0) return v;
    const mag = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    if (mag === 0) return v;
    return v.map(x => x / mag);
}

// ============================================
// 咖啡馆排序
// ============================================

/**
 * 按语义相似度对咖啡馆排序
 * @param {number[]} queryEmb - 查询向量（1024 维）
 * @param {Array} cafes - 含 embedding 字段的对象数组（Mongoose lean 或普通对象均可）
 * @param {Object} options
 * @param {string[]} [options.amenityBoost] - 中文设施名称，匹配则加分，e.g. ['WiFi', '安静环境']
 * @param {number} [options.topK=10]
 * @returns {{ cafe: Object, similarityScore: number }[]}
 */
function rankCafes(queryEmb, cafes, options = {}) {
    const { amenityBoost = [], topK = 10 } = options;

    const scored = cafes
        .filter(cafe => cafe.embedding && cafe.embedding.length === 1024)
        .map(cafe => {
            let score = cosineSimilarity(queryEmb, cafe.embedding);

            // 设施 boost：每匹配一个中文设施名 +0.1，最多 +0.3
            if (amenityBoost.length > 0 && cafe.amenities) {
                const matchCount = amenityBoost.filter(a => cafe.amenities.includes(a)).length;
                score += Math.min(matchCount * 0.1, 0.3);
            }

            return { cafe, similarityScore: Math.min(score, 1) };
        });

    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    return scored.slice(0, topK);
}

// ============================================
// 用户偏好向量计算
// ============================================

/**
 * 计算用户偏好 embedding（带衰减的加权平均）
 * @param {{ embedding: number[], weight: number, addedAt: Date }[]} historyItems
 * @returns {number[]} L2 归一化后的向量，或空数组（如无有效数据）
 */
function computeUserEmbedding(historyItems) {
    if (!historyItems || historyItems.length === 0) return [];

    const valid = historyItems.filter(
        item => item.embedding && item.embedding.length === 1024
    );
    if (valid.length === 0) return [];

    // 按时间降序，只取最近 30 条（滑动窗口）
    const sorted = [...valid].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    const window = sorted.slice(0, 30);

    // 指数衰减：越新的权重越高 effectiveWeight = item.weight × 0.85^index
    const dim = 1024;
    const avg = new Array(dim).fill(0);
    let totalWeight = 0;

    window.forEach((item, index) => {
        const decay = Math.pow(0.85, index);
        const effectiveWeight = item.weight * decay;
        totalWeight += effectiveWeight;
        for (let i = 0; i < dim; i++) {
            avg[i] += item.embedding[i] * effectiveWeight;
        }
    });

    if (totalWeight === 0) return [];

    const weighted = avg.map(v => v / totalWeight);
    return normalizeVector(weighted);
}

// ============================================
// 节流检查
// ============================================

/**
 * 检查用户偏好向量是否需要更新（1 分钟节流）
 * @param {Object} user - 含 preferenceEmbeddingUpdatedAt 字段的用户对象
 * @returns {boolean} true = 可以更新，false = 跳过
 */
function shouldUpdatePreference(user) {
    if (!user.preferenceEmbeddingUpdatedAt) return true;
    return Date.now() - new Date(user.preferenceEmbeddingUpdatedAt).getTime() > 60_000;
}

// ============================================
// 导出
// ============================================
module.exports = {
    cosineSimilarity,
    normalizeVector,
    rankCafes,
    computeUserEmbedding,
    shouldUpdatePreference
};
