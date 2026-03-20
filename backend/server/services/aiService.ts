// ============================================
// SipSpot - AI 分析服务
// 评论情感分析 + 批量分析 + 摘要生成 + 个性化推荐
// ============================================

import axios from 'axios';

/**
 * 分析评论内容
 */
export const analyzeReview = async (content, cafeName) => {
    try {
        if (!process.env.QWEN_API_KEY) {
            console.warn('未配置千问 API 密钥，使用基础情感分析');
            return basicSentimentAnalysis(content);
        }
        return await analyzeWithQwen(content, cafeName);
    } catch (error) {
        console.error('AI 分析失败:', error.message);
        return basicSentimentAnalysis(content);
    }
};

/**
 * 使用千问 API 进行分析
 */
async function analyzeWithQwen(content, cafeName) {
    try {
        const prompt = `分析以下关于咖啡店"${cafeName}"的评论，提供：
1. 情感倾向（positive/negative/neutral）
2. 3-5个关键词
3. 一句话总结（不超过50字）

评论内容：
"${content}"

请严格以JSON格式返回，不要包含其他文字，格式如下：
{
  "sentiment": "positive/negative/neutral",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "summary": "一句话总结",
  "confidence": 0.8
}`;

        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: "qwen-plus",
                input: {
                    messages: [
                        {
                            role: "system",
                            content: "你是一个专业的评论分析助手，擅长分析咖啡店评论的情感和关键信息。请始终返回有效的JSON格式，不要添加额外的解释或markdown标记。"
                        },
                        { role: "user", content: prompt }
                    ]
                },
                parameters: {
                    result_format: "message",
                    temperature: 0.4,
                    max_tokens: 1024,
                    enable_search: false
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.QWEN_API_KEY}`
                },
                timeout: 15000
            }
        );

        const generatedText = response.data.output.choices[0].message.content;
        const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(cleanedText);

        return {
            sentiment: validateSentiment(result.sentiment),
            keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 5) : [],
            summary: typeof result.summary === 'string' ? result.summary.substring(0, 100) : '',
            confidence: typeof result.confidence === 'number' ? Math.min(1, Math.max(0, result.confidence)) : 0.8
        };
    } catch (error) {
        if (error.response) {
            console.error('千问 API 响应错误:', {
                status: error.response.status,
                message: error.message
            });
        }
        throw error;
    }
}

function validateSentiment(sentiment) {
    const validSentiments = ['positive', 'negative', 'neutral'];
    return validSentiments.includes(sentiment) ? sentiment : 'neutral';
}

/**
 * 基础情感分析（不使用外部API）
 */
function basicSentimentAnalysis(content) {
    const lowerContent = content.toLowerCase();

    const positiveKeywords = [
        '好', '棒', '赞', '喜欢', '推荐', '优秀', '满意', '完美', '舒适', '美味',
        '不错', '温馨', '专业', '精致', '值得', '惊喜', '超赞', '很棒', '优质',
        'great', 'good', 'excellent', 'amazing', 'love', 'recommend', 'perfect', 'delicious',
        'nice', 'wonderful', 'fantastic', 'awesome', 'cozy', 'comfortable'
    ];

    const negativeKeywords = [
        '差', '糟', '烂', '不好', '失望', '难喝', '吵', '脏', '贵', '慢',
        '一般', '无聊', '冷淡', '拥挤', '嘈杂', '油腻', '难吃',
        'bad', 'terrible', 'disappointing', 'poor', 'awful', 'worst',
        'expensive', 'slow', 'noisy', 'dirty', 'crowded'
    ];

    let positiveCount = 0;
    let negativeCount = 0;
    const foundKeywords = [];

    positiveKeywords.forEach(keyword => {
        if (lowerContent.includes(keyword)) {
            positiveCount++;
            if (foundKeywords.length < 5 && !foundKeywords.includes(keyword)) {
                foundKeywords.push(keyword);
            }
        }
    });

    negativeKeywords.forEach(keyword => {
        if (lowerContent.includes(keyword)) {
            negativeCount++;
            if (foundKeywords.length < 5 && !foundKeywords.includes(keyword)) {
                foundKeywords.push(keyword);
            }
        }
    });

    let sentiment = 'neutral';
    let confidence = 0.6;

    if (positiveCount > negativeCount) {
        sentiment = 'positive';
        confidence = Math.min(0.9, 0.6 + (positiveCount - negativeCount) * 0.1);
    } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        confidence = Math.min(0.9, 0.6 + (negativeCount - positiveCount) * 0.1);
    }

    const summary = generateSimpleSummary(content, sentiment);

    return { sentiment, keywords: foundKeywords.slice(0, 5), summary, confidence };
}

function generateSimpleSummary(content, sentiment) {
    let summary = content.substring(0, 50);
    if (content.length > 50) summary += '...';

    const sentimentPrefix = { 'positive': '👍 ', 'negative': '👎 ', 'neutral': '🤔 ' };
    return sentimentPrefix[sentiment] + summary;
}

/**
 * 批量分析评论
 */
export const analyzeBulkReviews = async (reviews) => {
    try {
        if (!reviews || reviews.length === 0) {
            return {
                totalReviews: 0,
                analyzedReviews: 0,
                sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
                topKeywords: [],
                averageConfidence: 0
            };
        }

        const analyses = await Promise.all(
            reviews.map((review, index) =>
                analyzeReview(review.content, review.cafeName || '')
                    .catch(err => {
                        console.error(`分析评论 ${index + 1}/${reviews.length} 失败:`, err.message);
                        return null;
                    })
            )
        );

        const validAnalyses = analyses.filter(a => a !== null);

        const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
        const allKeywords = [];

        validAnalyses.forEach(analysis => {
            sentimentCounts[analysis.sentiment]++;
            allKeywords.push(...analysis.keywords);
        });

        const keywordFrequency: Record<string, number> = {};
        allKeywords.forEach(keyword => {
            keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
        });

        const topKeywords = Object.entries(keywordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([keyword]) => keyword);

        return {
            totalReviews: reviews.length,
            analyzedReviews: validAnalyses.length,
            sentimentDistribution: sentimentCounts,
            topKeywords,
            averageConfidence: validAnalyses.length > 0
                ? validAnalyses.reduce((sum, a) => sum + a.confidence, 0) / validAnalyses.length
                : 0
        };
    } catch (error) {
        console.error('批量分析失败:', error.message);
        throw error;
    }
};

/**
 * 生成咖啡店评论摘要
 */
export const generateCafeSummary = async (cafeId, reviews) => {
    try {
        if (!reviews || reviews.length === 0) return '暂无评论';

        const bulkAnalysis = await analyzeBulkReviews(reviews);
        const total = bulkAnalysis.totalReviews;
        const { positive, negative, neutral } = bulkAnalysis.sentimentDistribution;

        let summary = `基于 ${total} 条评论，`;

        if (positive > negative + neutral) {
            const positiveRate = Math.round((positive / total) * 100);
            summary += `顾客普遍给予好评（${positiveRate}% 好评率）。`;
        } else if (negative > positive + neutral) {
            const negativeRate = Math.round((negative / total) * 100);
            summary += `顾客反馈存在一些问题（${negativeRate}% 差评率）。`;
        } else {
            summary += '顾客评价较为中性。';
        }

        if (bulkAnalysis.topKeywords.length > 0) {
            summary += ` 常提到的关键词：${bulkAnalysis.topKeywords.slice(0, 5).join('、')}。`;
        }

        return summary;
    } catch (error) {
        console.error('生成摘要失败:', error.message);
        return '摘要生成失败';
    }
};

/**
 * 生成咖啡店 AI 描述
 */
export const generateCafeDescription = async (cafeName, cafeData, reviews) => {
    try {
        if (!process.env.QWEN_API_KEY) {
            return generateBasicDescription(cafeName, cafeData);
        }

        let reviewSummary = '暂无评论';
        if (reviews && reviews.length > 0) {
            reviewSummary = reviews.slice(0, 5).map(r => r.content).join('；');
        }

        const prompt = `为咖啡店"${cafeName}"生成一段吸引人的简介（80-120字）。

咖啡店信息：
- 名称：${cafeName}
- 位置：${cafeData.address || '未提供'}
- 评分：${cafeData.averageRating || 0}/5.0
- 最近评论：${reviewSummary}

要求：
1. 突出咖啡店的特色和优势
2. 语言温馨、吸引人
3. 80-120字
4. 不要使用夸张的形容词
5. 只返回描述文本，不要其他内容`;

        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: "qwen-plus",
                input: {
                    messages: [
                        {
                            role: "system",
                            content: "你是一个专业的咖啡店文案撰写助手，擅长创作温馨、真实、吸引人的咖啡店介绍。"
                        },
                        { role: "user", content: prompt }
                    ]
                },
                parameters: { result_format: "message", temperature: 0.7, max_tokens: 300 }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.QWEN_API_KEY}`
                },
                timeout: 15000
            }
        );

        return response.data.output.choices[0].message.content.trim();
    } catch (error) {
        console.error('生成 AI 描述失败:', error.message);
        return generateBasicDescription(cafeName, cafeData);
    }
};

