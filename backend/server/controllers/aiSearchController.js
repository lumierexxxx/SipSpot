// ============================================
// SipSpot - AI Search Controller
// AI智能搜索控制器 - 解析自然语言并返回结果
// ============================================

const Cafe = require('../models/cafe');
const asyncHandler = require('../utils/asyncHandler');
const ExpressError = require('../utils/ExpressError');
const embeddingService = require('../services/embeddingService');
const vectorService = require('../services/vectorService');
const aiService = require('../services/aiService');

/**
 * @desc    AI智能搜索咖啡馆
 * @route   POST /api/cafes/ai-search
 * @access  Public
 */
exports.aiSearch = asyncHandler(async (req, res, next) => {
    const { query } = req.body;

    if (!query || !query.trim()) {
        return next(new ExpressError('请提供搜索查询', 400));
    }

    console.log('🤖 AI搜索查询:', query);

    // ── 语义搜索路径 ─────────────────────────────────────
    if (embeddingService.isReady()) {
        // 1. 生成查询向量
        const queryEmb = await embeddingService.generateEmbedding(query.trim(), 'query');

        // 2. 提取硬过滤条件（只有城市作为硬过滤）
        const cities = ['上海', '北京', '广州', '深圳', '杭州', '成都'];
        const detectedCity = cities.find(c => query.includes(c));
        const dbQuery = {
            isActive: true,
            embeddingUpdatedAt: { $exists: true, $ne: null },
            ...(detectedCity && { city: detectedCity })
        };

        // 3. 提取设施意图（用于 boost，不硬过滤）
        const amenityBoost = detectAmenityIntent(query);

        // 4. 查询候选咖啡馆（带 embedding 字段）
        const cafes = await Cafe.find(dbQuery)
            .select('+embedding')
            .populate('author', 'username avatar')
            .lean();

        // 5. 余弦排序
        const ranked = vectorService.rankCafes(queryEmb, cafes, { amenityBoost, topK: 10 });
        const results = ranked.map(r => r.cafe);

        console.log(`✅ 语义搜索返回 ${results.length} 个结果`);

        return res.status(200).json({
            success: true,
            query,
            mode: 'semantic',
            count: results.length,
            cafes: results
        });
    }

    // ── 降级：关键字搜索路径（保留原有逻辑）────────────────
    console.log('⚠️  Embedding 未就绪，使用关键字搜索');
    const parsedParams = parseNaturalLanguageQuery(query);
    const mongoQuery = buildMongoQuery(parsedParams);

    let cafesQuery = Cafe.find(mongoQuery)
        .populate('author', 'username avatar')
        .select('-reviews');

    cafesQuery = cafesQuery.sort(parsedParams.sort || { rating: -1, reviewCount: -1 });
    cafesQuery = cafesQuery.limit(parsedParams.limit || 20);

    const cafes = await cafesQuery;
    const explanation = generateExplanation(parsedParams, cafes.length);

    return res.status(200).json({
        success: true,
        query,
        mode: 'keyword',
        parsedParams,
        explanation,
        count: cafes.length,
        cafes
    });
});

/**
 * @desc    AI 搜索结果解释（Qwen 生成，前端异步调用）
 * @route   POST /api/cafes/ai-search/explain
 * @access  Public
 */
exports.explainSearch = asyncHandler(async (req, res, next) => {
    const { query, cafeNames } = req.body;
    // Input validated by explainSearchSchema middleware before reaching here

    const explanation = await aiService.generateSearchExplanation(query, cafeNames);

    res.status(200).json({
        success: true,
        explanation  // null if Qwen failed — frontend handles gracefully
    });
});

/**
 * 从查询文本中检测设施意图，返回中文设施名称数组（用于 amenityBoost）
 * 注意：必须使用中文枚举值以匹配 Cafe.amenities
 */
