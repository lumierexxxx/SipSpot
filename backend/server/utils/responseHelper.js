// ============================================
// SipSpot - 响应帮助工具
// 统一API响应格式
// ============================================

/**
 * 成功响应
 * @param {Object} res - Express response对象
 * @param {any} data - 响应数据
 * @param {string} message - 成功消息
 * @param {number} statusCode - HTTP状态码
 */
exports.successResponse = (res, data, message = '操作成功', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * 错误响应
 * @param {Object} res - Express response对象
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {any} errors - 详细错误信息（可选）
 */
exports.errorResponse = (res, message = '操作失败', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message
    };
    
    if (errors) {
        response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
};

/**
 * 分页响应
 * @param {Object} res - Express response对象
 * @param {Array} data - 数据数组
 * @param {number} total - 总数
 * @param {number} page - 当前页码
 * @param {number} limit - 每页数量
 * @param {string} message - 成功消息
 */
exports.paginatedResponse = (res, data, total, page, limit, message = '获取成功') => {
    const pages = Math.ceil(total / limit);
    
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            total,
            count: data.length,
            page: parseInt(page),
            pages,
            limit: parseInt(limit),
            hasNext: page < pages,
            hasPrev: page > 1
        }
    });
};

/**
 * 创建响应（201）
 * @param {Object} res - Express response对象
 * @param {any} data - 创建的资源
 * @param {string} message - 成功消息
 */
exports.createdResponse = (res, data, message = '创建成功') => {
    return res.status(201).json({
        success: true,
        message,
        data
    });
};

/**
 * 删除响应（200或204）
 * @param {Object} res - Express response对象
 * @param {string} message - 成功消息
 * @param {boolean} sendData - 是否返回数据
 */
exports.deletedResponse = (res, message = '删除成功', sendData = true) => {
    if (sendData) {
        return res.status(200).json({
            success: true,
            message,
            data: {}
        });
    }
    return res.status(204).send();
};

/**
 * 未找到响应（404）
 * @param {Object} res - Express response对象
 * @param {string} message - 错误消息
 */
exports.notFoundResponse = (res, message = '资源不存在') => {
    return res.status(404).json({
        success: false,
        message
    });
};

/**
 * 未授权响应（401）
 * @param {Object} res - Express response对象
 * @param {string} message - 错误消息
 */
exports.unauthorizedResponse = (res, message = '请先登录') => {
    return res.status(401).json({
        success: false,
        message
    });
};

/**
 * 禁止访问响应（403）
 * @param {Object} res - Express response对象
 * @param {string} message - 错误消息
 */
exports.forbiddenResponse = (res, message = '您没有权限访问此资源') => {
    return res.status(403).json({
        success: false,
        message
    });
};

/**
 * 验证错误响应（400）
 * @param {Object} res - Express response对象
 * @param {string|Array} errors - 验证错误
 * @param {string} message - 错误消息
 */
exports.validationErrorResponse = (res, errors, message = '数据验证失败') => {
    return res.status(400).json({
        success: false,
        message,
        errors: Array.isArray(errors) ? errors : [errors]
    });
};

/**
 * 冲突响应（409）
 * @param {Object} res - Express response对象
 * @param {string} message - 错误消息
 */
exports.conflictResponse = (res, message = '资源已存在') => {
    return res.status(409).json({
        success: false,
        message
    });
};

/**
 * 速率限制响应（429）
 * @param {Object} res - Express response对象
 * @param {string} message - 错误消息
 */
exports.rateLimitResponse = (res, message = '请求过于频繁，请稍后再试') => {
    return res.status(429).json({
        success: false,
        message
    });
};

/**
 * 服务器错误响应（500）
 * @param {Object} res - Express response对象
 * @param {string} message - 错误消息
 * @param {any} error - 错误对象（开发环境）
 */
exports.serverErrorResponse = (res, message = '服务器内部错误', error = null) => {
    const response = {
        success: false,
        message
    };
    
    // 开发环境返回详细错误信息
    if (process.env.NODE_ENV !== 'production' && error) {
        response.error = {
            message: error.message,
            stack: error.stack
        };
    }
    
    return res.status(500).json(response);
};