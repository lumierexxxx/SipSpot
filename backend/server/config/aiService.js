// ============================================
// SipSpot - AI 分析服务
// 使用 Google Gemini API 进行评论情感分析和关键词提取
// ============================================

const axios = require('axios');

/**
 * 分析评论内容
 * @param {string} content - 评论内容
 * @param {string} cafeName - 咖啡店名称
 * @returns {Object} AI 分析结果
 */
exports.analyzeReview = async (content, cafeName) => {
    try {
        // 如果没有配置 API 密钥，返回默认分析
        if (!process.env.GEMINI_API_KEY) {
            console.warn('未配置 Gemini API 密钥，使用基础情感分析');
            return basicSentimentAnalysis(content);
        }
        
        return await analyzeWithGemini(content, cafeName);
        
    } catch (error) {
        console.error('AI 分析失败:', error.message);
        // 降级到基础分析
        return basicSentimentAnalysis(content);
    }
};

/**
 * 使用 Gemini API 进行分析
 */
async function analyzeWithGemini(content, cafeName) {
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
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 1024,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10秒超时
            }
        );
        
        const generatedText = response.data.candidates[0].content.parts[0].text;
        
        // 清理可能的markdown代码块标记
        const cleanedText = generatedText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        
        const result = JSON.parse(cleanedText);
        
        return {
            sentiment: result.sentiment || 'neutral',
            keywords: result.keywords || [],
            summary: result.summary || '',
            confidence: result.confidence || 0.8
        };
        
    } catch (error) {
        console.error('Gemini API 错误:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * 基础情感分析（不使用外部API）
 * 基于关键词的简单规则
 */
function basicSentimentAnalysis(content) {
    const lowerContent = content.toLowerCase();
    
    // 正面关键词
    const positiveKeywords = [
        '好', '棒', '赞', '喜欢', '推荐', '优秀', '满意', '完美', '舒适', '美味',
        'great', 'good', 'excellent', 'amazing', 'love', 'recommend', 'perfect', 'delicious'
    ];
    
    // 负面关键词
    const negativeKeywords = [
        '差', '糟', '烂', '不好', '失望', '难喝', '吵', '脏', '贵', '慢',
        'bad', 'terrible', 'disappointing', 'poor', 'awful', 'worst', 'expensive', 'slow'
    ];
    
    let positiveCount = 0;
    let negativeCount = 0;
    const foundKeywords = [];
    
    // 计算正面词数量
    positiveKeywords.forEach(keyword => {
        if (lowerContent.includes(keyword)) {
            positiveCount++;
            foundKeywords.push(keyword);
        }
    });
    
    // 计算负面词数量
    negativeKeywords.forEach(keyword => {
        if (lowerContent.includes(keyword)) {
            negativeCount++;
            foundKeywords.push(keyword);
        }
    });
    
    // 判断情感
    let sentiment = 'neutral';
    let confidence = 0.6;
    
    if (positiveCount > negativeCount) {
        sentiment = 'positive';
        confidence = Math.min(0.9, 0.6 + (positiveCount - negativeCount) * 0.1);
    } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        confidence = Math.min(0.9, 0.6 + (negativeCount - positiveCount) * 0.1);
    }
    
    // 提取关键词（取前5个）
    const keywords = foundKeywords.slice(0, 5);
    
    // 生成简单总结
    const summary = generateSimpleSummary(content, sentiment);
    
    return {
        sentiment,
        keywords,
        summary,
        confidence
    };
}

/**
 * 生成简单总结
 */
function generateSimpleSummary(content, sentiment) {
    // 取评论的前50个字符作为总结
    let summary = content.substring(0, 50);
    if (content.length > 50) {
        summary += '...';
    }
    
    const sentimentPrefix = {
        'positive': '👍 ',
        'negative': '👎 ',
        'neutral': '🤔 '
    };
    
    return sentimentPrefix[sentiment] + summary;
}

/**
 * 批量分析评论
 * @param {Array} reviews - 评论数组
 * @returns {Object} 汇总分析结果
 */
exports.analyzeBulkReviews = async (reviews) => {
    try {
        const analyses = await Promise.all(
            reviews.map(review => 
                exports.analyzeReview(review.content, review.cafeName || '')
                    .catch(err => {
                        console.error(`分析评论 ${review._id} 失败:`, err.message);
                        return null;
                    })
            )
        );
        
        // 过滤掉失败的分析
        const validAnalyses = analyses.filter(a => a !== null);
        
        // 统计情感分布
        const sentimentCounts = {
            positive: 0,
            negative: 0,
            neutral: 0
        };
        
        const allKeywords = [];
        
        validAnalyses.forEach(analysis => {
            sentimentCounts[analysis.sentiment]++;
            allKeywords.push(...analysis.keywords);
        });
        
        // 统计关键词频率
        const keywordFrequency = {};
        allKeywords.forEach(keyword => {
            keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
        });
        
        // 排序关键词
        const topKeywords = Object.entries(keywordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([keyword]) => keyword);
        
        return {
            totalReviews: reviews.length,
            analyzedReviews: validAnalyses.length,
            sentimentDistribution: sentimentCounts,
            topKeywords,
            averageConfidence: validAnalyses.reduce((sum, a) => sum + a.confidence, 0) / validAnalyses.length
        };
        
    } catch (error) {
        console.error('批量分析失败:', error.message);
        throw error;
    }
};

/**
 * 生成咖啡店评论摘要
 * @param {string} cafeId - 咖啡店ID
 * @param {Array} reviews - 最近的评论
 * @returns {string} 摘要文本
 */
exports.generateCafeSummary = async (cafeId, reviews) => {
    try {
        if (reviews.length === 0) {
            return '暂无评论';
        }
        
        const bulkAnalysis = await exports.analyzeBulkReviews(reviews);
        
        const total = bulkAnalysis.totalReviews;
        const { positive, negative, neutral } = bulkAnalysis.sentimentDistribution;
        
        let summary = `基于 ${total} 条评论，`;
        
        if (positive > negative + neutral) {
            summary += '顾客普遍给予好评。';
        } else if (negative > positive + neutral) {
            summary += '顾客反馈存在一些问题。';
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