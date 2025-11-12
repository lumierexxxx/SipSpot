// ============================================
// SipSpot - User Model (改造自YelpCamp)
// 从 Passport-local-mongoose 迁移到 JWT + bcrypt
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
 * @param {String} candidatePassword - 用户输入的密码
 * @returns {Promise<Boolean>} - 密码是否匹配
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
 * @returns {String} - JWT token
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
 * @returns {String} - Refresh token
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
 * @returns {String} - Reset token
 */
userSchema.methods.getResetPasswordToken = function() {
    // 生成随机token
    const resetToken = require('crypto').randomBytes(20).toString('hex');
    
    // 哈希token并保存
    this.resetPasswordToken = require('crypto')
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // 设置过期时间（10分钟）
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    return resetToken;
};

/**
 * 生成邮箱验证Token
 * @returns {String} - Verification token
 */
userSchema.methods.getEmailVerificationToken = function() {
    const verificationToken = require('crypto').randomBytes(20).toString('hex');
    
    this.emailVerificationToken = require('crypto')
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    
    // 设置过期时间（24小时）
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    
    return verificationToken;
};

/**
 * 添加咖啡店到收藏
 * @param {ObjectId} cafeId - 咖啡店ID
 */
userSchema.methods.addFavorite = async function(cafeId) {
    if (!this.favorites.includes(cafeId)) {
        this.favorites.push(cafeId);
        await this.save();
    }
};

/**
 * 从收藏中移除咖啡店
 * @param {ObjectId} cafeId - 咖啡店ID
 */
userSchema.methods.removeFavorite = async function(cafeId) {
    this.favorites = this.favorites.filter(
        id => id.toString() !== cafeId.toString()
    );
    await this.save();
};

/**
 * 检查是否收藏了某个咖啡店
 * @param {ObjectId} cafeId - 咖啡店ID
 * @returns {Boolean}
 */
userSchema.methods.hasFavorite = function(cafeId) {
    return this.favorites.some(id => id.toString() === cafeId.toString());
};

/**
 * 记录访问咖啡店
 * @param {ObjectId} cafeId - 咖啡店ID
 */
userSchema.methods.visitCafe = async function(cafeId) {
    // 检查是否已经访问过
    const existingVisit = this.visited.find(
        v => v.cafe.toString() === cafeId.toString()
    );
    
    if (existingVisit) {
        // 更新访问时间
        existingVisit.visitedAt = Date.now();
    } else {
        // 添加新访问记录
        this.visited.push({ cafe: cafeId, visitedAt: Date.now() });
    }
    
    await this.save();
};

/**
 * 获取公开的用户信息（不包含敏感数据）
 * @returns {Object}
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
// 静态方法
// ============================================

/**
 * 通过邮箱或用户名查找用户
 * @param {String} identifier - 邮箱或用户名
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmailOrUsername = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() }
        ]
    }).select('+password'); // 包含密码字段用于验证
};

/**
 * 验证重置Token
 * @param {String} token - Reset token
 * @returns {Promise<User>}
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
 * @param {String} token - Verification token
 * @returns {Promise<User>}
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

userSchema.index({ 'visited.cafe': 1 });
userSchema.index({ favorites: 1 });

// ============================================
// 导出模型
// ============================================
module.exports = mongoose.model('User', userSchema);