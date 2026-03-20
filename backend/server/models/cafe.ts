// ============================================
// SipSpot - 咖啡馆数据模型
// 包含地理位置、评分、AI总结等功能
// ============================================

import mongoose, { Schema, model } from 'mongoose'
import Review from './review'
import * as aiService from '../services/aiService'
import { ICafe, AmenityKey, SpecialtyType, DayKey, VibeType } from '../types'

// ============================================
// 图片子模式
// ============================================
const ImageSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    publicId: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// 图片虚拟属性
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200,h_200,c_fill');
});

ImageSchema.virtual('cardImage').get(function () {
    return this.url.replace('/upload', '/upload/w_400,h_300,c_fill');
});

// ============================================
// 营业时间子模式
// ============================================
const OpeningHoursSchema = new Schema({
    day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as DayKey[]
    },
    open: String,      // 开门时间 "09:00"
    close: String,     // 关门时间 "22:00"
    closed: {
        type: Boolean,
        default: false
    }
}, { _id: false });

// ============================================
// 主模式
// ============================================
const opts = {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CafeSchema = new Schema<any>({
    // ============================================
    // 基本信息
    // ============================================
    name: {
        type: String,
        required: [true, '请提供咖啡馆名称'],
        trim: true,
        maxlength: [100, '咖啡馆名称不能超过100个字符']
    },

    description: {
        type: String,
        required: [true, '请提供咖啡馆描述'],
        trim: true,
        minlength: [10, '描述至少需要10个字符'],
        maxlength: [2000, '描述不能超过2000个字符']
    },

    images: {
        type: [ImageSchema],
        validate: {
            validator: function(v: unknown[]) {
                return v.length <= 10;
            },
            message: '最多允许10张图片'
        }
    },

    // ============================================
    // 位置信息 (GeoJSON 格式)
    // ============================================
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: [true, '请提供坐标'],
            validate: {
                validator: function(v: number[]) {
                    return v.length === 2 &&
                           v[0] >= -180 && v[0] <= 180 &&
                           v[1] >= -90 && v[1] <= 90;
                },
                message: '坐标格式无效'
            }
        }
    },

    address: {
        type: String,
        required: [true, '请提供地址'],
        trim: true
    },

    city: {
        type: String,
        required: [true, '请提供城市'],
        trim: true,
        index: true
    },

    // ============================================
    // 咖啡馆特色
    // ============================================
    price: {
        type: Number,
        min: [1, '价格等级必须在1-4之间'],
        max: [4, '价格等级必须在1-4之间'],
        default: 2,
        required: true
    },

    amenities: [{
        type: String,
        enum: [
            'wifi',
            'power_outlet',
            'quiet',
            'outdoor_seating',
            'pet_friendly',
            'no_smoking',
            'air_conditioning',
            'parking',
            'wheelchair_accessible',
            'laptop_friendly',
            'group_friendly',
            'work_friendly'
        ] as AmenityKey[]
    }],

    specialty: {
        type: String,
        enum: ['espresso', 'pour_over', 'cold_brew', 'latte_art', 'specialty_beans', 'desserts', 'light_meals'] as SpecialtyType[],
        default: 'espresso'
    },

    vibe: {
        type: String,
        enum: ['Specialty', 'Cozy Vibes', 'Work-Friendly', 'Outdoor', 'Hidden Gems', 'New Openings'] as VibeType[],
        index: true
    },

    openingHours: [OpeningHoursSchema],

    phoneNumber: {
        type: String,
        match: [/^[\d\s\-\+\(\)]+$/, '请提供有效的电话号码']
    },

    // ============================================
    // 评分与评论
    // ============================================
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        set: function(val: number) {
            return Math.round(val * 10) / 10;
        }
    },

    reviewCount: {
        type: Number,
        default: 0,
        min: 0
    },

    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],

    // ============================================
    // AI 智能总结
    // ============================================
    aiSummary: {
        features: {
            type: String,
            maxlength: 200,
            default: ''
        },

        atmosphere: {
            type: String,
            maxlength: 100,
            default: ''
        },

        highlights: [{
            type: String,
            maxlength: 50
        }],

        suitableFor: [{
            type: String,
            maxlength: 50
        }],

        generatedAt: Date,

        needsUpdate: {
            type: Boolean,
            default: true
        },

        version: {
            type: Number,
            default: 0
        }
    },

    // ============================================
    // 向量 Embedding（语义搜索用）
    // ============================================
    embedding: {
        type: [Number],           // 768 维，multilingual-e5-base 输出
        default: [],
        select: false             // 默认查询不返回，按需 .select('+embedding')
    },

    embeddingUpdatedAt: {
        type: Date,
        default: null
    },

    // ============================================
    // 所有权与管理
    // ============================================
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        alias: 'owner'
    },

    // ============================================
    // 状态与元数据
    // ============================================
    isActive: {
        type: Boolean,
        default: true
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    viewCount: {
        type: Number,
        default: 0
    },

    favoriteCount: {
        type: Number,
        default: 0
    },

    tags: [String],

}, opts);