function detectAmenityIntent(query) {
    const lowerQuery = query.toLowerCase();
    const boost = [];

    if (lowerQuery.includes('wifi') || lowerQuery.includes('网络')) boost.push('WiFi');
    if (lowerQuery.includes('插座') || lowerQuery.includes('电源')) boost.push('电源插座');
    if (lowerQuery.includes('安静') || lowerQuery.includes('quiet')) boost.push('安静环境');
    if (lowerQuery.includes('户外') || lowerQuery.includes('露台')) boost.push('户外座位');
    if (lowerQuery.includes('宠物') || lowerQuery.includes('pet')) boost.push('宠物友好');
    if (lowerQuery.includes('办公') || lowerQuery.includes('工作') || lowerQuery.includes('work')) {
        boost.push('适合工作 / 办公', '适合使用笔记本电脑', 'WiFi', '电源插座');
    }

    return [...new Set(boost)];
}

/**
 * 解析自然语言查询
 */
function parseNaturalLanguageQuery(query) {
    const lowerQuery = query.toLowerCase();
    const params = {
        filters: {},
        sort: null,
        limit: 20,
        near: null
    };

    // 1. 解析距离和位置
    const distancePatterns = [
        /附近(\d+)公里/,
        /(\d+)公里(以内|范围|内)/,
        /距离.*?(\d+)公里/,
        /(\d+)km/i
    ];

    for (const pattern of distancePatterns) {
        const match = query.match(pattern);
        if (match) {
            const distance = parseInt(match[1]);
            params.distance = distance * 1000; // 转换为米
            
            // 这里需要用户的当前位置
            // 如果请求中有位置信息，使用它
            // 否则使用默认位置（上海人民广场）
            params.near = {
                type: 'Point',
                coordinates: [121.473701, 31.230416], // 默认：上海人民广场
                maxDistance: params.distance
            };
            break;
        }
    }

    // 2. 解析评分
    if (lowerQuery.includes('高分') || lowerQuery.includes('高评分') || lowerQuery.includes('评分高')) {
        params.filters.rating = { $gte: 4.0 };
        params.sort = { rating: -1, reviewCount: -1 };
    }
    
    const ratingMatch = query.match(/评分(\d+\.?\d*)分?以上/);
    if (ratingMatch) {
        params.filters.rating = { $gte: parseFloat(ratingMatch[1]) };
        params.sort = { rating: -1 };
    }

    // 3. 解析价格
    if (lowerQuery.includes('便宜') || lowerQuery.includes('实惠') || lowerQuery.includes('平价') || lowerQuery.includes('性价比')) {
        params.filters.price = { $lte: 2 };
    }
    
    if (lowerQuery.includes('高端') || lowerQuery.includes('豪华')) {
        params.filters.price = { $gte: 3 };
    }

    const priceMatch = query.match(/人均(\d+)元?以下/);
    if (priceMatch) {
        const avgPrice = parseInt(priceMatch[1]);
        if (avgPrice <= 30) params.filters.price = { $lte: 1 };
        else if (avgPrice <= 50) params.filters.price = { $lte: 2 };
        else if (avgPrice <= 80) params.filters.price = { $lte: 3 };
    }

    // 4. 解析设施需求
    const amenitiesList = [];
    
    if (lowerQuery.includes('wifi') || lowerQuery.includes('网络')) {
        amenitiesList.push('WiFi');
    }
    
    if (lowerQuery.includes('插座') || lowerQuery.includes('电源')) {
        amenitiesList.push('电源插座');
    }
    
    if (lowerQuery.includes('安静') || lowerQuery.includes('quiet')) {
        amenitiesList.push('安静环境');
    }
    
    if (lowerQuery.includes('户外') || lowerQuery.includes('露台') || lowerQuery.includes('outdoor')) {
        amenitiesList.push('户外座位');
    }
    
    if (lowerQuery.includes('宠物') || lowerQuery.includes('pet')) {
        amenitiesList.push('宠物友好');
    }
    
    if (lowerQuery.includes('办公') || lowerQuery.includes('工作') || lowerQuery.includes('work')) {
        amenitiesList.push('适合工作 / 办公', '适合使用笔记本电脑', 'WiFi', '电源插座');
    }

    if (amenitiesList.length > 0) {
        // 使用 $in 而不是 $all，匹配任意一个设施即可
        params.filters.amenities = { $in: [...new Set(amenitiesList)] };
    }

    // 5. 解析特色
    if (lowerQuery.includes('手冲') || lowerQuery.includes('pour over')) {
        params.filters.specialty = '手冲咖啡 Pour Over';
    } else if (lowerQuery.includes('拉花') || lowerQuery.includes('latte art')) {
        params.filters.specialty = '拉花咖啡 Latte Art';
    } else if (lowerQuery.includes('精品豆') || lowerQuery.includes('specialty')) {
        params.filters.specialty = '精品咖啡豆 Specialty Beans';
    }

    // 6. 解析场景需求
    if (lowerQuery.includes('拍照') || lowerQuery.includes('网红') || lowerQuery.includes('打卡')) {
        params.filters.rating = { $gte: 4.0 };
        // 可以添加标签过滤
    }

    if (lowerQuery.includes('约会') || lowerQuery.includes('浪漫')) {
        params.filters.amenities = { $in: ['户外座位', '安静环境'] };
    }

    // 7. 解析城市
    const cities = ['上海', '北京', '广州', '深圳', '杭州', '成都'];
    for (const city of cities) {
        if (query.includes(city)) {
            params.filters.city = city;
            break;
        }
    }

    // 8. 解析数量限制
    const limitMatch = query.match(/(\d+)家/);
    if (limitMatch) {
        params.limit = parseInt(limitMatch[1]);
    } else if (lowerQuery.includes('几家') || lowerQuery.includes('一些')) {
        params.limit = 6;
    } else if (lowerQuery.includes('很多') || lowerQuery.includes('大量')) {
        params.limit = 30;
    }

    return params;
}

