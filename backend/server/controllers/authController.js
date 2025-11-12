// ============================================
// SipSpot - 认证控制器
// 处理用户注册、登录、密码重置等功能
// ============================================

const User = require('../models/user');
const ExpressError = require('../utils/ExpressError.js');

/**
 * @desc    用户注册
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        
        // 验证必填字段
        if (!username || !email || !password) {
            return next(new ExpressError('请提供用户名、邮箱和密码', 400));
        }
        
        // 检查用户是否已存在
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
        });
        
        if (existingUser) {
            const field = existingUser.email === email.toLowerCase() ? '邮箱' : '用户名';
            return next(new ExpressError(`${field}已被使用`, 400));
        }
        
        // 创建用户
        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password
        });
        
        // 生成token
        const token = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        
        // 返回用户信息（不包含密码）
        res.status(201).json({
            success: true,
            message: '注册成功',
            token,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                createdAt: user.createdAt
            }
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    用户登录
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body; // identifier可以是邮箱或用户名
        
        // 验证必填字段
        if (!identifier || !password) {
            return next(new ExpressError('请提供邮箱/用户名和密码', 400));
        }
        
        // 查找用户（包含密码字段）
        const user = await User.findByEmailOrUsername(identifier);
        
        if (!user) {
            return next(new ExpressError('邮箱/用户名或密码错误', 401));
        }
        
        // 检查账户是否被禁用
        if (!user.isActive) {
            return next(new ExpressError('账户已被禁用，请联系管理员', 403));
        }
        
        // 验证密码
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return next(new ExpressError('邮箱/用户名或密码错误', 401));
        }
        
        // 更新最后登录时间
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });
        
        // 生成token
        const token = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        
        res.status(200).json({
            success: true,
            message: '登录成功',
            token,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                lastLogin: user.lastLogin
            }
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    获取当前用户信息
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('favorites', 'name images rating location')
            .populate({
                path: 'visited.cafe',
                select: 'name images rating location'
            });
        
        if (!user) {
            return next(new ExpressError('用户不存在', 404));
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    更新用户资料
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const allowedUpdates = ['username', 'email', 'avatar', 'bio'];
        const updates = {};
        
        // 只允许更新特定字段
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });
        
        // 如果更新用户名或邮箱，检查是否已存在
        if (updates.username || updates.email) {
            const query = { _id: { $ne: req.user.id } };
            
            if (updates.username) {
                query.username = updates.username.toLowerCase();
            }
            if (updates.email) {
                query.email = updates.email.toLowerCase();
            }
            
            const existingUser = await User.findOne(query);
            if (existingUser) {
                const field = existingUser.username === updates.username ? '用户名' : '邮箱';
                return next(new ExpressError(`${field}已被使用`, 400));
            }
        }
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.status(200).json({
            success: true,
            message: '资料更新成功',
            data: user
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    修改密码
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return next(new ExpressError('请提供当前密码和新密码', 400));
        }
        
        if (newPassword.length < 6) {
            return next(new ExpressError('新密码至少6个字符', 400));
        }
        
        // 获取用户（包含密码）
        const user = await User.findById(req.user.id).select('+password');
        
        // 验证当前密码
        const isMatch = await user.comparePassword(currentPassword);
        
        if (!isMatch) {
            return next(new ExpressError('当前密码错误', 401));
        }
        
        // 更新密码
        user.password = newPassword;
        await user.save();
        
        // 生成新token
        const token = user.generateAuthToken();
        
        res.status(200).json({
            success: true,
            message: '密码修改成功',
            token
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    请求密码重置
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return next(new ExpressError('请提供邮箱地址', 400));
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            // 为了安全，不透露用户是否存在
            return res.status(200).json({
                success: true,
                message: '如果该邮箱存在，重置链接已发送'
            });
        }
        
        // 生成重置token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        
        // 这里应该发送邮件，暂时返回token用于测试
        // TODO: 集成邮件服务
        
        res.status(200).json({
            success: true,
            message: '密码重置邮件已发送',
            // 生产环境中应该删除这一行
            ...(process.env.NODE_ENV !== 'production' && { resetToken })
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    重置密码
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        
        if (!password) {
            return next(new ExpressError('请提供新密码', 400));
        }
        
        if (password.length < 6) {
            return next(new ExpressError('密码至少6个字符', 400));
        }
        
        // 查找用户
        const user = await User.findByResetToken(token);
        
        if (!user) {
            return next(new ExpressError('Token无效或已过期', 400));
        }
        
        // 重置密码
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        
        // 生成新token
        const authToken = user.generateAuthToken();
        
        res.status(200).json({
            success: true,
            message: '密码重置成功',
            token: authToken
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    刷新Token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return next(new ExpressError('请提供刷新Token', 400));
        }
        
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );
        
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
            return next(new ExpressError('用户不存在或已被禁用', 401));
        }
        
        // 生成新的access token
        const token = user.generateAuthToken();
        
        res.status(200).json({
            success: true,
            token
        });
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(new ExpressError('刷新Token无效或已过期', 401));
        }
        next(error);
    }
};

/**
 * @desc    登出（客户端删除token即可）
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
    try {
        // JWT是无状态的，服务器端不需要做什么
        // 可以在这里记录登出日志或做其他清理工作
        
        res.status(200).json({
            success: true,
            message: '登出成功'
        });
        
    } catch (error) {
        next(error);
    }
};