// ============================================
// 索引（性能优化）
// ============================================

// 地理位置索引
CafeSchema.index({ geometry: '2dsphere' });

// 文本搜索索引
CafeSchema.index({
    name: 'text',
    description: 'text',
    city: 'text',
    tags: 'text'
});

// 常用查询索引
CafeSchema.index({ city: 1, rating: -1 });
CafeSchema.index({ author: 1, createdAt: -1 });
CafeSchema.index({ rating: -1, reviewCount: -1 });
CafeSchema.index({ isActive: 1, isVerified: 1 });
CafeSchema.index({ 'aiSummary.needsUpdate': 1 });

// Embedding 状态索引（用于 backfill 脚本和候选过滤）
CafeSchema.index({ embeddingUpdatedAt: 1, isActive: 1 });

// ============================================
// 虚拟属性
// ============================================

CafeSchema.virtual('properties.popUpMarkup').get(function (this: any) {
    const stars = '⭐'.repeat(Math.round(this.rating || 0));
    const desc = this.description || '';
    return `
        <div class="map-popup">
            <strong><a href="/cafes/${this._id}">${this.name}</a></strong>
            <p>${stars} ${(this.rating || 0).toFixed(1)} (${this.reviewCount || 0} 条评论)</p>
            <p>${desc.substring(0, 50)}${desc.length > 50 ? '...' : ''}</p>
        </div>
    `;
});

CafeSchema.virtual('priceDisplay').get(function (this: any) {
    return '$'.repeat(this.price);
});

CafeSchema.virtual('ratingCategory').get(function (this: any) {
    if (this.rating >= 4.5) return 'Excellent';
    if (this.rating >= 4.0) return 'Very Good';
    if (this.rating >= 3.5) return 'Good';
    if (this.rating >= 3.0) return 'Average';
    return 'Below Average';
});

CafeSchema.virtual('isOpen').get(function (this: any) {
    if (!this.openingHours || this.openingHours.length === 0) return null;

    const now = new Date();
    const dayNames: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const todayHours = this.openingHours.find((h: { day: DayKey }) => h.day === today);
    if (!todayHours || todayHours.closed) return false;

    return currentTime >= todayHours.open && currentTime <= todayHours.close;
});

// ============================================
// 实例方法
// ============================================

/**
 * 计算并更新平均评分
 */
