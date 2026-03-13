# Semantic Search + RAG Recommendations Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade SipSpot's AI from regex keyword matching to semantic vector search + embedding-based personalized recommendations, with full fallback to existing system.

**Architecture:** HuggingFace `Xenova/multilingual-e5-small` runs as a pre-warmed singleton inside the Express process. Cafe and user embeddings are stored in MongoDB (384 dimensions). Vector ranking is done in-memory via cosine similarity in JS — no extra infrastructure needed at current scale (<500 cafes).

**Tech Stack:** `@xenova/transformers ^2.x` (ESM package — must use `await import()` from CommonJS), MongoDB (local), Qwen API (existing), Express (CommonJS `require/module.exports`), React 19

---

## Chunk 1: Foundation — Models + vectorService

### Task 1: Install `@xenova/transformers`

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install the package**

```bash
cd backend && npm install @xenova/transformers@^2
```

- [ ] **Step 2: Verify install**

`@xenova/transformers` is an ESM-only package — you CANNOT use `require()`. Use dynamic import in Node to verify:

```bash
node --input-type=module -e "import('@xenova/transformers').then(() => console.log('ok'));"
```

Expected output: `ok` (may take a few seconds on first run)

- [ ] **Step 3: Commit**

```bash
cd backend && git add package.json package-lock.json
git commit -m "feat: add @xenova/transformers dependency for semantic embeddings"
```

---

### Task 2: Add embedding fields to Cafe schema

**Files:**
- Modify: `backend/server/models/cafe.js`

The `embedding` and `embeddingUpdatedAt` fields go after the `aiSummary` block (around line 238) and before `// 所有权与管理`. Both need `select: false` so they don't bloat list queries.

- [ ] **Step 1: Add fields to CafeSchema**

In `backend/server/models/cafe.js`, after the closing `}` of `aiSummary` and before `author`, add:

```js
    // ============================================
    // 向量 Embedding（语义搜索用）
    // ============================================
    embedding: {
        type: [Number],           // 384 维，multilingual-e5-small 输出
        default: [],
        select: false             // 默认查询不返回，按需 .select('+embedding')
    },

    embeddingUpdatedAt: {
        type: Date,
        default: null
    },
```

- [ ] **Step 2: Add index**

In `backend/server/models/cafe.js`, in the indexes section (after the existing `CafeSchema.index` calls), add:

```js
// Embedding 状态索引（用于 backfill 脚本和候选过滤）
CafeSchema.index({ embeddingUpdatedAt: 1, isActive: 1 });
```

- [ ] **Step 3: Verify server still starts**

```bash
cd backend && node -e "require('./server/models/cafe'); console.log('Cafe model ok');"
```

Expected: `Cafe model ok`

- [ ] **Step 4: Commit**

```bash
git add backend/server/models/cafe.js
git commit -m "feat: add embedding and embeddingUpdatedAt fields to Cafe schema"
```

---

### Task 3: Add preference embedding fields to User schema

**Files:**
- Modify: `backend/server/models/user.js`

- [ ] **Step 1: Read `backend/server/models/user.js`**

Find where the `preferences` field ends. New fields go immediately after it.

- [ ] **Step 2: Add three fields to userSchema**

After the `preferences` field definition, add:

```js
    // ============================================
    // 用户偏好向量（个性化推荐用）
    // ============================================
    preferenceEmbedding: {
        type: [Number],           // 384 维，L2 归一化后的加权平均
        default: [],
        select: false
    },

    preferenceEmbeddingUpdatedAt: {
        type: Date,
        default: null
    },

    // 滑动窗口：最多保留 100 条，每次写入用 $slice 控制
    // computeUserEmbedding 只取最近 30 条参与计算
    preferenceHistory: {
        type: [{
            cafeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Cafe'
            },
            weight: Number,       // 收藏=2, 高分评论=1
            addedAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: [],
        select: false
    },
```

- [ ] **Step 3: Verify user model loads**

```bash
cd backend && node -e "require('./server/models/user'); console.log('User model ok');"
```

Expected: `User model ok`

- [ ] **Step 4: Commit**

```bash
git add backend/server/models/user.js
git commit -m "feat: add preferenceEmbedding, preferenceHistory fields to User schema"
```

---

### Task 4: Create `vectorService.js`

**Files:**
- Create: `backend/server/services/vectorService.js`

This is pure math — no DB, no HTTP. All functions have defensive checks for empty/mismatched arrays.

- [ ] **Step 1: Create the file**

