// ============================================
// SipSpot Backend - 主服务器文件
// ============================================

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const ExpressError = require('./utils/ExpressError');
const embeddingService = require('./services/embeddingService');

// ============================================
// 路由导入
// ============================================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cafeRoutes = require('./routes/cafes');
const reviewStandaloneRoutes = require('./routes/reviewsStandalone');
const recommendationRoutes = require('./routes/recommendations');


// ============================================
// Express应用初始化
// ============================================
const app = express();

// ============================================
// 安全中间件
// ============================================
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(mongoSanitize({ replaceWith: '_' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: '请求过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: { success: false, message: '登录尝试次数过多，请1分钟后再试' }
});

// ============================================
// 基础中间件
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// 请求日志（开发环境）
// ============================================
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// API路由
// ============================================

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API根路径
app.get('/api', (req, res) => {
    res.json({
        message: 'SipSpot API v1.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            cafes: '/api/cafes',
            reviews: '/api/reviews',
            recommendations: '/api/recommendations',
            nestedReviews: '/api/cafes/:cafeId/reviews'
        }
    });
});

// 认证路由（严格限流）
app.use('/api/auth', authLimiter, authRoutes);

// 用户路由（资料 + 收藏 + 访问记录 + 我的内容）
app.use('/api/users', limiter, userRoutes);

// 咖啡店路由
app.use('/api/cafes', limiter, cafeRoutes);

// 独立评论路由
app.use('/api/reviews', limiter, reviewStandaloneRoutes);

// 推荐系统路由
app.use('/api/recommendations', limiter, recommendationRoutes);

// ============================================
// 404处理
// ============================================
app.all('*', (req, res, next) => {
    next(new ExpressError('API端点不存在', 404));
});

// ============================================
// 全局错误处理中间件
// ============================================
app.use((err, req, res, next) => {
    const { statusCode = 500, message = '服务器内部错误' } = err;

    if (process.env.NODE_ENV !== 'production') {
        console.error('❌ 错误:', err);
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ success: false, message: '数据验证失败', errors: messages });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({ success: false, message: `${field} 已存在` });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Token无效' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token已过期，请重新登录' });
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack, error: err })
    });
});

// ============================================
// 启动服务器
// ============================================
const PORT = process.env.PORT || 5001;
let server;

async function startServer() {
    // 1. 连接数据库
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/sip-spot';
    try {
        await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB连接成功');
        console.log(`📍 数据库: ${dbUrl.includes('localhost') ? '本地MongoDB' : 'MongoDB Atlas'}`);
    } catch (err) {
        console.error('❌ MongoDB连接失败:', err.message);
        process.exit(1);
    }

    // 2. 预热 embedding 模型（失败不阻塞启动）
    try {
        await embeddingService.init();
    } catch (err) {
        console.warn('⚠️  Embedding 模型加载失败，语义搜索已禁用:', err.message);
        // isReady() 返回 false，所有调用方自动降级到关键字搜索
    }

    // 3. 启动 HTTP 服务器
    server = app.listen(PORT, () => {
        console.log('🚀 ========================================');
        console.log(`🚀 SipSpot服务器启动成功！`);
        console.log(`🚀 端口: ${PORT}`);
        console.log(`🚀 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🚀 前端地址: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
        console.log(`🚀 语义搜索: ${embeddingService.isReady() ? '✅ 已启用' : '⚠️  已禁用（降级模式）'}`);
        console.log('🚀 ========================================');
    });
}

startServer();

// ============================================
// 优雅关闭
// ============================================
process.on('SIGTERM', () => {
    console.log('👋 收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('✅ 服务器已关闭');
            process.exit(0);
        });
    });
});

process.on('unhandledRejection', (err) => {
    console.error('❌ 未处理的Promise拒绝:', err);
    server.close(() => process.exit(1));
});

module.exports = app;