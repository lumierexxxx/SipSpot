// ============================================
// SipSpot Backend - 主服务器文件
// 从 YelpCamp 改造为现代化前后端分离架构
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
const ExpressError = require('./utils/ExpressError');
const cookieParser = require('cookie-parser');

// ============================================
// 路由导入
// ============================================
const authRoutes = require('./routes/auth');
const cafeRoutes = require('./routes/cafes');
const userRoutes = require('./routes/users');
const standalone = require('./routes/reviewsStandalone'); // Standalone review routes
// ============================================
// 数据库连接
// ============================================
const dbUrl = process.env.MONGODB_URI || process.env.DB_URL || 'mongodb://localhost:27017/sip-spot';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB连接成功');
    console.log(`📍 数据库: ${dbUrl.includes('localhost') ? '本地MongoDB' : 'MongoDB Atlas'}`);
})
.catch(err => {
    console.error('❌ MongoDB连接失败:', err.message);
    process.exit(1);
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB连接错误:"));

// ============================================
// Express应用初始化
// ============================================
const app = express();

// ============================================
// 安全中间件
// ============================================

// CORS配置 - 允许前端跨域请求
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Helmet - 设置安全HTTP头
app.use(helmet({
    contentSecurityPolicy: false, // 前后端分离，由前端处理CSP
    crossOriginEmbedderPolicy: false
}));

// MongoDB注入防护
app.use(mongoSanitize({
    replaceWith: '_'
}));

// API限流 - 防止暴力攻击
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制100个请求
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 登录端点的严格限流
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5, // 15分钟内最多5次登录尝试
    message: {
        success: false,
        message: '登录尝试次数过多，请1分钟后再试'
    }
});

// ============================================
// 基础中间件
// ============================================
app.use(express.json({ limit: '10mb' })); // JSON解析，限制10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// 请求日志中间件（开发环境）
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
        documentation: '/api/docs',
        endpoints: {
            auth: '/api/auth',
            cafes: '/api/cafes',
            users: '/api/users',
            reviews: '/api/reviews',
            nestedReviews: '/api/cafes/:cafeId/reviews'
        }
    });
});

// 认证路由（应用严格限流）
app.use('/api/auth', authLimiter, authRoutes);

// 咖啡店路由
app.use('/api/cafes', limiter, cafeRoutes);

// 用户路由
app.use('/api/users', limiter, userRoutes);

// 独立评论路由（用于单个评论的操作：获取、更新、删除、投票等）
app.use('/api/reviews', limiter, standalone);

// ============================================
// Note: 嵌套评论路由已在 cafes 路由中配置
// 在 routes/cafes.js 中使用：
// const reviewRoutes = require('./reviews');
// router.use('/:cafeId/reviews', reviewRoutes);
// 这样就可以访问 /api/cafes/:cafeId/reviews
// ============================================
app.use(cookieParser());

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
    
    // 开发环境下输出详细错误
    if (process.env.NODE_ENV !== 'production') {
        console.error('❌ 错误:', err);
    }
    
    // MongoDB验证错误
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: '数据验证失败',
            errors: messages
        });
    }
    
    // MongoDB重复键错误
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} 已存在`
        });
    }
    
    // JWT错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token无效'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token已过期，请重新登录'
        });
    }
    
    // 统一错误响应格式
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { 
            stack: err.stack,
            error: err 
        })
    });
});

// ============================================
// 启动服务器
// ============================================
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log(`🚀 SipSpot服务器启动成功！`);
    console.log(`🚀 端口: ${PORT}`);
    console.log(`🚀 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 前端地址: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log('🚀 ========================================');
});

// ============================================
// 优雅关闭
// ============================================
process.on('SIGTERM', () => {
    console.log('👋 收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB连接已关闭');
            process.exit(0);
        });
    });
});

process.on('unhandledRejection', (err) => {
    console.error('❌ 未处理的Promise拒绝:', err);
    server.close(() => {
        process.exit(1);
    });
});

module.exports = app;