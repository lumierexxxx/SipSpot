# 第四章 系统实现

## 4.1 开发环境与技术栈

本系统采用 MERN 全栈架构，结合本地化部署的语义向量模型与云端大语言模型 API，形成一套面向中文用户的咖啡馆发现与推荐平台。表4-1列出了系统各层次使用的核心技术及其用途。

**表4-1 系统技术栈**

| 层次 | 技术/工具 | 版本 | 用途 |
|------|----------|------|------|
| 后端运行时 | Node.js | 16+ | 服务器运行环境 |
| 后端框架 | Express.js | 4.x | REST API 框架 |
| 数据库 | MongoDB + Mongoose | 7.x | 数据持久化 + ODM |
| 语言 | TypeScript | 5.x | 类型安全（后端核心模块 controllers、services、models 均已迁移至 TypeScript；部分早期编写的路由文件如 recommendations.js 仍保留 CommonJS 格式，属于渐进式迁移中的历史遗留） |
| 前端框架 | React | 19 | UI 组件库 |
| 构建工具 | Vite | 5.x | 前端构建 + 开发服务器 |
| 样式 | TailwindCSS | v4 | 原子化 CSS |
| 路由 | React Router | 7 | 前端路由 |
| HTTP 客户端 | Axios | 1.x | API 请求 |
| AI 模型 | multilingual-e5-base | - | 文本向量化 |
| AI API | 通义千问（Qwen Plus） | - | 情感分析/文本生成 |
| 地图 | 高德地图 AMap | - | 地理位置展示 |
| 图片存储 | Cloudinary | - | 图片上传与 CDN |

后端代码按职责组织于 `backend/server/` 目录下，包含 `controllers/`（路由处理器）、`models/`（Mongoose 数据模型）、`services/`（AI、向量、邮件等业务服务）、`routes/`（路由定义）、`middleware/`（鉴权中间件）和 `utils/`（错误类、校验、响应辅助函数）六个子目录。前端代码组织于 `frontend/src/` 目录下，包含 `components/`（可复用 UI 组件）、`pages/`（路由级页面）、`services/`（API 调用封装）、`contexts/`（全局状态）和 `hooks/`（自定义 React Hook）五个子目录，形成清晰的分层架构。

---

## 4.2 AI 模块实现

AI 模块是本系统的核心创新点，由三个相互协作的子模块构成：本地化 Embedding 服务、向量数学服务和通义千问情感分析服务。三者共同支撑语义搜索与个性化推荐功能的实现。

### 4.2.1 Embedding 服务实现

Embedding 服务（`embeddingService.ts`）负责将文本转换为高维语义向量，是语义搜索的基础设施层。

**单例模式与启动预热**

模型加载耗时较长且占用约 280MB 内存，为避免每次请求时重复加载，服务采用模块级单例模式管理模型实例。`_pipeline` 和 `_ready` 两个模块级变量分别持有 pipeline 实例及其就绪状态。服务器启动时主动调用 `init()` 函数完成一次性预热，后续所有请求复用同一个 pipeline 实例，彻底消除了重复加载开销。`isReady()` 函数供调用方在请求处理前检查模型可用性，当模型未就绪时，上层服务将自动降级为关键词搜索路径。

**ESM 动态导入兼容处理**

`@xenova/transformers` 是一个纯 ESM 包（ECMAScript Modules），在本项目所使用的 CommonJS/TypeScript 编译环境中无法通过 `require()` 静态引入。为解决此兼容性问题，`init()` 函数内部采用动态 `import()` 语法完成异步加载：

```typescript
const { pipeline } = await import('@xenova/transformers');
_pipeline = await pipeline(
    'feature-extraction',
    'Xenova/multilingual-e5-base'
);
```

该方式将模块加载推迟至运行时，绕过了 CommonJS 与 ESM 的静态分析冲突，是在混合模块环境中引入 ESM 包的标准工程实践。

**query/passage 前缀策略**

`multilingual-e5-base` 模型在训练时遵循 E5 系列的对比学习规范，要求查询文本（用于搜索的短句）添加 `"query: "` 前缀，而被检索的文档文本添加 `"passage: "` 前缀，此区分对向量召回精度有显著影响。`generateEmbedding(text, type)` 函数根据 `type` 参数自动拼接前缀，调用方无需手动处理：

