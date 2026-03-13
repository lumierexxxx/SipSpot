// ============================================
// SipSpot - Embedding Service
// HuggingFace bge-m3 模型单例
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
    console.log('⏳ 正在加载 bge-m3 embedding 模型...');
    console.log('   首次运行将下载约 570MB 模型文件，请稍候');

    // 动态 import ESM 包（CommonJS 中不能用 require）
    const { pipeline } = await import('@xenova/transformers');

    _pipeline = await pipeline(
        'feature-extraction',
        'Xenova/bge-m3'
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
 * @param {string} text - 原始文本（bge-m3 无需前缀，直接传入）
 * @param {'query'|'passage'} type - 保留参数（暂未使用，bge-m3 prefix-free）
 * @returns {Promise<number[]>} 1024 维向量
 */
async function generateEmbedding(text, type = 'query') {
    if (!_ready || !_pipeline) {
        throw new Error('Embedding 模型未就绪');
    }

    // bge-m3 是 prefix-free 模型，无需添加 "query:" 或 "passage:" 前缀
    const output = await _pipeline(text, {
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
