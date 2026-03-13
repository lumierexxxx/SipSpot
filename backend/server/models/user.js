// ============================================
// SipSpot - User Model (扩展版 - 添加AI偏好学习)
// 从 Passport-local-mongoose 迁移到 JWT + bcrypt
// 新增: 用户偏好学习系统，支持AI个性化推荐
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    // ============================================
    // 基础信息
    // ============================================
    username: {
        type: String,
        required: [true, '请提供用户名'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, '用户名至少3个字符'],
        maxlength: [30, '用户名最多30个字符'],
        match: [/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线']
    },
    
    email: {
        type: String,
        required: [true, '请提供邮箱'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            '请提供有效的邮箱地址'
        ]
    },
    
    password: {
        type: String,
        required: [true, '请提供密码'],
        minlength: [6, '密码至少6个字符'],
        select: false // 默认查询时不返回密码字段
    },
    
    // ============================================
    // 个人资料
    // ============================================
    avatar: {
        type: String,
        default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    },
    
    bio: {
        type: String,
        maxlength: [500, '个人简介最多500个字符']
    },
    
    // ============================================
    // 角色和权限
    // ============================================
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    
    // ============================================
    // 用户偏好和数据
    // ============================================
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cafe'
    }],
    
    // 用户访问过的咖啡店
    visited: [{
        cafe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cafe'
        },
        visitedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // ============================================
    // 🆕 AI偏好学习系统
    // ============================================
    preferences: {
        // 🤖 AI自动学习的偏好（基于用户行为）
        learned: {
            // 偏好的设施（带权重）
            favoriteAmenities: [{
                amenity: {
                    type: String,
                    enum: [
                        'WiFi', '电源插座', '安静环境', '户外座位',
                        '宠物友好', '禁烟', '空调',
                        '提供停车位', '无障碍通行（轮椅可进入）',
                        '适合使用笔记本电脑', '适合团体聚会', '适合工作 / 办公'
                    ]
                },
                weight: {
                    type: Number,
                    min: 0,
                    max: 1,
                    default: 0.5
                }
            }],
            
            // 偏好的咖啡特色
            favoriteSpecialties: [{
                type: String,
                enum: ['意式浓缩 Espresso', '手冲咖啡 Pour Over', '冷萃咖啡 Cold Brew', '拉花咖啡 Latte Art',
                       '精品咖啡豆 Specialty Beans', '甜点 Desserts', '轻食 Light Meals']
            }],
            
            // 偏好的价格范围
            priceRange: {
                min: {
                    type: Number,
                    min: 1,
                    max: 4,
                    default: 1
                },
                max: {
                    type: Number,
                    min: 1,
                    max: 4,
                    default: 4
                }
            },
            
            // 偏好的氛围类型
            atmospherePreferences: [{
                type: String,
                maxlength: 50
            }]
        },
        
        // 👤 用户手动设置的偏好
        manual: {
            // 饮食限制
            dietaryRestrictions: [{
                type: String,
                maxlength: 50
            }],
            
            // 必须有的设施
            mustHaveAmenities: [{
                type: String,
                enum: [
                    'WiFi', '电源插座', '安静环境', '户外座位',
                    '宠物友好', '禁烟', '空调',
                    '提供停车位', '无障碍通行（轮椅可进入）',
                    '适合使用笔记本电脑', '适合团体聚会', '适合工作 / 办公'
                ]
            }],
            
            // 避免的设施
            avoidAmenities: [{
                type: String,
                maxlength: 50
            }],
            
            // 偏好的城市
            preferredCities: [{
                type: String,
                maxlength: 100
            }]
        },
        
        // 偏好最后更新时间
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        
        // 偏好学习的置信度（基于数据量）
        confidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 0
        }
    },

    // ============================================
    // 用户偏好向量（个性化推荐用）
    // ============================================
    preferenceEmbedding: {
        type: [Number],           // 1024 维，L2 归一化后的加权平均
        default: [],
        select: false
    },

    preferenceEmbeddingUpdatedAt: {
        type: Date,
        default: null
    },

    // 滑动窗口：最多保留 100 条，每次写入用 $slice 控制
    // computeUserEmbedding 只取最近 30 条参与计算
    preferenceHistory: {
        type: [{
            cafeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Cafe'
            },
            weight: Number,       // 收藏=2, 高分评论=1
            addedAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: [],
        select: false
    },

    // ============================================
    // 账户状态
    // ============================================
    isActive: {
        type: Boolean,
        default: true
    },
    
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    // ============================================
    // 密码重置
    // ============================================
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    // ============================================
    // 邮箱验证
    // ============================================
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    
    // ============================================
    // 时间戳
    // ============================================
    lastLogin: {
        type: Date
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// 索引
// ============================================
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'visited.cafe': 1 });
userSchema.index({ favorites: 1 });
userSchema.index({ 'preferences.lastUpdated': 1 });