function generateBasicDescription(cafeName, cafeData) {
    const rating = cafeData.averageRating || 0;
    const location = cafeData.address || '市中心';

    let description = `${cafeName}是一家位于${location}的咖啡店`;
    if (rating >= 4.5) description += '，深受顾客喜爱，提供优质的咖啡和舒适的环境。';
    else if (rating >= 4.0) description += '，为顾客提供温馨的空间和精心调制的咖啡。';
    else description += '，致力于为顾客带来美好的咖啡体验。';

    return description;
}

// ============================================
// 🆕 个性化推荐算法
// ============================================

/**
 * 生成个性化推荐
 * @param {Object} user - 用户对象（含 preferences）
 * @param {Array} candidateCafes - 候选咖啡店列表
 * @param {Object} userHistory - { reviews, favorites, visited }
 * @returns {Array} 带评分和推荐理由的咖啡店列表
 */
export const generatePersonalizedRecommendations = async (user, candidateCafes, userHistory) => {
    try {
        const { reviews = [], favorites = [], visited = [] } = userHistory;

        // 1. 统计用户偏好
        const amenityFreq: Record<string, number> = {};
        const specialtyFreq: Record<string, number> = {};
        const priceValues: number[] = [];

        // 从评论中提取偏好
        reviews.forEach(review => {
            if (review.cafe) {
                (review.cafe.amenities || []).forEach(a => {
                    amenityFreq[a] = (amenityFreq[a] || 0) + 1;
                });
                if (review.cafe.specialty) {
                    specialtyFreq[review.cafe.specialty] = (specialtyFreq[review.cafe.specialty] || 0) + 1;
                }
                if (review.cafe.price) priceValues.push(review.cafe.price);
            }
        });

        // 从收藏中提取（权重加倍）
        favorites.forEach(cafe => {
            (cafe.amenities || []).forEach(a => {
                amenityFreq[a] = (amenityFreq[a] || 0) + 2;
            });
            if (cafe.specialty) specialtyFreq[cafe.specialty] = (specialtyFreq[cafe.specialty] || 0) + 2;
            if (cafe.price) priceValues.push(cafe.price, cafe.price);
        });

        // 2. 计算用户偏好 profile
        const topAmenities = Object.entries(amenityFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([a]) => a);

        const topSpecialties = Object.entries(specialtyFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([s]) => s);

        const avgPrice = priceValues.length > 0
            ? priceValues.reduce((a, b) => a + b, 0) / priceValues.length
            : 2.5;

        // 3. 获取已访问过的咖啡店 ID（用于排除）
        const visitedIds = new Set(visited.map(v =>
            (v.cafe?._id || v.cafe || '').toString()
        ));
        const favoriteIds = new Set(favorites.map(f =>
            (f._id || f).toString()
        ));

        // 4. 结合 user.preferences.manual 的要求
        const manual = user.preferences?.manual || {};
        const mustHave = manual.mustHaveAmenities || [];
        const avoid = manual.avoidAmenities || [];

        // 5. 为每个候选咖啡店打分
        const scored = candidateCafes
            .filter(cafe => {
                const id = cafe._id.toString();
                // 排除已收藏的
                if (favoriteIds.has(id)) return false;
                // 检查必须有的设施
                if (mustHave.length > 0) {
                    const cafeAmenities = cafe.amenities || [];
                    if (!mustHave.every(a => cafeAmenities.includes(a))) return false;
                }
                // 检查要避免的设施
                if (avoid.length > 0) {
                    const cafeAmenities = cafe.amenities || [];
                    if (avoid.some(a => cafeAmenities.includes(a))) return false;
                }
                return true;
            })
            .map(cafe => {
                let score = 0;
                const reasons = [];

                // 设施匹配（最高 30 分）
                const cafeAmenities = cafe.amenities || [];
                const matchedAmenities = topAmenities.filter(a => cafeAmenities.includes(a));
                if (matchedAmenities.length > 0) {
                    score += matchedAmenities.length * 6;
                    reasons.push(`具备您偏好的设施: ${matchedAmenities.join('、')}`);
                }

                // 特色匹配（最高 20 分）
                if (cafe.specialty && topSpecialties.includes(cafe.specialty)) {
                    score += 20;
                    reasons.push(`特色匹配: ${cafe.specialty}`);
                }

                // 价格匹配（最高 15 分）
                if (cafe.price) {
                    const priceDiff = Math.abs(cafe.price - avgPrice);
                    if (priceDiff <= 0.5) {
                        score += 15;
                        reasons.push('价格符合您的预算');
                    } else if (priceDiff <= 1) {
                        score += 8;
                    }
                }

                // 评分加成（最高 20 分）
                if (cafe.rating) {
                    score += Math.min(20, cafe.rating * 4);
                    if (cafe.rating >= 4.5) reasons.push('高评分店铺');
                }

                // 评论数加成（最高 15 分，热门度）
                if (cafe.reviewCount) {
                    score += Math.min(15, cafe.reviewCount);
                }

                // 未访问过加分
                const id = cafe._id.toString();
                if (!visitedIds.has(id)) {
                    score += 5;
                    reasons.push('尚未去过');
                }

                return {
                    cafe,
                    score: Math.round(score),
                    reasons: reasons.length > 0 ? reasons : ['综合推荐'],
                    type: score >= 50 ? 'personalized' : 'general'
                };
            });

        // 6. 按分数排序
        scored.sort((a, b) => b.score - a.score);

        return scored;
    } catch (error) {
        console.error('生成个性化推荐失败:', error.message);
        // 降级：返回按评分排序的候选列表
        return candidateCafes.map(cafe => ({
            cafe,
            score: Math.round((cafe.rating || 0) * 10),
            reasons: ['综合推荐'],
            type: 'general'
        }));
    }
};