```typescript
const prefixed = type === 'query'
    ? `query: ${text}`
    : `passage: ${text}`;
const output = await _pipeline(prefixed, {
    pooling: 'mean',
    normalize: true
});
```

模型通过均值池化（mean pooling）将所有 token 的隐状态取均值，生成句子级语义表示，最终输出 768 维 Float32 归一化向量。`buildCafeText()` 辅助函数将咖啡馆的名称、描述（截断至 400 字符以防超出 512 token 限制）、设施列表、特色品类和氛围标签拼接为 passage 文本，确保向量编码包含尽量完整的语义信息。

### 4.2.2 向量搜索实现

向量数学服务（`vectorService.ts`）是一个无外部依赖的纯函数模块，封装了余弦相似度计算、咖啡馆语义排序和用户偏好向量更新三项核心能力。

**余弦相似度计算**

余弦相似度衡量两个向量之间的夹角余弦值，取值范围为 −1 到 1，越接近 1 表示语义越相似。`cosineSimilarity(a, b)` 函数实现如下：

```typescript
function cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot  += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}
```

函数内置了向量为空或长度不匹配时返回 0 的防御性检查，保证在数据不完整的情况下不会引发运行时异常。

**rankCafes() 排序流程**

`rankCafes(queryEmb, cafes, options)` 接收查询向量和候选咖啡馆数组，首先过滤掉未生成 embedding 字段（或维度不为 768）的记录，随后对每个候选咖啡馆调用 `cosineSimilarity` 计算语义得分。此外，函数支持设施增强（amenityBoost）功能：当查询命中某个候选咖啡馆具备的中文设施名称时，每匹配一项额外加 0.1 分，最多累加 0.3 分，以补偿纯向量相似度对显式设施偏好的表达不足。得分超过 1.0 时截断，最终按得分降序返回 Top-K 结果（默认取前 10 条）。

**computeUserEmbedding() 偏好向量算法**

`computeUserEmbedding(historyItems)` 依据用户的历史行为（评论和收藏的咖啡馆 embedding）计算其综合偏好向量。算法逻辑如下：首先按时间降序排列所有有效行为记录，截取最近 30 条作为滑动窗口；然后对每条记录施加指数衰减权重，时间倒序索引为 `i` 的记录的有效权重为 `item.weight × 0.85^i`，即最新记录（`i=0`）权重最高，越旧的记录影响越小；最后对所有加权向量求和并做 L2 归一化，得到单位长度的偏好向量：

```typescript
window.forEach((item, index) => {
    const decay = Math.pow(0.85, index);
    const effectiveWeight = item.weight * decay;
    totalWeight += effectiveWeight;
    for (let i = 0; i < dim; i++) {
        avg[i] += item.embedding[i] * effectiveWeight;
    }
});
const weighted = avg.map(v => v / totalWeight);
return normalizeVector(weighted);
```

为避免每次用户行为后都触发高代价的向量重计算，`shouldUpdatePreference()` 函数实现了 1 分钟节流检查：若距离上次更新不足 60 秒，则跳过本次计算，有效限制了高频操作场景下的性能损耗。偏好向量计算完成后，由 `reviewController.ts` 和 `userController.ts` 分别在用户提交评论和触发收藏操作后调用，将结果持久化至 `user.preferenceEmbedding` 字段。

### 4.2.3 通义千问情感分析实现

情感分析服务（`aiService.ts`）采用"云端大模型优先、本地规则降级"的双层架构，在保证分析质量的同时兼顾了 API 不可用时的系统健壮性。

**analyzeReview() 调用链**

`analyzeReview(content, cafeName)` 是情感分析的统一入口。函数首先检查环境变量 `QWEN_API_KEY` 是否已配置：若已配置则调用 `analyzeWithQwen()` 进行云端分析；若未配置或调用过程中抛出异常，则捕获错误并自动降级至本地的 `basicSentimentAnalysis()`，确保评论提交流程不因 AI 服务异常而中断。

**analyzeWithQwen() 实现**