```js
// ============================================
// SipSpot - Vector Math Service
// 余弦相似度计算 + 咖啡馆排序 + 用户偏好向量计算
// 纯数学，无外部依赖，可独立测试
// ============================================

'use strict';

// ============================================
// 基础向量运算
// ============================================

/**
 * 计算两个向量的余弦相似度
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} -1 到 1，越接近 1 越相似
 */
function cosineSimilarity(a, b) {
    if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
        return 0;
    }
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot  += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * L2 归一化向量（使模长为 1）
 * @param {number[]} v
 * @returns {number[]}
 */
function normalizeVector(v) {
    if (!v || v.length === 0) return v;
    const mag = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    if (mag === 0) return v;
    return v.map(x => x / mag);
}

// ============================================
// 咖啡馆排序
// ============================================

/**
 * 按语义相似度对咖啡馆排序
 * @param {number[]} queryEmb - 查询向量（384 维）
 * @param {Array} cafes - 含 embedding 字段的对象数组（Mongoose lean 或普通对象均可）
 * @param {Object} options
 * @param {string[]} [options.amenityBoost] - 中文设施名称，匹配则加分，e.g. ['WiFi', '安静环境']
 * @param {number} [options.topK=10]
 * @returns {{ cafe: Object, similarityScore: number }[]}
 */
function rankCafes(queryEmb, cafes, options = {}) {
    const { amenityBoost = [], topK = 10 } = options;

    const scored = cafes
        .filter(cafe => cafe.embedding && cafe.embedding.length === 384)
        .map(cafe => {
            let score = cosineSimilarity(queryEmb, cafe.embedding);

            // 设施 boost：每匹配一个中文设施名 +0.1，最多 +0.3
            if (amenityBoost.length > 0 && cafe.amenities) {
                const matchCount = amenityBoost.filter(a => cafe.amenities.includes(a)).length;
                score += Math.min(matchCount * 0.1, 0.3);
            }

            return { cafe, similarityScore: Math.min(score, 1) };
        });

    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    return scored.slice(0, topK);
}

// ============================================
// 用户偏好向量计算
// ============================================

/**
 * 计算用户偏好 embedding（带衰减的加权平均）
 * @param {{ embedding: number[], weight: number, addedAt: Date }[]} historyItems
 * @returns {number[]} L2 归一化后的向量，或空数组（如无有效数据）
 */
function computeUserEmbedding(historyItems) {
    if (!historyItems || historyItems.length === 0) return [];

    const valid = historyItems.filter(
        item => item.embedding && item.embedding.length === 384
    );
    if (valid.length === 0) return [];

    // 按时间降序，只取最近 30 条（滑动窗口）
    const sorted = [...valid].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    const window = sorted.slice(0, 30);

    // 指数衰减：越新的权重越高 effectiveWeight = item.weight × 0.85^index
    const dim = 384;
    const avg = new Array(dim).fill(0);
    let totalWeight = 0;

    window.forEach((item, index) => {
        const decay = Math.pow(0.85, index);
        const effectiveWeight = item.weight * decay;
        totalWeight += effectiveWeight;
        for (let i = 0; i < dim; i++) {
            avg[i] += item.embedding[i] * effectiveWeight;
        }
    });

    if (totalWeight === 0) return [];

    const weighted = avg.map(v => v / totalWeight);
    return normalizeVector(weighted);
}

// ============================================
// 节流检查
// ============================================

/**
 * 检查用户偏好向量是否需要更新（1 分钟节流）
 * @param {Object} user - 含 preferenceEmbeddingUpdatedAt 字段的用户对象
 * @returns {boolean} true = 可以更新，false = 跳过
 */
function shouldUpdatePreference(user) {
    if (!user.preferenceEmbeddingUpdatedAt) return true;
    return Date.now() - new Date(user.preferenceEmbeddingUpdatedAt).getTime() > 60_000;
}

// ============================================
// 导出
// ============================================
module.exports = {
    cosineSimilarity,
    normalizeVector,
    rankCafes,
    computeUserEmbedding,
    shouldUpdatePreference
};
```

- [ ] **Step 2: Smoke-test the math**

```bash
cd backend && node -e "
const v = require('./server/services/vectorService');
const a = [1, 0, 0];
const b = [1, 0, 0];
const c = [0, 1, 0];
console.assert(v.cosineSimilarity(a, b) === 1, 'identical vectors should be 1');
console.assert(v.cosineSimilarity(a, c) === 0, 'orthogonal vectors should be 0');
const norm = v.normalizeVector([3, 4]);
const mag = Math.sqrt(norm[0]*norm[0] + norm[1]*norm[1]);
console.assert(Math.abs(mag - 1) < 1e-9, 'normalized magnitude should be 1');
console.log('vectorService smoke test passed');
"
```

Expected: `vectorService smoke test passed`

- [ ] **Step 3: Commit**

```bash
git add backend/server/services/vectorService.js
git commit -m "feat: add vectorService with cosine similarity, rankCafes, computeUserEmbedding"
```

---

## Chunk 2: Embedding Service + Server Startup

### Task 5: Create `embeddingService.js`

**Files:**
- Create: `backend/server/services/embeddingService.js`

The model is a singleton. `init()` is called once at server startup. First-time run downloads ~120MB to `~/.cache/huggingface/` automatically. Subsequent starts use the cache.

**CRITICAL — ESM in CommonJS:** `@xenova/transformers` is an ESM package. In CommonJS files (`.js` with `require`), you MUST use `await import('@xenova/transformers')` NOT `require('@xenova/transformers')`.

**E5 prefix requirement:** `multilingual-e5-small` needs a text prefix:
- Search queries → internally prefixed as `"query: 用户输入的文字"`
- Cafe documents → internally prefixed as `"passage: 咖啡馆名称 描述 设施..."`

- [ ] **Step 1: Create the file**

```js
// ============================================
// SipSpot - Embedding Service
// HuggingFace multilingual-e5-small 模型单例
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
    console.log('⏳ 正在加载 multilingual-e5-small embedding 模型...');
    console.log('   首次运行将下载约 120MB 模型文件，请稍候');

    // 动态 import ESM 包（CommonJS 中不能用 require）
    const { pipeline } = await import('@xenova/transformers');

    _pipeline = await pipeline(
        'feature-extraction',
        'Xenova/multilingual-e5-small'
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
 * @param {string} text - 原始文本（不含前缀，本函数内部自动添加）
 * @param {'query'|'passage'} type - 'query' 用于搜索查询，'passage' 用于咖啡馆文档
 * @returns {Promise<number[]>} 384 维向量
 */
async function generateEmbedding(text, type = 'query') {
    if (!_ready || !_pipeline) {
        throw new Error('Embedding 模型未就绪');
    }

    // E5 模型要求前缀以提高检索精度
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
 * @returns {string} 原始文本（不含 passage: 前缀）
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
```

- [ ] **Step 2: Verify the file loads (syntax check)**

```bash
cd backend && node -e "const e = require('./server/services/embeddingService'); console.log('isReady:', e.isReady());"
```

Expected: `isReady: false`

- [ ] **Step 3: Commit**

```bash
git add backend/server/services/embeddingService.js
git commit -m "feat: add embeddingService singleton for multilingual-e5-small HuggingFace model"
```

---

### Task 6: Refactor `server.js` to async startup

**Files:**
- Modify: `backend/server/server.js`

The existing `server.js` calls `app.listen()` synchronously (line 195) and `mongoose.connect()` in a floating `.then()` chain (line 33). We wrap everything in `async function startServer()` so we can `await embeddingService.init()` before accepting requests.

