// ============================================
// SipSpot - JWT 认证中间件
// 验证JWT token，保护需要认证的路由
// ============================================

import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/user'
import ExpressError from '../utils/ExpressError'
import asyncHandler from '../utils/asyncHandler'
import { AuthRequest } from '../types'

/**
 * 保护路由中间件 - 必须登录
 * 验证JWT token并将用户信息附加到req.user
 */
export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    // 从Authorization header获取token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // 也可以从cookie获取（如果使用cookie存储）
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // 检查token是否存在
    if (!token) {
        return next(new ExpressError('请先登录以访问此资源', 401));
    }

    try {
        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }

        // 获取用户信息（不包含密码）
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return next(new ExpressError('用户不存在', 401));
        }

        // 检查用户账户是否被禁用
        if (!req.user.isActive) {
            return next(new ExpressError('账户已被禁用', 403));
        }

        next();

    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            return next(new ExpressError('Token无效，请重新登录', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new ExpressError('Token已过期，请重新登录', 401));
        }
        throw error;
    }
});

/**
 * 可选认证中间件
 * 如果有token则验证并附加用户信息，没有token也允许继续
 * 用于某些公开但可以根据登录状态显示不同内容的路由
 */
export const optionalAuth = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // 如果没有token，直接继续
    if (!token) {
        return next();
    }

    try {
        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }

        // 获取用户信息
        req.user = await User.findById(decoded.id).select('-password');

        // 即使用户不存在也继续（作为未登录用户）
        if (req.user && !req.user.isActive) {
            req.user = null; // 禁用的账户视为未登录
        }

    } catch (error) {
        // Token无效或过期，作为未登录用户继续
        req.user = null;
    }

    next();
});

/**
 * 授权中间件 - 检查用户角色
 * @param {...string} roles - 允许的角色列表
 */
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new ExpressError('请先登录', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ExpressError('您没有权限访问此资源', 403));
        }

        next();
    };
};

/**
 * 检查是否是资源所有者或管理员
 * @param {string} resourceField - 资源中owner字段的路径，如 'author' 或 'cafe.author'
 */
export const checkOwnership = (resourceField: string = 'author') => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new ExpressError('请先登录', 401));
        }

        // 管理员可以访问任何资源
        if (req.user.role === 'admin') {
            return next();
        }

        // 获取资源的owner ID
        let ownerId: any;

        if (resourceField.includes('.')) {
            // 处理嵌套字段，如 'cafe.author'
            const fields = resourceField.split('.');
            let obj: any = req;
            for (const field of fields) {
                obj = obj[field];
                if (!obj) break;
            }
            ownerId = obj;
        } else {
            // 简单字段
            ownerId = (req as any)[resourceField] || req.body[resourceField] || req.params[resourceField];
        }

        if (!ownerId) {
            return next(new ExpressError('无法验证资源所有权', 400));
        }

        // 比较owner ID和当前用户ID
        if (ownerId.toString() !== req.user.id.toString()) {
            return next(new ExpressError('您没有权限修改此资源', 403));
        }

        next();
    };
};

/**
 * 检查邮箱是否已验证
 */
export const requireEmailVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new ExpressError('请先登录', 401));
    }

    if (!req.user.isEmailVerified) {
        return next(new ExpressError('请先验证您的邮箱', 403));
    }

    next();
};

/**
 * API密钥验证（用于服务间通信）
 */
export const verifyApiKey = (req: AuthRequest, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return next(new ExpressError('缺少API密钥', 401));
    }

    if (apiKey !== process.env.API_KEY) {
        return next(new ExpressError('API密钥无效', 401));
    }

    next();
};
