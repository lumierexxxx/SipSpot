// ============================================
// SipSpot - 自定义错误类
// 统一的错误处理，继承自Error类
// ============================================

class ExpressError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // 标记为可预期的操作错误
        
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ExpressError;