The existing file declares `const dbUrl = process.env.MONGODB_URI || ...` at line 31 — this stays in place and is referenced from within `startServer()`.

- [ ] **Step 1: Add embeddingService import**

After the existing `require` statements at the top of `server.js` (after line 17 where `ExpressError` is imported), add:

```js
const embeddingService = require('./services/embeddingService');
```

- [ ] **Step 2: Remove the floating mongoose.connect block**

Delete lines 33–44 (the `mongoose.connect(...).then(...).catch(...)` block) and lines 46–47 (`const db = ...` and `db.on(...)`).

- [ ] **Step 3: Remove the existing app.listen call**

Delete lines 193–202 (the `const server = app.listen(PORT, () => {...})` block). Also delete the `const PORT = ...` line — it moves into `startServer()`.

- [ ] **Step 4: Add `startServer()` before the SIGTERM handler**

Insert the following just before the `process.on('SIGTERM', ...)` handler. `server` is declared in the outer scope so the SIGTERM and unhandledRejection handlers can still reference it:

```js
// ============================================
// 启动服务器
// ============================================
const PORT = process.env.PORT || 5001;
let server;

async function startServer() {
    // 1. 连接数据库
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
```

- [ ] **Step 5: Start the server and verify**

```bash
cd backend && npm run dev
```

Expected startup sequence (MongoDB connects first, then model loads):
```
✅ MongoDB连接成功
⏳ 正在加载 multilingual-e5-small embedding 模型...
   首次运行将下载约 120MB 模型文件，请稍候
✅ Embedding 模型加载完成
🚀 SipSpot服务器启动成功！
🚀 语义搜索: ✅ 已启用
```

First run downloads the model (~120MB) — wait up to 3 minutes. Subsequent starts are instant.

- [ ] **Step 6: Commit**

```bash
git add backend/server/server.js
git commit -m "feat: refactor server startup to async startServer(); add embedding model pre-warming"
```

---

## Chunk 3: AI Search — Semantic Search + Explain

### Task 7: Add `explainSearchSchema` to `validation.js`

**Files:**
- Modify: `backend/server/utils/validation.js`

- [ ] **Step 1: Add the Joi schema at the end of the file**

```js
// ============================================
// AI 搜索解释验证
// ============================================

exports.explainSearchSchema = Joi.object({
    query: Joi.string().trim().max(200).required()
        .messages({
            'string.max': '查询文本不能超过200个字符',
            'any.required': '请提供查询文本'
        }),
    cafeNames: Joi.array()
        .items(Joi.string().trim().max(100))
        .max(5)
        .required()
        .messages({
            'array.max': '最多提供5个咖啡馆名称',
            'any.required': '请提供咖啡馆名称列表'
        })
});
```

- [ ] **Step 2: Verify it exports correctly**

```bash
cd backend && node -e "const { explainSearchSchema } = require('./server/utils/validation'); console.log('schema ok:', !!explainSearchSchema);"
```

Expected: `schema ok: true`

- [ ] **Step 3: Commit**

```bash
git add backend/server/utils/validation.js
git commit -m "feat: add explainSearchSchema Joi validation for AI explain endpoint"
```

---

### Task 8: Add `generateSearchExplanation` to `aiService.js`

**Files:**
- Modify: `backend/server/services/aiService.js`

- [ ] **Step 1: Add the function before `exports.getConfig` at the bottom**

```js
/**
 * 生成语义搜索结果的 Qwen 解释
 * @param {string} query - 用户的原始搜索词
 * @param {string[]} cafeNames - 最多 5 个咖啡馆名称
 * @returns {Promise<string|null>} 解释文本，失败时返回 null
 */
exports.generateSearchExplanation = async (query, cafeNames) => {
    try {
        if (!process.env.QWEN_API_KEY) return null;

        const cafeList = cafeNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
        const prompt = `用户搜索："${query}"

我们为用户找到了以下咖啡馆：
${cafeList}