// ============================================
// 虚拟属性
// ============================================

// 用户创建的咖啡店数量
userSchema.virtual('cafeCount', {
    ref: 'Cafe',
    localField: '_id',
    foreignField: 'owner',
    count: true
});

// 用户的评论数量
userSchema.virtual('reviewCount', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'author',
    count: true
});

// ============================================
// 中间件：密码加密
// ============================================

// 保存前加密密码
userSchema.pre('save', async function(next) {
    // 如果密码没有被修改，跳过加密
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // 生成salt并加密密码
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 更新 lastLogin 时间
userSchema.pre('save', function(next) {
    if (this.isNew) {
        this.lastLogin = Date.now();
    }
    next();
});

// ============================================
// 实例方法
// ============================================

/**
 * 比对密码
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('密码比对失败');
    }
};

/**
 * 生成JWT Token
 */
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            id: this._id,
            role: this.role,
            username: this.username
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * 生成刷新Token
 */
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
};

/**
 * 生成密码重置Token
 */
userSchema.methods.getResetPasswordToken = function() {
    const resetToken = require('crypto').randomBytes(20).toString('hex');
    
    this.resetPasswordToken = require('crypto')
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    return resetToken;
};

/**
 * 生成邮箱验证Token
 */
userSchema.methods.getEmailVerificationToken = function() {
    const verificationToken = require('crypto').randomBytes(20).toString('hex');
    
    this.emailVerificationToken = require('crypto')
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    
    return verificationToken;
};

/**
 * 添加咖啡店到收藏
 */
userSchema.methods.addFavorite = async function(cafeId) {
    if (!this.favorites.includes(cafeId)) {
        this.favorites.push(cafeId);
        await this.save();
        
        // 🆕 触发偏好学习
        this.learnFromBehavior();
    }
};

/**
 * 从收藏中移除咖啡店
 */
userSchema.methods.removeFavorite = async function(cafeId) {
    this.favorites = this.favorites.filter(
        id => id.toString() !== cafeId.toString()
    );
    await this.save();
};

/**
 * 检查是否收藏了某个咖啡店
 */
userSchema.methods.hasFavorite = function(cafeId) {
    return this.favorites.some(id => id.toString() === cafeId.toString());
};

/**
 * 记录访问咖啡店
 */
userSchema.methods.visitCafe = async function(cafeId) {
    const existingVisit = this.visited.find(
        v => v.cafe.toString() === cafeId.toString()
    );
    
    if (existingVisit) {
        existingVisit.visitedAt = Date.now();
    } else {
        this.visited.push({ cafe: cafeId, visitedAt: Date.now() });
    }
    
    await this.save();
};

/**
 * 获取公开的用户信息（不包含敏感数据）
 */
userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        username: this.username,
        avatar: this.avatar,
        bio: this.bio,
        role: this.role,
        createdAt: this.createdAt
    };
};

// ============================================
// 🆕 AI偏好学习相关方法
// ============================================

/**
 * 手动更新用户偏好
 * @param {Object} newPreferences - 新的偏好设置
 */
userSchema.methods.updatePreferences = async function(newPreferences) {
    // 合并手动设置的偏好
    if (newPreferences.manual) {
        this.preferences.manual = {
            ...this.preferences.manual,
            ...newPreferences.manual
        };
    }
    
    // 更新时间戳
    this.preferences.lastUpdated = Date.now();
    
    await this.save();
    return this.preferences;
};

/**
 * 🤖 从用户行为中学习偏好（AI核心功能）
 * 分析用户的收藏、评论、访问记录，自动更新偏好
 */
