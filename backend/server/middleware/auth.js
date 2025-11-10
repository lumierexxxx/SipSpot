// ============================================
// SipSpot - JWT认证中间件
// 替代Passport认证系统
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ExpressError = require('../utils/ExpressError');

/**
 * 验证JWT Token中间件
 * 保护需要认证的路由
 */
exports.protect = async (req, res, next) => {
    try {
        let token;
        
        // 从请求头获取token
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        // 检查token是否存在
        if (!token) {
            return next(new ExpressError('请先登录', 401));
        }
        
        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 查找用户
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return next(new ExpressError('用户不存在', 401));
        }
        
        // 检查用户是否被禁用
        if (!user.isActive) {
            return next(new ExpressError('账户已被禁用', 403));
        }
        
        // 将用户信息添加到请求对象
        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new ExpressError('Token无效', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new ExpressError('Token已过期，请重新登录', 401));
        }
        return next(new ExpressError('认证失败', 401));
    }
};

/**
 * 可选认证中间件
 * 如果有token则验证，没有token也允许通过
 */
exports.optionalAuth = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (user && user.isActive) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // 忽略错误，继续执行
        next();
    }
};

/**
 * 验证管理员权限
 * 必须在 protect 中间件之后使用
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ExpressError('请先登录', 401));
        }
        
        if (!roles.includes(req.user.role)) {
            return next(new ExpressError('无权访问此资源', 403));
        }
        
        next();
    };
};

/**
 * 验证资源所有权
 * 检查用户是否是资源的创建者或管理员
 */
exports.checkOwnership = (Model, paramName = 'id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[paramName];
            const resource = await Model.findById(resourceId);
            
            if (!resource) {
                return next(new ExpressError('资源不存在', 404));
            }
            
            // 管理员可以访问所有资源
            if (req.user.role === 'admin') {
                req.resource = resource;
                return next();
            }
            
            // 检查是否是资源所有者
            const ownerId = resource.owner || resource.author || resource.user;
            
            if (!ownerId) {
                return next(new ExpressError('无法确定资源所有者', 500));
            }
            
            if (ownerId.toString() !== req.user.id) {
                return next(new ExpressError('无权修改此资源', 403));
            }
            
            req.resource = resource;
            next();
            
        } catch (error) {
            return next(new ExpressError('验证资源所有权失败', 500));
        }
    };
};

/**
 * 验证邮箱是否已验证
 */
exports.requireEmailVerified = (req, res, next) => {
    if (!req.user) {
        return next(new ExpressError('请先登录', 401));
    }
    
    if (!req.user.isEmailVerified) {
        return next(new ExpressError('请先验证邮箱', 403));
    }
    
    next();
};

/**
 * 限制未认证用户的访问
 * 可以设置每日访问次数限制
 */
exports.guestLimit = (maxRequests = 10) => {
    const guestRequests = new Map();
    
    return (req, res, next) => {
        // 已登录用户直接通过
        if (req.user) {
            return next();
        }
        
        const ip = req.ip || req.connection.remoteAddress;
        const today = new Date().toDateString();
        const key = `${ip}-${today}`;
        
        const count = guestRequests.get(key) || 0;
        
        if (count >= maxRequests) {
            return next(new ExpressError('今日访问次数已达上限，请登录以继续使用', 429));
        }
        
        guestRequests.set(key, count + 1);
        
        // 每天清理一次缓存
        if (count === 0) {
            setTimeout(() => {
                guestRequests.delete(key);
            }, 24 * 60 * 60 * 1000);
        }
        
        next();
    };
};