请用1-2句话简洁地解释为什么这些咖啡馆符合用户的需求。语气友好自然，不要逐条列举。`;

        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen-plus',
                input: {
                    messages: [
                        {
                            role: 'system',
                            content: '你是SipSpot咖啡馆推荐助手，用简洁友好的语言解释搜索结果。'
                        },
                        { role: 'user', content: prompt }
                    ]
                },
                parameters: {
                    result_format: 'message',
                    temperature: 0.5,
                    max_tokens: 150
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.QWEN_API_KEY}`
                },
                timeout: 10000
            }
        );

        return response.data.output.choices[0].message.content.trim();
    } catch (error) {
        console.error('生成搜索解释失败:', error.message);
        return null;
    }
};
```

- [ ] **Step 2: Verify aiService loads**

```bash
cd backend && node -e "const ai = require('./server/services/aiService'); console.log('generateSearchExplanation:', typeof ai.generateSearchExplanation);"
```

Expected: `generateSearchExplanation: function`

- [ ] **Step 3: Commit**

```bash
git add backend/server/services/aiService.js
git commit -m "feat: add generateSearchExplanation to aiService for Qwen-powered search results"
```

---

### Task 9: Rewrite `aiSearchController.js`

**Files:**
- Modify: `backend/server/controllers/aiSearchController.js`

The existing `aiSearch` function uses regex keyword parsing. We replace its body with semantic search when the embedding service is ready, falling back to the original logic otherwise. All original helper functions (`parseNaturalLanguageQuery`, `buildMongoQuery`, `generateExplanation`, `calculateDistance`, `toRad`) are **kept** at the bottom of the file.

- [ ] **Step 1: Add new imports at the top of the file**

After the existing `const Cafe = ...`, `asyncHandler`, and `ExpressError` requires, add:

```js
const embeddingService = require('../services/embeddingService');
const vectorService = require('../services/vectorService');
const aiService = require('../services/aiService');
```

- [ ] **Step 2: Replace `exports.aiSearch` function body**

Replace only the body of `exports.aiSearch` (the `asyncHandler(async (req, res, next) => { ... })` block). Keep the existing function signature:

```js
exports.aiSearch = asyncHandler(async (req, res, next) => {
    const { query } = req.body;

    if (!query || !query.trim()) {
        return next(new ExpressError('请提供搜索查询', 400));
    }

    console.log('🤖 AI搜索查询:', query);

    // ── 语义搜索路径 ─────────────────────────────────────
    if (embeddingService.isReady()) {
        // 1. 生成查询向量
        const queryEmb = await embeddingService.generateEmbedding(query.trim(), 'query');

        // 2. 提取硬过滤条件（只有城市作为硬过滤）
        const cities = ['上海', '北京', '广州', '深圳', '杭州', '成都'];
        const detectedCity = cities.find(c => query.includes(c));
        const dbQuery = {
            isActive: true,
            embeddingUpdatedAt: { $exists: true, $ne: null },
            ...(detectedCity && { city: detectedCity })
        };

        // 3. 提取设施意图（用于 boost，不硬过滤）
        const amenityBoost = detectAmenityIntent(query);

        // 4. 查询候选咖啡馆（带 embedding 字段）
        const cafes = await Cafe.find(dbQuery)
            .select('+embedding')
            .populate('author', 'username avatar')
            .lean();

        // 5. 余弦排序
        const ranked = vectorService.rankCafes(queryEmb, cafes, { amenityBoost, topK: 10 });
        const results = ranked.map(r => r.cafe);

        console.log(`✅ 语义搜索返回 ${results.length} 个结果`);

        return res.status(200).json({
            success: true,
            query,
            mode: 'semantic',
            count: results.length,
            cafes: results
        });
    }

    // ── 降级：关键字搜索路径（保留原有逻辑）────────────────
    console.log('⚠️  Embedding 未就绪，使用关键字搜索');
    const parsedParams = parseNaturalLanguageQuery(query);
    const mongoQuery = buildMongoQuery(parsedParams);

    let cafesQuery = Cafe.find(mongoQuery)
        .populate('author', 'username avatar')
        .select('-reviews');

    cafesQuery = cafesQuery.sort(parsedParams.sort || { rating: -1, reviewCount: -1 });
    cafesQuery = cafesQuery.limit(parsedParams.limit || 20);

    const cafes = await cafesQuery;
    const explanation = generateExplanation(parsedParams, cafes.length);

    return res.status(200).json({
        success: true,
        query,
        mode: 'keyword',
        parsedParams,
        explanation,
        count: cafes.length,
        cafes
    });
});
```

- [ ] **Step 3: Add `explainSearch` export and `detectAmenityIntent` helper**

Add these AFTER the `exports.aiSearch` block but BEFORE the existing `parseNaturalLanguageQuery` function:

```js
/**
 * @desc    AI 搜索结果解释（Qwen 生成，前端异步调用）
 * @route   POST /api/cafes/ai-search/explain
 * @access  Public
 */
exports.explainSearch = asyncHandler(async (req, res, next) => {
    const { query, cafeNames } = req.body;
    // Input validated by explainSearchSchema middleware before reaching here

    const explanation = await aiService.generateSearchExplanation(query, cafeNames);

    res.status(200).json({
        success: true,
        explanation  // null if Qwen failed — frontend handles gracefully
    });
});

/**
 * 从查询文本中检测设施意图，返回中文设施名称数组（用于 amenityBoost）
 * 注意：必须使用中文枚举值以匹配 Cafe.amenities
 */
function detectAmenityIntent(query) {
    const lowerQuery = query.toLowerCase();
    const boost = [];

    if (lowerQuery.includes('wifi') || lowerQuery.includes('网络')) boost.push('WiFi');
    if (lowerQuery.includes('插座') || lowerQuery.includes('电源')) boost.push('电源插座');
    if (lowerQuery.includes('安静') || lowerQuery.includes('quiet')) boost.push('安静环境');
    if (lowerQuery.includes('户外') || lowerQuery.includes('露台')) boost.push('户外座位');
    if (lowerQuery.includes('宠物') || lowerQuery.includes('pet')) boost.push('宠物友好');
    if (lowerQuery.includes('办公') || lowerQuery.includes('工作') || lowerQuery.includes('work')) {
        boost.push('适合工作 / 办公', '适合使用笔记本电脑', 'WiFi', '电源插座');
    }

    return [...new Set(boost)];
}
```

- [ ] **Step 4: Verify file loads**

```bash
cd backend && node -e "const c = require('./server/controllers/aiSearchController'); console.log('aiSearch:', typeof c.aiSearch, '| explainSearch:', typeof c.explainSearch);"
```

Expected: `aiSearch: function | explainSearch: function`

- [ ] **Step 5: Commit**

```bash
git add backend/server/controllers/aiSearchController.js
git commit -m "feat: upgrade aiSearchController to semantic vector search with keyword fallback"
```

---

### Task 10: Update `routes/cafes.js`

**Files:**
- Modify: `backend/server/routes/cafes.js`

Two changes needed:
1. Move `router.use('/:cafeId/reviews', reviewRoutes)` from line 31 (currently at the TOP) to the very end of the file — critical Express route ordering fix.
2. Add the `/ai-search/explain` route with its own rate limiter.

- [ ] **Step 0: Read the current file**

Read `backend/server/routes/cafes.js` and verify the full list of imported controller functions matches the exports in `cafeController.js`. Confirm `getCafes`, `getNearby`, `getCafe`, `createCafe`, `updateCafe`, `deleteCafe`, `getTopRated`, `searchCafes`, `getCafesByAmenities`, `getCafeStats` all exist.

- [ ] **Step 1: Rewrite `backend/server/routes/cafes.js`**

```js
// ============================================
// SipSpot - Cafe Routes
// 咖啡店 CRUD + 搜索 + 附近 + 语义搜索
// 重要：所有静态路由必须在 /:cafeId 通配符路由之前！
// ============================================

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadCafeImages } = require('../services/cloudinary');
const { validate, cafeSchema, explainSearchSchema } = require('../utils/validation');