/**
 * 构建MongoDB查询对象
 */
function buildMongoQuery(params) {
    const query = {
        isActive: true,
        ...params.filters
    };

    // 处理地理位置查询
    if (params.near) {
        query.geometry = {
            $near: {
                $geometry: params.near,
                $maxDistance: params.near.maxDistance
            }
        };
    }

    return query;
}

/**
 * 生成AI回复说明
 */
function generateExplanation(params, count) {
    const parts = [];

    if (count === 0) {
        return '很抱歉，没有找到完全符合你要求的咖啡馆。试试调整一下条件吧！';
    }

    parts.push(`我为你找到了 ${count} 家咖啡馆`);

    const conditions = [];

    if (params.distance) {
        conditions.push(`在${params.distance / 1000}公里范围内`);
    }

    if (params.filters.rating) {
        const minRating = params.filters.rating.$gte;
        if (minRating) {
            conditions.push(`评分${minRating}分以上`);
        }
    }

    if (params.filters.price) {
        if (params.filters.price.$lte <= 2) {
            conditions.push('性价比高');
        } else if (params.filters.price.$gte >= 3) {
            conditions.push('高端品质');
        }
    }

    if (params.filters.amenities) {
        // 修复：现在使用 $in 而不是 $all
        const amenities = params.filters.amenities.$in || params.filters.amenities.$all || [];
        if (amenities.includes('适合工作 / 办公')) {
            conditions.push('适合办公');
        }
        if (amenities.includes('安静环境')) {
            conditions.push('环境安静');
        }
        if (amenities.includes('户外座位')) {
            conditions.push('有户外座位');
        }
        if (amenities.includes('宠物友好')) {
            conditions.push('可以带宠物');
        }
    }

    if (params.filters.specialty) {
        const specialtyNames = {
            '手冲咖啡 Pour Over': '主打手冲咖啡',
            '拉花咖啡 Latte Art': '拉花艺术',
            '精品咖啡豆 Specialty Beans': '精品咖啡豆'
        };
        conditions.push(specialtyNames[params.filters.specialty]);
    }

    if (params.filters.city) {
        conditions.push(`位于${params.filters.city}`);
    }

    if (conditions.length > 0) {
        parts.push('，它们' + conditions.join('、'));
    }

    parts.push('。这些咖啡馆都很不错，你可以看看哪家最合适！');

    return parts.join('');
}

/**
 * 计算两点之间的距离（米）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半径（米）
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}