userSchema.methods.learnFromBehavior = async function() {
    try {
        const Review = mongoose.model('Review');
        const Cafe = mongoose.model('Cafe');
        
        // 1️⃣ 获取用户最近的高评分评论（4星及以上）
        const recentReviews = await Review.find({ 
            author: this._id,
            rating: { $gte: 4 }
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('cafe');
        
        // 2️⃣ 获取用户收藏的咖啡店
        const favoriteCafes = await Cafe.find({
            _id: { $in: this.favorites }
        });
        
        // 3️⃣ 统计设施出现频率
        const amenityFrequency = {};
        const specialtyFrequency = {};
        const priceValues = [];
        
        // 从高评分评论中提取
        recentReviews.forEach(review => {
            if (review.cafe) {
                // 统计设施
                review.cafe.amenities?.forEach(amenity => {
                    amenityFrequency[amenity] = (amenityFrequency[amenity] || 0) + 1;
                });
                
                // 统计特色
                if (review.cafe.specialty) {
                    specialtyFrequency[review.cafe.specialty] = 
                        (specialtyFrequency[review.cafe.specialty] || 0) + 1;
                }
                
                // 统计价格
                if (review.cafe.price) {
                    priceValues.push(review.cafe.price);
                }
            }
        });
        
        // 从收藏中提取（权重加倍）
        favoriteCafes.forEach(cafe => {
            cafe.amenities?.forEach(amenity => {
                amenityFrequency[amenity] = (amenityFrequency[amenity] || 0) + 2;
            });
            
            if (cafe.specialty) {
                specialtyFrequency[cafe.specialty] = 
                    (specialtyFrequency[cafe.specialty] || 0) + 2;
            }
            
            if (cafe.price) {
                priceValues.push(cafe.price);
                priceValues.push(cafe.price); // 权重加倍
            }
        });
        
        // 4️⃣ 计算总交互次数
        const totalInteractions = recentReviews.length + favoriteCafes.length;
        
        // 5️⃣ 计算设施偏好权重（出现频率 >= 20%的设施）
        const learnedAmenities = Object.entries(amenityFrequency)
            .map(([amenity, count]) => ({
                amenity: amenity,
                weight: Math.min(1, count / totalInteractions)
            }))
            .filter(item => item.weight >= 0.2)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 8); // 最多保留8个
        
        // 6️⃣ 提取特色偏好
        const learnedSpecialties = Object.entries(specialtyFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(([specialty]) => specialty)
            .slice(0, 3);
        
        // 7️⃣ 计算价格范围偏好
        let learnedPriceRange = { min: 1, max: 4 };
        if (priceValues.length > 0) {
            const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
            learnedPriceRange = {
                min: Math.max(1, Math.floor(avgPrice - 0.5)),
                max: Math.min(4, Math.ceil(avgPrice + 0.5))
            };
        }
        
        // 8️⃣ 更新学习到的偏好
        this.preferences.learned = {
            favoriteAmenities: learnedAmenities,
            favoriteSpecialties: learnedSpecialties,
            priceRange: learnedPriceRange,
            atmospherePreferences: this.preferences.learned?.atmospherePreferences || []
        };
        
        // 9️⃣ 更新置信度（基于数据量）
        this.preferences.confidence = Math.min(1, totalInteractions / 10);
        this.preferences.lastUpdated = Date.now();
        
        await this.save({ validateBeforeSave: false });
        
        console.log(`✅ 用户 ${this.username} 的偏好已更新 (置信度: ${this.preferences.confidence.toFixed(2)})`);
        
        return this.preferences;
        
    } catch (error) {
        console.error('学习用户偏好失败:', error.message);
        return null;
    }
};

/**
 * 获取用户偏好概况
 */
userSchema.methods.getPreferencesSummary = function() {
    const learned = this.preferences.learned || {};
    const manual = this.preferences.manual || {};
    
    return {
        // 学习到的偏好
        topAmenities: learned.favoriteAmenities
            ?.slice(0, 3)
            .map(a => a.amenity) || [],
        
        favoriteSpecialties: learned.favoriteSpecialties || [],
        
        priceRange: learned.priceRange || { min: 1, max: 4 },
        
        // 手动设置
        mustHave: manual.mustHaveAmenities || [],
        avoid: manual.avoidAmenities || [],
        
        // 元数据
        confidence: this.preferences.confidence || 0,
        lastUpdated: this.preferences.lastUpdated
    };
};

// ============================================
// 静态方法
// ============================================

/**
 * 通过邮箱或用户名查找用户
 */
userSchema.statics.findByEmailOrUsername = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() }
        ]
    }).select('+password');
};

/**
 * 验证重置Token
 */
userSchema.statics.findByResetToken = function(token) {
    const hashedToken = require('crypto')
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    return this.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
    });
};

/**
 * 验证邮箱验证Token
 */
userSchema.statics.findByVerificationToken = function(token) {
    const hashedToken = require('crypto')
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    return this.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpire: { $gt: Date.now() }
    });
};

// ============================================
// 导出模型
// ============================================
module.exports = mongoose.model('User', userSchema);