const {
    getCafes,
    getNearby,
    getCafe,
    createCafe,
    updateCafe,
    deleteCafe,
    getTopRated,
    searchCafes,
    getCafesByAmenities,
    getCafeStats
} = require('../controllers/cafeController');

const { aiSearch, explainSearch } = require('../controllers/aiSearchController');

// explain 接口独立限流：10 次/分钟/IP（防止 Qwen token 滥用）
const explainLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, message: '请求过于频繁，请稍后再试' }
});

// ============================================
// 公开路由（静态路由必须在 /:id 之前）
// ============================================

router.post('/ai-search', aiSearch);
router.post('/ai-search/explain', explainLimiter, validate(explainSearchSchema), explainSearch);

router.get('/', optionalAuth, getCafes);
router.get('/nearby', getNearby);
router.get('/top/rated', getTopRated);
router.get('/search', searchCafes);
router.get('/amenities/:amenity', getCafesByAmenities);
router.get('/:id/stats', getCafeStats);
router.get('/:id', optionalAuth, getCafe);

// ============================================
// 受保护路由
// ============================================

router.post('/', protect, validate(cafeSchema), uploadCafeImages, createCafe);
router.put('/:id', protect, updateCafe);
router.delete('/:id', protect, deleteCafe);

// ============================================
// 嵌套评论路由
// 必须放在最后！/:cafeId 会匹配所有未命中的路径
// ============================================
const reviewRoutes = require('./reviews');
router.use('/:cafeId/reviews', reviewRoutes);

module.exports = router;
```

- [ ] **Step 2: Test that existing routes still work**

With backend running:
```bash
curl http://localhost:5001/api/cafes | jq '.success'
# Expected: true

curl -X POST http://localhost:5001/api/cafes/ai-search \
  -H 'Content-Type: application/json' \
  -d '{"query":"安静的咖啡馆"}' | jq '{mode: .mode, count: .count}'
# Expected: { "mode": "semantic", "count": 10 }  (or "keyword" if model not ready)
```

- [ ] **Step 3: Test explain endpoint**

```bash
curl -X POST http://localhost:5001/api/cafes/ai-search/explain \
  -H 'Content-Type: application/json' \
  -d '{"query":"安静可以工作", "cafeNames":["Blue Bottle","Seesaw"]}' | jq '.'
# Expected: { "success": true, "explanation": "..." or null }
```

- [ ] **Step 4: Commit**

```bash
git add backend/server/routes/cafes.js
git commit -m "feat: add /ai-search/explain route; fix wildcard /:cafeId route ordering"
```

---

## Chunk 4: Recommendations + Controller Hooks

### Task 11: Upgrade `recommendationController.js`

**Files:**
- Modify: `backend/server/controllers/recommendationController.js`

Only `getRecommendations` changes. All other exports are untouched.

- [ ] **Step 1: Add vectorService import**

After the existing `require` statements at the top, add:

```js
const vectorService = require('../services/vectorService');
```

- [ ] **Step 2: Replace the body of `exports.getRecommendations`**

Keep the `try/catch` wrapper. Replace only the inner logic:

```js
exports.getRecommendations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { limit = 10 } = req.query;

        console.log(`🎯 为用户 ${req.user.username} 生成个性化推荐`);

        // 加载用户（含 preferenceEmbedding）
        const user = await User.findById(userId)
            .select('+preferenceEmbedding')
            .populate('favorites')
            .populate('visited.cafe');

        const userReviews = await Review.find({ author: userId })
            .populate('cafe')
            .sort({ createdAt: -1 })
            .limit(50);

        // ── 向量推荐路径 ──────────────────────────────────
        if (user.preferenceEmbedding && user.preferenceEmbedding.length >= 384) {
            console.log('🧮 使用向量推荐');

            const candidates = await Cafe.find({
                isActive: true,
                embeddingUpdatedAt: { $exists: true, $ne: null },
                _id: { $nin: user.favorites.map(f => f._id || f) }
            })
            .select('+embedding')
            .lean();

            const ranked = vectorService.rankCafes(
                user.preferenceEmbedding,
                candidates,
                { topK: parseInt(limit) }
            );

            const recommendations = ranked.map(({ cafe, similarityScore }) => ({
                cafe,
                score: Math.round(similarityScore * 100),
                reasons: ['基于您的偏好推荐'],
                type: similarityScore >= 0.7 ? 'personalized' : 'general'
            }));

            console.log(`✅ 向量推荐生成了 ${recommendations.length} 个结果`);

            return res.status(200).json({
                success: true,
                recommendations,
                basedOn: {
                    reviewCount: userReviews.length,
                    favoriteCount: user.favorites.length,
                    visitedCount: user.visited.length,
                    mode: 'vector'
                }
            });
        }

        // ── 降级：规则推荐路径（保留原有逻辑）──────────────
        console.log('⚠️  用户无偏好向量，使用规则推荐');

        const candidateCafes = await Cafe.find({
            isActive: true,
            _id: { $nin: user.favorites }
        })
        .populate('author', 'username avatar')
        .sort({ rating: -1 })
        .limit(100);

        const recommendations = await aiService.generatePersonalizedRecommendations(
            user,
            candidateCafes,
            { reviews: userReviews, favorites: user.favorites, visited: user.visited }
        );

        return res.status(200).json({
            success: true,
            recommendations: recommendations.slice(0, parseInt(limit)),
            basedOn: {
                reviewCount: userReviews.length,
                favoriteCount: user.favorites.length,
                visitedCount: user.visited.length,
                mode: 'rule-based'
            },
            userPreferences: user.getPreferencesSummary ? user.getPreferencesSummary() : {}
        });

    } catch (error) {
        console.error('❌ 生成推荐失败:', error);
        next(error);
    }
};
```

- [ ] **Step 3: Commit**

```bash
git add backend/server/controllers/recommendationController.js
git commit -m "feat: upgrade getRecommendations to vector-based ranking with rule-based fallback"
```

---

### Task 12: Add cafe embedding trigger to `cafeController.js`

**Files:**
- Modify: `backend/server/controllers/cafeController.js`

- [ ] **Step 1: Read `backend/server/controllers/cafeController.js`**

Verify the exact variable names in `createCafe` and `updateCafe`:
- `createCafe`: the created cafe is assigned to `const cafe = await Cafe.create(req.body)` (line 140) — use `cafe`
- `updateCafe`: after `findByIdAndUpdate`, the result is reassigned to `cafe` (`cafe = await Cafe.findByIdAndUpdate(...)` at line 170) — use `cafe`

- [ ] **Step 2: Add imports at the top of cafeController.js**

```js
const embeddingService = require('../services/embeddingService');
```

(`Cafe` is already imported at line 8 — do not add a duplicate require.)

- [ ] **Step 3: Add embedding trigger after `res.status(201).json(...)` in `createCafe`**

```js
    // 异步生成 embedding，不阻塞响应
    process.nextTick(async () => {
        try {
            if (!embeddingService.isReady()) return;
            const text = embeddingService.buildCafeText(cafe);
            const embedding = await embeddingService.generateEmbedding(text, 'passage');
            await Cafe.findByIdAndUpdate(cafe._id, {
                embedding,
                embeddingUpdatedAt: new Date()
            });
            console.log(`✅ Cafe embedding 已生成: ${cafe.name}`);
        } catch (e) {
            console.error(`❌ Cafe embedding 生成失败 (${cafe.name}):`, e.message);
        }
    });
