// ============================================
// SipSpot - Embedding Service
// HuggingFace multilingual-e5-base 模型单例
// 服务器启动时预热，后续复用
// NOTE: @xenova/transformers 是 ESM 包，必须用 await import() 而不是 require()
// ============================================

'use strict';

let _pipeline = null;
let _ready = false;

// ============================================
// 初始化（服务器启动时调用一次）
// ============================================

/**
 * 预热 embedding 模型
 * 失败时只记录警告，不抛出异常（服务器继续启动，降级为关键字搜索）
 * @returns {Promise<void>}
 */
async function init() {
    console.log('⏳ 正在加载 multilingual-e5-base embedding 模型...');
    console.log('   首次运行将下载约 280MB 模型文件，请稍候');

    // 动态 import ESM 包（CommonJS 中不能用 require）
    const { pipeline } = await import('@xenova/transformers');

    _pipeline = await pipeline(
        'feature-extraction',
        'Xenova/multilingual-e5-base'
    );

    _ready = true;
    console.log('✅ Embedding 模型加载完成');
}

/**
 * @returns {boolean} 模型是否就绪
 */
function isReady() {
    return _ready;
}

// ============================================
// Embedding 生成
// ============================================

/**
 * 生成单条文本的 embedding
 * @param {string} text - 原始文本
 * @param {'query'|'passage'} type - E5 模型需要前缀：查询用 "query:"，文档用 "passage:"
 * @returns {Promise<number[]>} 768 维向量
 */
async function generateEmbedding(text, type = 'query') {
    if (!_ready || !_pipeline) {
        throw new Error('Embedding 模型未就绪');
    }

    // E5 模型需要前缀以提高检索精度
    const prefixed = type === 'query'
        ? `query: ${text}`
        : `passage: ${text}`;
    const output = await _pipeline(prefixed, {
        pooling: 'mean',
        normalize: true
    });

    return Array.from(output.data);
}

/**
 * 批量生成 embeddings
 * @param {{ text: string, type: 'query'|'passage' }[]} items
 * @returns {Promise<number[][]>}
 */
async function generateBatch(items) {
    return Promise.all(items.map(({ text, type }) => generateEmbedding(text, type)));
}

/**
 * 构建咖啡馆的 passage 文本（送入 generateEmbedding 前调用）
 * description 截断到 400 字符，防止超出 512 token 限制
 * @param {Object} cafe - Mongoose 文档或 lean 对象
 * @returns {string} 原始文本
 */
function buildCafeText(cafe) {
    const desc = (cafe.description || '').substring(0, 400);
    const amenities = (cafe.amenities || []).join(' ');
    const specialty = cafe.specialty || '';
    const vibe = cafe.vibe || '';
    return `${cafe.name} ${desc} ${amenities} ${specialty} ${vibe}`.trim();
}

// ============================================
// 导出
// ============================================
module.exports = { init, isReady, generateEmbedding, generateBatch, buildCafeText };