/**
 * 生成语义搜索结果的 Qwen 解释
 * @param {string} query - 用户的原始搜索词
 * @param {string[]} cafeNames - 最多 5 个咖啡馆名称
 * @returns {Promise<string|null>} 解释文本，失败时返回 null
 */
export const generateSearchExplanation = async (query, cafeNames) => {
    try {
        if (!process.env.QWEN_API_KEY) return null;

        const cafeList = cafeNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
        const prompt = `用户搜索："${query}"

我们为用户找到了以下咖啡馆：
${cafeList}

请用1-2句话简洁地解释为什么这些咖啡馆符合用户的需求。语气友好自然，不要逐条列举。`;

        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen-plus',
                input: {
                    messages: [
                        {
                            role: 'system',
                            content: '你是SipSpot咖啡馆推荐助手，用简洁友好的语言解释搜索结果。'
                        },
                        { role: 'user', content: prompt }
                    ]
                },
                parameters: {
                    result_format: 'message',
                    temperature: 0.5,
                    max_tokens: 150
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.QWEN_API_KEY}`
                },
                timeout: 10000
            }
        );

        return response.data.output.choices[0].message.content.trim();
    } catch (error) {
        console.error('生成搜索解释失败:', error.message);
        return null;
    }
};

// 导出配置信息
export const getConfig = () => {
    return {
        apiConfigured: !!process.env.QWEN_API_KEY,
        apiProvider: 'Qwen (通义千问)',
        model: 'qwen-plus'
    };
};