```

- [ ] **Step 4: Add embedding trigger after `res.status(200).json(...)` in `updateCafe`**

Note: after `findByIdAndUpdate`, the variable is still named `cafe` (line 170 reassigns it).

```js
    // 更新后重新生成 embedding
    process.nextTick(async () => {
        try {
            if (!embeddingService.isReady()) return;
            const text = embeddingService.buildCafeText(cafe);
            const embedding = await embeddingService.generateEmbedding(text, 'passage');
            await Cafe.findByIdAndUpdate(cafe._id, {
                embedding,
                embeddingUpdatedAt: new Date()
            });
            console.log(`✅ Cafe embedding 已更新: ${cafe.name}`);
        } catch (e) {
            console.error(`❌ Cafe embedding 更新失败:`, e.message);
        }
    });
```

- [ ] **Step 5: Commit**

```bash
git add backend/server/controllers/cafeController.js
git commit -m "feat: auto-generate cafe embedding on create/update (non-blocking)"
```

---

### Task 13: Add preference embedding triggers to `userController.js`

**Files:**
- Modify: `backend/server/controllers/userController.js`

The existing file has TWO separate functions: `addFavorite` (line 112) and `removeFavorite` (line 138) — there is no `toggleFavorite`. Add a trigger to each.

Variables in scope (from existing code):
- `addFavorite`: `cafe._id` (the cafe object fetched at line 113), `req.user.id` (user ID), `req.params.cafeId` (cafe ID string)
- `removeFavorite`: same variables

`User` and `Cafe` are already imported at the top — do not add duplicate requires.

- [ ] **Step 1: Add imports**

```js
const embeddingService = require('../services/embeddingService');
const vectorService = require('../services/vectorService');
```

- [ ] **Step 2: Add trigger after `res.status(200).json(...)` in `addFavorite`**

```js
    // 异步更新用户偏好向量（添加收藏）
    process.nextTick(async () => {
        try {
            if (!embeddingService.isReady()) return;
            const userId = req.user.id;
            const cafeId = req.params.cafeId;

            const freshUser = await User.findById(userId)
                .select('+preferenceEmbedding +preferenceHistory +preferenceEmbeddingUpdatedAt');
            if (!vectorService.shouldUpdatePreference(freshUser)) return;

            const cafeWithEmb = await Cafe.findById(cafeId).select('+embedding');
            if (!cafeWithEmb || !cafeWithEmb.embedding || cafeWithEmb.embedding.length !== 384) return;

            await User.findByIdAndUpdate(userId, {
                $push: {
                    preferenceHistory: {
                        $each: [{ cafeId, weight: 2, addedAt: new Date() }],
                        $slice: -100
                    }
                }
            }, { runValidators: false });

            const updatedUser = await User.findById(userId).select('+preferenceHistory');
            const cafeMap = await buildCafeEmbeddingMap(updatedUser.preferenceHistory);
            const historyItems = buildHistoryItems(updatedUser.preferenceHistory, cafeMap);
            const newEmbedding = vectorService.computeUserEmbedding(historyItems);
            if (newEmbedding.length === 0) return;

            await User.findByIdAndUpdate(userId, {
                preferenceEmbedding: newEmbedding,
                preferenceEmbeddingUpdatedAt: new Date()
            }, { runValidators: false });

            console.log(`✅ 用户 ${userId} 偏好向量已更新（添加收藏）`);
        } catch (e) {
            console.error('❌ 更新用户偏好向量失败（添加收藏）:', e.message);
        }
    });
```

- [ ] **Step 3: Add trigger after `res.status(200).json(...)` in `removeFavorite`**

```js
    // 异步更新用户偏好向量（取消收藏）
    process.nextTick(async () => {
        try {
            if (!embeddingService.isReady()) return;
            const userId = req.user.id;
            const cafeId = req.params.cafeId;

            const freshUser = await User.findById(userId)
                .select('+preferenceEmbedding +preferenceHistory +preferenceEmbeddingUpdatedAt');
            if (!vectorService.shouldUpdatePreference(freshUser)) return;

            await User.findByIdAndUpdate(userId, {
                $pull: { preferenceHistory: { cafeId } }
            }, { runValidators: false });

            const updatedUser = await User.findById(userId).select('+preferenceHistory');
            if (!updatedUser.preferenceHistory || updatedUser.preferenceHistory.length === 0) return;

            const cafeMap = await buildCafeEmbeddingMap(updatedUser.preferenceHistory);
            const historyItems = buildHistoryItems(updatedUser.preferenceHistory, cafeMap);
            const newEmbedding = vectorService.computeUserEmbedding(historyItems);
            if (newEmbedding.length === 0) return;

            await User.findByIdAndUpdate(userId, {
                preferenceEmbedding: newEmbedding,
                preferenceEmbeddingUpdatedAt: new Date()
            }, { runValidators: false });

            console.log(`✅ 用户 ${userId} 偏好向量已更新（取消收藏）`);
        } catch (e) {
            console.error('❌ 更新用户偏好向量失败（取消收藏）:', e.message);
        }
    });