CafeSchema.methods.calculateAverageRating = async function() {
    const ReviewModel = mongoose.model('Review');
    const stats = await ReviewModel.aggregate([
        { $match: { cafe: this._id } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        this.rating = Math.round(stats[0].averageRating * 10) / 10;
        this.reviewCount = stats[0].reviewCount;
    } else {
        this.rating = 0;
        this.reviewCount = 0;
    }

    await this.save();
};

/**
 * 增加浏览次数
 */
CafeSchema.methods.incrementViewCount = async function() {
    this.viewCount += 1;
    await this.save({ validateBeforeSave: false });
};

/**
 * 生成或更新 AI 特色总结
 */
CafeSchema.methods.generateAISummary = async function() {
    try {
        const ReviewModel = mongoose.model('Review');
        // aiService imported at top of file

        // 获取最近20条评论
        const reviews = await ReviewModel.find({ cafe: this._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('content rating');

        console.log(`📝 为咖啡店 "${this.name}" 生成AI总结 (基于 ${reviews.length} 条评论)`);

        // 调用 AI 服务生成总结
        const summary = await aiService.generateCafeSummary(this, reviews) as any;

        // 更新 AI 总结
        this.aiSummary = {
            features: summary.features,
            atmosphere: summary.atmosphere,
            highlights: summary.highlights || [],
            suitableFor: summary.suitableFor || [],
            generatedAt: Date.now(),
            needsUpdate: false,
            version: (this.aiSummary?.version || 0) + 1
        };

        await this.save({ validateBeforeSave: false });

        console.log(`✅ AI总结已生成 (版本 ${this.aiSummary.version})`);

        return this.aiSummary;

    } catch (error) {
        console.error(`❌ 生成AI总结失败 (${this.name}):`, (error as Error).message);
        throw error;
    }
};

/**
 * 标记 AI 总结需要更新
 */
CafeSchema.methods.markSummaryNeedsUpdate = async function() {
    if (this.aiSummary) {
        this.aiSummary.needsUpdate = true;
        await this.save({ validateBeforeSave: false });
    }
};

/**
 * 检查 AI 总结是否过期
 */
CafeSchema.methods.isSummaryOutdated = function(daysOld = 30) {
    if (!this.aiSummary || !this.aiSummary.generatedAt) {
        return true;
    }

    const daysSinceUpdate = (Date.now() - new Date(this.aiSummary.generatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > daysOld;
};

// ============================================
// 静态方法
// ============================================

/**
 * 查找附近的咖啡馆
 */
CafeSchema.statics.findNearby = function(longitude: number, latitude: number, maxDistance = 5000, limit = 20) {
    return this.find({
        geometry: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        },
        isActive: true
    })
    .limit(limit)
    .populate('author', 'username avatar')
    .select('-reviews');
};

/**
 * 获取高分咖啡馆
 */
CafeSchema.statics.getTopRated = function(limit = 10, city: string | null = null) {
    const query: Record<string, unknown> = { isActive: true, reviewCount: { $gte: 5 } };
    if (city) query.city = new RegExp(city, 'i');

    return this.find(query)
        .sort({ rating: -1, reviewCount: -1 })
        .limit(limit)
        .populate('author', 'username avatar');
};

/**
 * 文本搜索咖啡馆
 */
CafeSchema.statics.searchCafes = function(searchTerm: string, options: {
    city?: string;
    minRating?: number;
    maxPrice?: number;
    amenities?: AmenityKey[];
} = {}) {
    const query: Record<string, unknown> = {
        $text: { $search: searchTerm },
        isActive: true
    };

    if (options.city) query.city = new RegExp(options.city, 'i');
    if (options.minRating) query.rating = { $gte: options.minRating };
    if (options.maxPrice) query.price = { $lte: options.maxPrice };
    if (options.amenities && options.amenities.length > 0) {
        query.amenities = { $all: options.amenities };
    }

    return this.find(query)
        .sort({ score: { $meta: 'textScore' }, rating: -1 })
        .populate('author', 'username avatar');
};

/**
 * 根据设施查找
 */
CafeSchema.statics.findByAmenities = function(amenities: AmenityKey[], city: string | null = null) {
    const query: Record<string, unknown> = {
        amenities: { $all: amenities },
        isActive: true
    };

    if (city) query.city = new RegExp(city, 'i');

    return this.find(query)
        .sort({ rating: -1 })
        .populate('author', 'username avatar');
};

/**
 * 批量更新过期的 AI 总结
 */
CafeSchema.statics.updateOutdatedSummaries = async function(limit = 10) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const cafes = await this.find({
        $or: [
            { 'aiSummary.needsUpdate': true },
            { 'aiSummary.generatedAt': { $lt: thirtyDaysAgo } },
            { 'aiSummary.generatedAt': { $exists: false } }
        ],
        isActive: true,
        reviewCount: { $gte: 3 }
    })
    .limit(limit);

    console.log(`🔄 找到 ${cafes.length} 个需要更新AI总结的咖啡店`);

    const results: Array<{ cafe: string; success: boolean; error?: string }> = [];
    for (const cafe of cafes) {
        try {
            await (cafe as unknown as { generateAISummary(): Promise<void> }).generateAISummary();
            results.push({ cafe: cafe.name, success: true });
        } catch (error) {
            results.push({ cafe: cafe.name, success: false, error: (error as Error).message });
        }
    }

    return results;
};

// ============================================
// 中间件
// ============================================

// 保存前：验证坐标
CafeSchema.pre('save', function(this: any, next) {
    if (this.isModified('geometry.coordinates')) {
        const [lng, lat] = this.geometry.coordinates;
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return next(new Error('无效的坐标：经度必须在-180到180之间，纬度必须在-90到90之间'));
        }
    }
    next();
});

// 保存前：城市名称格式化
CafeSchema.pre('save', function(this: any, next) {
    if (this.isModified('city')) {
        this.city = this.city
            .toLowerCase()
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    next();
});

// 删除后：级联删除评论
CafeSchema.post('findOneAndDelete', async function (doc: any) {
    if (doc && doc.reviews && doc.reviews.length > 0) {
        await Review.deleteMany({
            _id: { $in: doc.reviews }
        });
        console.log(`🗑️ 已删除 ${doc.reviews.length} 条与咖啡店 "${doc.name}" 相关的评论`);
    }
});

CafeSchema.post('deleteOne', { document: true, query: false }, async function (doc: any) {
    if (doc && doc.reviews && doc.reviews.length > 0) {
        await Review.deleteMany({
            _id: { $in: doc.reviews }
        });
    }
});

// ============================================
// 导出模型
// ============================================
export default model<ICafe>('Cafe', CafeSchema)
