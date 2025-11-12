// ============================================
// SipSpot - 异步错误处理包装器
// 自动捕获异步函数中的错误并传递给错误处理中间件
// ============================================

/**
 * 包装异步路由处理函数
 * 自动捕获Promise rejection并传递给next()
 * 
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} Express中间件函数
 * 
 * @example
 * router.get('/cafes', asyncHandler(async (req, res) => {
 *     const cafes = await Cafe.find();
 *     res.json(cafes);
 * }));
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;