```

- [ ] **Step 4: Add helper functions at the bottom of `userController.js`**

```js
// ============================================
// 偏好向量计算辅助函数（reviewController.js 中有相同副本）
// ============================================

/**
 * 批量加载 preferenceHistory 中所有 cafe 的 embedding
 * @param {Array} history - preferenceHistory 数组
 * @returns {Promise<Map<string, number[]>>} cafeId → embedding
 */
async function buildCafeEmbeddingMap(history) {
    const ids = history.map(h => h.cafeId);
    const cafes = await Cafe.find({ _id: { $in: ids } }).select('+embedding');
    const map = new Map();
    cafes.forEach(c => {
        if (c.embedding && c.embedding.length === 384) {
            map.set(c._id.toString(), c.embedding);
        }
    });
    return map;
}

/**
 * 将 preferenceHistory 转换为 computeUserEmbedding 所需格式
 */
function buildHistoryItems(history, cafeMap) {
    return history
        .map(h => ({
            embedding: cafeMap.get(h.cafeId.toString()),
            weight: h.weight,
            addedAt: h.addedAt
        }))
        .filter(h => h.embedding);
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/server/controllers/userController.js
git commit -m "feat: update user preferenceEmbedding on add/remove favorite (non-blocking)"
```

---

### Task 14: Add preference embedding trigger to `reviewController.js`

**Files:**
- Modify: `backend/server/controllers/reviewController.js`

Only `createReview` is modified. Variables in scope at the trigger point (after `res.status(201).json(...)`):
- `cafeId` — declared via `const { cafeId } = req.params;` at line 68 ✓
- `review` — the created Review document from `Review.create(reviewData)` at line 96; use `review.rating` ✓
- `Cafe` — already imported at line 7 ✓
- `User` — NOT imported; must be added

- [ ] **Step 1: Add imports at the top**

```js
const User = require('../models/user');
const embeddingService = require('../services/embeddingService');
const vectorService = require('../services/vectorService');
```

(`Cafe` is already imported — do not add a duplicate.)

- [ ] **Step 2: Add trigger after `res.status(201).json(...)` in `createReview`**

```js
    // 高分评论触发偏好向量更新（rating >= 4）
    process.nextTick(async () => {
        try {
            if (review.rating < 4) return;
            if (!embeddingService.isReady()) return;

            const userId = req.user.id;
            const freshUser = await User.findById(userId)
                .select('+preferenceEmbedding +preferenceHistory +preferenceEmbeddingUpdatedAt');
            if (!vectorService.shouldUpdatePreference(freshUser)) return;

            const cafeWithEmb = await Cafe.findById(cafeId).select('+embedding');
            if (!cafeWithEmb || !cafeWithEmb.embedding || cafeWithEmb.embedding.length !== 384) return;

            await User.findByIdAndUpdate(userId, {
                $push: {
                    preferenceHistory: {
                        $each: [{ cafeId, weight: 1, addedAt: new Date() }],
                        $slice: -100
                    }
                }
            }, { runValidators: false });

            const updatedUser = await User.findById(userId).select('+preferenceHistory');
            const cafeMap = await buildCafeEmbeddingMap(updatedUser.preferenceHistory);
            const historyItems = buildHistoryItems(updatedUser.preferenceHistory, cafeMap);
            const newEmbedding = vectorService.computeUserEmbedding(historyItems);
            if (newEmbedding.length === 0) return;

            await User.findByIdAndUpdate(userId, {
                preferenceEmbedding: newEmbedding,
                preferenceEmbeddingUpdatedAt: new Date()
            }, { runValidators: false });

            console.log(`✅ 高分评论触发偏好向量更新 (用户: ${userId})`);
        } catch (e) {
            console.error('❌ 评论触发偏好更新失败:', e.message);
        }
    });
```

- [ ] **Step 3: Add helper functions at the bottom of `reviewController.js`**

```js
// ============================================
// 偏好向量计算辅助函数（与 userController.js 相同）
// ============================================

async function buildCafeEmbeddingMap(history) {
    const ids = history.map(h => h.cafeId);
    const cafes = await Cafe.find({ _id: { $in: ids } }).select('+embedding');
    const map = new Map();
    cafes.forEach(c => {
        if (c.embedding && c.embedding.length === 384) {
            map.set(c._id.toString(), c.embedding);
        }
    });
    return map;
}

function buildHistoryItems(history, cafeMap) {
    return history
        .map(h => ({
            embedding: cafeMap.get(h.cafeId.toString()),
            weight: h.weight,
            addedAt: h.addedAt
        }))
        .filter(h => h.embedding);
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/server/controllers/reviewController.js
git commit -m "feat: update user preferenceEmbedding on high-rated review (non-blocking)"
```

---

## Chunk 5: Backfill Script + Frontend

### Task 15: Create backfill script

**Files:**
- Create: `backend/server/seeds/generate_embeddings.js`

Run this once after deployment. Idempotent — only processes cafes where `embeddingUpdatedAt` is null.

- [ ] **Step 1: Create the script**

```js
// ============================================
// SipSpot - Cafe Embedding Backfill Script
// 为所有现有咖啡馆生成 embedding（一次性运行）
// 用法: node backend/server/seeds/generate_embeddings.js
// 或:   cd backend && npm run generate-embeddings
// ============================================

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Cafe = require('../models/cafe');
const embeddingService = require('../services/embeddingService');

const BATCH_SIZE = 10;

async function run() {
    // 1. 连接数据库
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/sip-spot';
    await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ 数据库已连接');

    // 2. 加载 embedding 模型
    try {
        await embeddingService.init();
    } catch (err) {
        console.error('❌ Embedding 模型加载失败，终止脚本:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    }

    // 3. 查找未处理的咖啡馆（idempotent：只处理 embeddingUpdatedAt 为 null 的）
    const cafes = await Cafe.find({
        isActive: true,
        embeddingUpdatedAt: null
    }).select('name description amenities specialty vibe');

    const total = cafes.length;
    console.log(`\n📋 找到 ${total} 个待处理的咖啡馆\n`);

    if (total === 0) {
        console.log('✅ 所有咖啡馆已有 embedding，无需处理');
        await mongoose.disconnect();
        return;
    }

    // 4. 分批处理
    let successCount = 0;
    const failed = [];

    for (let i = 0; i < cafes.length; i += BATCH_SIZE) {
        const batch = cafes.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (cafe) => {
            try {
                const text = embeddingService.buildCafeText(cafe);
                const embedding = await embeddingService.generateEmbedding(text, 'passage');
                await Cafe.findByIdAndUpdate(cafe._id, {
                    embedding,
                    embeddingUpdatedAt: new Date()
                });
                successCount++;
                process.stdout.write(`\r⏳ 进度: ${successCount + failed.length}/${total}`);
            } catch (err) {
                failed.push({ name: cafe.name, error: err.message });
                console.error(`\nFAILED: ${cafe.name} — ${err.message}`);
            }
        }));
    }

    // 5. 打印摘要
    console.log(`\n\n✅ 完成！成功: ${successCount}/${total}. 失败: ${failed.length}`);
    if (failed.length > 0) {
        console.log('失败列表:');
        failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
    }

    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
}

run().catch(err => {
    console.error('脚本执行失败:', err);
    process.exit(1);
});
```

- [ ] **Step 2: Add npm script to `backend/package.json`**

In the `scripts` section, add:

```json
"generate-embeddings": "node server/seeds/generate_embeddings.js"
```

- [ ] **Step 3: Run the backfill**

```bash
cd backend && npm run generate-embeddings
```

Expected output:
```
✅ 数据库已连接
⏳ 正在加载 multilingual-e5-small embedding 模型...
✅ Embedding 模型加载完成
📋 找到 N 个待处理的咖啡馆
⏳ 进度: N/N
✅ 完成！成功: N/N. 失败: 0
✅ 数据库连接已关闭
```

- [ ] **Step 4: Verify embeddings were saved**

```bash
cd backend && node -e "
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sip-spot').then(async () => {
    const Cafe = require('./server/models/cafe');
    const count = await Cafe.countDocuments({ embeddingUpdatedAt: { \$ne: null } });
    const total = await Cafe.countDocuments({ isActive: true });
    console.log('Cafes with embeddings:', count, '/', total);
    mongoose.disconnect();
});
"
```

Expected: all active cafes have embeddings.

- [ ] **Step 5: Commit**

```bash
git add backend/server/seeds/generate_embeddings.js backend/package.json
git commit -m "feat: add cafe embedding backfill script (idempotent, batch processing)"
```

---

### Task 16: Update `AISearchPage.jsx` — async explain loading

**Files:**
- Modify: `frontend/src/pages/AISearchPage.jsx`

- [ ] **Step 1: Read `frontend/src/pages/AISearchPage.jsx`**

Understand the current component structure: where search results are rendered, where state is declared, and how the main search call is made.

- [ ] **Step 2: Add explanation state variables**

At the top of the component function, alongside existing state:

```jsx
const [explanation, setExplanation] = useState(null);
const [explanationLoading, setExplanationLoading] = useState(false);
```

- [ ] **Step 3: Trigger the explain call after results arrive**

After the main search API call succeeds and cafes are set, add:

```jsx
// 异步加载 Qwen 解释（不阻塞搜索结果显示）
if (data.cafes && data.cafes.length > 0) {
    setExplanationLoading(true);
    setExplanation(null);
    api.post('/cafes/ai-search/explain', {
        query: searchQuery,
        cafeNames: data.cafes.slice(0, 5).map(c => c.name)
    })
    .then(res => {
        if (res.data.explanation) setExplanation(res.data.explanation);
    })
    .catch(() => {
        // 失败时静默处理，不显示错误
    })
    .finally(() => setExplanationLoading(false));
}
```

- [ ] **Step 4: Add explanation UI in JSX**

Above the results list, add:

```jsx
{/* AI 解释区域（异步加载，不阻塞主结果） */}
{(explanationLoading || explanation) && (
    <div className="card p-4 mb-4 bg-amber-50 border border-amber-200">
        {explanationLoading ? (
            <div className="flex items-center gap-2 text-amber-700">
                <span className="spinner" />
                <span className="text-sm">AI 正在分析搜索结果...</span>
            </div>
        ) : (
            <p className="text-amber-800 text-sm">{explanation}</p>
        )}
    </div>
)}
```

- [ ] **Step 5: Test in browser**

1. `cd frontend && npm run dev`
2. Navigate to the AI search page
3. Search for `安静可以工作的咖啡馆`
4. Verify: results appear immediately; explanation loads 1-3s later with a spinner

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/AISearchPage.jsx
git commit -m "feat: add async AI explanation loading to AISearchPage"
```

---

## Final Verification

- [ ] **End-to-end semantic search**

```bash
curl -X POST http://localhost:5001/api/cafes/ai-search \
  -H 'Content-Type: application/json' \
  -d '{"query":"安静可以工作有WiFi"}' | jq '{mode: .mode, count: .count}'
# Expected: { "mode": "semantic", "count": 10 }
```

- [ ] **Verify rate limiting on explain**

```bash
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5001/api/cafes/ai-search/explain \
    -H 'Content-Type: application/json' \
    -d '{"query":"test","cafeNames":["cafe1"]}'
done
# First 10: 200, 11th+: 429
```

- [ ] **Verify fallback still works**

With server running, temporarily comment out the `embeddingService.isReady()` check and force it to return `false` via `isReady() { return false; }`. Search should return `mode: "keyword"`.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete semantic search + RAG recommendations implementation"
```