`analyzeWithQwen()` 向通义千问 DashScope API 发送 POST 请求，使用 `qwen-plus` 模型，`temperature` 设置为 0.4 以确保输出的稳定性，超时时间为 15 秒。系统提示（system prompt）明确要求模型"请始终返回有效的JSON格式，不要添加额外的解释或markdown标记"，以防止大语言模型在 JSON 内容外附加 markdown 代码围栏（```` ```json ```` 等），从而污染后续的 `JSON.parse()` 解析。尽管如此，代码中仍保留了对 markdown 代码块标记的清洗逻辑作为防御性措施：

```typescript
const cleanedText = generatedText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
const result = JSON.parse(cleanedText);
```

模型返回结果包含情感倾向（positive/negative/neutral）、3—5 个关键词、一句话总结和置信度四个字段，函数对每个字段做类型校验和范围截断后返回标准化结构。

**generateCafeSummary() 聚合摘要**

`generateCafeSummary(cafeId, reviews)` 调用 `analyzeBulkReviews()` 对该咖啡馆的所有评论并行执行情感分析，统计 positive/negative/neutral 三种情感的计数分布，并提取出现频率最高的前 10 个关键词。随后根据情感分布的主导方向，拼接生成一段纯文本摘要字符串（如"基于 23 条评论，顾客普遍给予好评（78% 好评率）。常提到的关键词：环境、咖啡、安静……"），此摘要不二次调用 Qwen，仅基于统计结果生成，避免了不必要的 API 消耗。

**basicSentimentAnalysis() 降级路径**

本地降级分析基于中英文关键词词典匹配实现。正向词典包含约33个词条（中文19个，英文14个），负向词典包含约28个词条（中文17个，英文11个）。统计文本中命中的正负向词条数量：正向词更多则判定为 positive，负向词更多则为 negative，否则为 neutral，基准置信度设为 0.6，随命中差值线性提升，最高不超过 0.9。

### 4.2.4 推荐引擎实现

推荐控制器（`recommendationController.ts`）将向量服务与用户模型整合为完整的推荐流水线，支持向量路径与规则路径双轨运行。

**getRecommendations() 向量推荐路径**

`getRecommendations()` 处理 `GET /api/recommendations` 请求。函数首先加载当前用户并携带 `preferenceEmbedding` 字段（该字段在 Mongoose schema 中默认不返回，需显式 `select('+preferenceEmbedding')`）。若用户的偏好向量维度达到 768，则进入向量推荐路径：从 MongoDB 中查询所有活跃且已生成 embedding 的咖啡馆（同时过滤掉用户已收藏的记录），调用 `vectorService.rankCafes()` 完成语义排序，将相似度得分乘以 100 转换为百分制展示，相似度高于 0.7 的结果标记为 `personalized` 类型，其余标记为 `general`：

```typescript
if (user.preferenceEmbedding && user.preferenceEmbedding.length >= 768) {
    const ranked = vectorService.rankCafes(
        user.preferenceEmbedding,
        candidates,
        { topK: parseInt(limit as string) }
    );
    const recommendations = ranked.map(({ cafe, similarityScore }) => ({
        cafe,
        score: Math.round(similarityScore * 100),
        type: similarityScore >= 0.7 ? 'personalized' : 'general'
    }));
}
```

**降级规则推荐路径**

当用户尚未积累足够的行为数据（偏好向量不存在）时，系统自动降级至规则推荐路径，根据用户的历史评分偏好、收藏的咖啡馆特征及设施偏好，通过规则匹配筛选候选咖啡馆，保证新用户也能获得有意义的推荐结果。

**getExploreRecommendations() 探索推荐**

探索推荐功能面向希望尝试新品类的用户。函数按咖啡 specialty 分组，提取用户尚未评价过的品类（如"手冲咖啡 Pour Over"、"单品咖啡 Single Origin"等），在每个未探索品类内选出评分最高的咖啡馆，组合返回多样化的探索推荐列表，帮助用户突破已有偏好的局限。

---

## 4.3 后端关键实现

### 4.3.1 JWT 认证中间件

认证中间件（`middleware/auth.js`）提供 `protect` 和 `optionalAuth` 两种形式。`protect` 中间件从请求头 `Authorization: Bearer` 或 `req.cookies.token` 提取 JWT token（优先读取请求头），再调用 `jwt.verify()` 验证签名和有效期，验证通过后将解码后的用户信息挂载至 `req.user`，供后续控制器直接使用；验证失败则通过 `next(new ExpressError('未授权', 401))` 终止请求链。`optionalAuth` 采用相同逻辑，但验证失败时不报错，仅将 `req.user` 设为 `null`，允许匿名用户访问可选鉴权的路由（如查看咖啡馆详情）。`authorize(roles)` 中间件在 `protect` 之后调用，检查 `req.user.role` 是否属于允许的角色列表，实现基于角色的访问控制。

### 4.3.2 地理位置查询

附近咖啡馆查询功能基于 MongoDB 的地理空间索引实现。Cafe 模型中 `geometry` 字段采用 GeoJSON `Point` 类型存储经纬度坐标，并在该字段上创建 `2dsphere` 索引。查询时使用 `$nearSphere` 操作符，按距离升序返回指定半径内的咖啡馆：

```javascript
geometry: {
    $nearSphere: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius
    }
}
```

MongoDB 原生地理空间查询引擎直接在数据库层完成距离过滤与排序，无需在应用层遍历全量数据计算距离，查询效率随数据规模线性可控。

### 4.3.3 图片上传

图片上传采用 `multer-storage-cloudinary` 实现内存流式直传。用户上传的图片文件由 multer 在内存中缓冲后，直接通过 Cloudinary Node.js SDK 的流式接口上传至 Cloudinary CDN，全程不在服务器本地磁盘写入任何临时文件，规避了磁盘 I/O 瓶颈和文件残留问题。上传完成后，Cloudinary 返回包含 `url` 和 `filename`（即 publicId）的响应对象，两者均存入 `Cafe.images[]` 数组，其中 publicId 用于后续的图片删除操作。图片文件大小上限通过环境变量 `VITE_MAX_IMAGE_SIZE`（默认 5MB）在前端和后端双重校验。

---

## 4.4 前端关键实现

### 4.4.1 AuthContext 全局认证状态

前端采用 React Context 结合 `useState` 管理全局认证状态，将用户信息、登录状态和相关操作集中封装于 `AuthContext`。所有需要访问认证状态的组件通过 `useAuth()` Hook 取得所需数据，彻底消除了跨层级组件间的 prop drilling 问题。应用初始化时，Context 从 `localStorage` 中读取已持久化的用户对象（仅含非敏感字段）完成状态恢复；JWT token 由后端 JSON 响应体返回，前端负责存储管理；用户对象持久化至 `localStorage`，刷新页面后状态恢复。用户登录时同步更新 `localStorage` 和 Context 状态，登出时清除二者，保持状态一致性。

### 4.4.2 Axios 拦截器 Token 刷新队列

`api.js` 中的响应拦截器实现了并发安全的 Token 自动刷新机制。当某个请求收到 401 响应时，拦截器首先检查 `isRefreshing` 标志位：若已有刷新请求正在进行，则将当前失败的请求封装为 Promise 压入 `failedQueue` 队列挂起等待；若尚未刷新，则将 `isRefreshing` 置为 `true`，向 `/api/auth/refresh` 发起刷新请求（refreshToken 由浏览器自动携带于 Cookie 中，无需手动传递）：

```javascript
if (isRefreshing) {
    return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
    }).then(() => api(originalRequest));
}
originalRequest._retry = true;
isRefreshing = true;
const { default: axios } = await import('axios');
await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
processQueue(null);
isRefreshing = false;
return api(originalRequest);
```

刷新成功后，`processQueue(null)` 遍历 `failedQueue` 逐一 resolve 所有挂起请求，各请求随即使用服务端已通过 Set-Cookie 更新的新 Token 重新发起。刷新失败时则调用 `processQueue(refreshError)` 整体 reject，清除 `localStorage` 中的用户信息并将用户重定向至登录页。该队列机制有效防止了多个并发请求同时失效时触发多次 refresh 的竞态条件。

### 4.4.3 AI 搜索页面

AI 语义搜索页面（`AISearchPage`）提供自然语言搜索入口，用户输入如"适合安静工作的手冲咖啡馆"此类描述性文本，前端调用 `/api/cafes/ai-search` 接口，后端经 Embedding 服务将查询文本向量化，通过 `vectorService.rankCafes()` 在咖啡馆向量库中检索语义最近邻，返回带相似度得分的结果列表。前端在每张结果卡片上展示归一化后的相关度百分比，使用户能够直观感知当前结果与查询意图的匹配程度，相较于传统关键词搜索提供了更贴近自然语言习惯的搜索体验。
