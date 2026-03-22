# 第三章 系统设计

## 3.1 总体架构设计

本系统采用前后端分离的三层架构，前端基于 React 19 构建单页应用（SPA），后端基于 Node.js/Express 提供 REST API，数据库采用 MongoDB，并在后端服务层内置专用的 AI 子系统。各层之间通过标准 HTTP 协议通信，前端开发阶段由 Vite 开发服务器将 `/api` 路径代理至后端，生产环境下通过反向代理完成同等路由转发。

```
┌─────────────────────────────────────┐
│           前端（React 19）           │
│  Vite Dev Server / 生产构建          │
│  React Router 7 / TailwindCSS v4    │
├─────────────────────────────────────┤
│         HTTP / Axios（代理）          │
├─────────────────────────────────────┤
│      后端（Node.js / Express）        │
│  REST API / JWT 认证 / Joi 校验      │
├──────────┬──────────────────────────┤
│ MongoDB  │       AI 服务层           │
│ Mongoose │  embeddingService         │
│ GeoJSON  │  vectorService            │
│          │  aiService（Qwen）         │
└──────────┴──────────────────────────┘
```

**前端层**负责用户界面的渲染与交互，通过 Axios 实例封装所有 API 调用，内置响应拦截器实现 Token 自动刷新与并发请求队列化。React Router 7 提供客户端路由，TailwindCSS v4 基于 `@theme` 设计令牌系统统一视觉风格。

**后端层**承担业务逻辑、认证鉴权与数据校验。所有路由处理器遵循控制器—服务—模型三层分工，请求入参由 Joi Schema 统一校验，响应格式标准化为 `{ success, message, data?, pagination? }`。express-rate-limit、helmet 与 express-mongo-sanitize 构成安全防护体系。

**数据层**采用 MongoDB 存储结构化业务数据，Mongoose 提供 ODM 映射与 Schema 约束，咖啡馆位置信息以 GeoJSON Point 格式存储，支持 MongoDB 原生的 `$near` 地理查询。

**AI 服务层**是本系统的核心差异化模块，由三个相互协作的服务构成：`embeddingService` 负责加载并托管 multilingual-e5-base 本地推理模型；`vectorService` 提供纯数学的余弦相似度计算、咖啡馆排序与用户偏好向量计算；`aiService` 封装通义千问 API 调用，实现评论情感分析与咖啡馆文案生成。三个服务均被控制器层直接调用，彼此职责分离、可独立测试。

---

## 3.2 AI 子系统设计

### 3.2.1 语义搜索管道设计

**技术选型**：本系统选用 `Xenova/multilingual-e5-base`（通过 `@xenova/transformers` 在 Node.js 中本地运行）作为文本向量化模型。该模型支持 100 余种语言，输出 768 维稠密向量，模型文件约 280 MB，首次启动时自动下载并缓存。选型依据如下：其一，面向中国市场的平台需同时处理中文、英文及中英混合查询，multilingual-e5-base 在多语言检索基准上表现稳定；其二，本地推理无需调用外部 API，无额外费用且无网络延迟；其三，768 维向量在搜索精度与存储开销之间取得合理平衡。

语义搜索的完整数据流如下：

```
用户查询文本
    ↓
generateEmbedding(text, 'query')
（内部自动添加 "query: " 前缀）
    ↓
768 维查询向量
    ↓
vectorService.rankCafes(queryVec, cafes)
（从 MongoDB 取出所有含 embedding 字段的咖啡馆）
（逐一计算余弦相似度，可选 amenity boost +0.1/匹配，上限 +0.3）
    ↓
按相似度降序排序 → Top-K 结果返回
```

**E5 前缀机制**：multilingual-e5-base 遵循 E5 检索协议，要求查询文本以 `"query: "` 为前缀、文档文本以 `"passage: "` 为前缀，以提高检索精度。`generateEmbedding(text, type)` 函数内部根据 `type` 参数自动添加对应前缀，调用方无需关心此细节。向量生成时采用均值池化（mean pooling）与 L2 归一化，确保输出向量模长为 1，后续余弦相似度计算可直接转化为点积运算。

**降级策略**：服务器启动时调用 `init()` 异步预热模型。若模型加载失败（如首次运行时网络中断），`isReady()` 返回 `false`，系统自动回退至基于正则表达式的关键字匹配搜索，保证核心搜索功能在 AI 不可用时仍正常运作。

**架构决策——应用层排序 vs. 数据库端向量检索**：当前实现在 Node.js 应用层完成余弦相似度计算与排序，而非使用 MongoDB Atlas Vector Search 等数据库端向量索引。这一选择基于两点考量：第一，当前咖啡馆数据量在百至千量级，全量加载入内存后在应用层排序的耗时完全可接受；第二，应用层实现不依赖特定云服务，便于本地开发与部署。待数据规模增长至应用层排序出现性能瓶颈时，可平滑迁移至 MongoDB Atlas Vector Search 或 Milvus 等专用向量数据库，`rankCafes` 函数的接口约定无需改动。

### 3.2.2 向量存储设计

咖啡馆的语义向量存储于 MongoDB Cafe 文档的 `embedding` 字段中，数据类型为 768 维 Float32 数值数组。向量在咖啡馆入库或信息更新时生成，具体过程由 `buildCafeText(cafe)` 函数将咖啡馆的结构化字段拼接为自然语言文本，再调用 `generateEmbedding(cafeText, 'passage')` 生成对应的 passage 向量。拼接规则为：

```
cafeText = cafeName + description（截断至 400 字符）
         + amenities（空格连接）
         + specialty + vibe
```

description 截断至 400 字符的设计是为避免超出模型的 512 token 上下文限制，同时保留对检索最有价值的核心描述信息。

**余弦相似度公式**在 `vectorService.cosineSimilarity(a, b)` 中以纯 JavaScript 实现：

```
cosine(A, B) = (A · B) / (|A| × |B|)
             = Σ(Aᵢ × Bᵢ) / (√Σ(Aᵢ²) × √Σ(Bᵢ²))
```

实现中对分母为零的情况进行了保护（返回 0），对维度不匹配的情况同样返回 0 并跳过。由于 `generateEmbedding` 在生成时已归一化，查询向量与 passage 向量的模长均为 1，余弦相似度在数值上等同于点积，但实现中仍保留完整的分母计算以确保健壮性。

`rankCafes` 函数额外支持 `amenityBoost` 参数，接受英文枚举键数组（与 Cafe 模型的 amenities 字段保持一致，如 `wifi`、`power_outlet`），在余弦相似度基础上为命中设施的咖啡馆额外加分（每个匹配+0.1，上限+0.3），以便在语义相似度基础上融入结构化过滤信号，最终得分截断至 1.0。

注：代码注释中存在 amenityBoost 参数描述为中文字符串的历史遗留问题，属于已知待修复缺陷（Known Issue）。

**扩展路径**：当单节点应用层排序成为性能瓶颈时，可将 `embedding` 字段迁移至 MongoDB Atlas Vector Search 的向量索引，或将向量数据独立存入 Milvus、Qdrant 等专用向量数据库。届时仅需替换 `rankCafes` 的底层实现，上游控制器代码无需修改。

### 3.2.3 通义千问 API 集成设计

`aiService` 模块封装了对阿里云通义千问（Qwen）API 的所有调用，对外暴露四个主要函数，均具备完整的错误处理与降级机制。

**评论情感分析**（`analyzeReview` / `analyzeWithQwen`）：

- 输入：评论文本 + 咖啡馆名称
- 模型：qwen-plus，temperature=0.4（低温度保证 JSON 格式稳定性）
- 输出 JSON 结构：`{ sentiment, keywords, summary, confidence }`
  - `sentiment`：positive / negative / neutral 三值枚举
  - `keywords`：3-5 个关键词数组
  - `summary`：不超过 50 字的一句话总结
  - `confidence`：0-1 区间的置信度浮点数

**Prompt 工程设计**：系统提示明确要求"请始终返回有效的JSON格式，不要添加额外的解释或markdown标记"，确保响应可直接被 `JSON.parse()` 解析。针对 Qwen 偶发性地在 JSON 外包裹 markdown 代码块的情况，实现中增加了正则清洗步骤（去除 ` ```json ` 和 ` ``` ` 标记）。

**两类摘要生成函数的区分**是本模块的重要设计决策：

- `generateCafeSummary(cafeId, reviews)`：调用 `analyzeBulkReviews()` 对评论集合进行本地情感聚合，统计好评率与高频关键词，生成纯文本摘要字符串，**不调用 Qwen API**，适合批量处理场景。该函数返回一段纯文本，格式为"基于N条评论，顾客普遍给予好评（XX%好评率）。常提到的关键词：...。"
- `generateCafeDescription(cafeName, cafeData, reviews)`：调用 Qwen API，基于咖啡馆基础信息与近期评论片段，生成 80-120 字的自然语言简介，temperature=0.7 以保证文本多样性。

**降级设计**：当 `QWEN_API_KEY` 未配置或 API 调用超时（15 秒）时，系统自动切换至 `basicSentimentAnalysis()` 本地降级函数。该函数内置中英文正向词典（约 14 个正向词）与负向词典（约 11 个负向词），通过关键词计数判断情感倾向，confidence 基准值为 0.6，随正负词差值线性增长（上限 0.9）。

### 3.2.4 个性化推荐引擎设计

推荐引擎采用双路径架构，根据用户是否已建立偏好向量自动选择对应策略：

```
GET /api/recommendations
        ↓
读取 user.preferenceEmbedding
        ↓
  ┌──────────────┬────────────────────┐
  │ 存在（768维） │   不存在（新用户）   │
  ↓              ↓
向量路径          规则路径
vectorService     加权评分算法
.rankCafes()      (amenity频率×6，上限30 +
                  specialty命中×20 +
                  价格匹配×15，轻微偏差×8 +
                  评分 Math.min(20, rating×4) +
                  热度 Math.min(15, reviewCount) +
                  未访问加成+5)
```

**偏好向量计算**（`computeUserEmbedding`）：

用户每次提交评论或更新收藏后，系统触发偏好向量更新。具体算法取用户近 30 条行为记录（按时间降序排列），对每条记录的咖啡馆 embedding 施加指数衰减权重：

```
effectiveWeight_i = item.weight × 0.85^i
（i 为时间倒序索引，i=0 为最新记录，权重最高）
```

加权求和后除以总权重得到加权平均向量，再经 L2 归一化得到 768 维偏好向量，持久化至 `user.preferenceEmbedding`。衰减因子 0.85 的选择使得最新行为的影响力约为 10 条前行为的 2 倍，既能快速响应用户近期偏好变化，又保留一定的历史稳定性。为避免频繁写入，`shouldUpdatePreference()` 函数实施 1 分钟节流，在此时间窗内重复触发的更新请求将被跳过。

**规则路径**（新用户冷启动）：新用户尚无历史行为，`preferenceEmbedding` 为空，系统切换至基于统计频率的加权评分算法。规则路径加权评分算法各项权重如下：

- 设施匹配（amenity）：每命中一个 +6分，上限30分
- 特色种类（specialty）：命中偏好种类 +20分
- 价格匹配：价格区间符合 +15分，轻微偏差 +8分
- 综合评分：`Math.min(20, cafe.rating × 4)`，上限20分
- 热度（评论数）：`Math.min(15, cafe.reviewCount)`，上限15分
- 未访问加成：对用户未浏览过的咖啡馆 +5分（鼓励探索）

分别统计用户历史评论和收藏中的设施频率（收藏权重加倍）、咖啡种类偏好及消费价格分布，综合打分后排序。该算法并将已收藏的咖啡馆从候选集中排除。

**探索推荐**（`/api/recommendations/explore`）：为防止推荐结果同质化，探索推荐按咖啡种类（specialty）分组，在用户尚未评价过的种类中各选出评分最高的代表性咖啡馆，引导用户发现新类型的咖啡馆体验。

**偏好向量更新时机**：更新操作分别嵌入在 reviewController（用户提交评论时）和 userController（用户切换收藏状态时），确保偏好向量随用户行为实时演化，无需独立的批处理任务。

---

## 3.3 数据库设计

本系统采用 MongoDB 文档型数据库，通过 Mongoose 定义三个核心模型：User（用户）、Cafe（咖啡馆）、Review（评论）。三者之间的关联关系如下：User 与 Cafe 通过 `favorites[]` 字段构成多对多关系（用户收藏多家咖啡馆，咖啡馆可被多名用户收藏）；User 与 Review 为一对多关系，Review 的 `author` 字段引用 User；Cafe 与 Review 为一对多关系，Review 的 `cafe` 字段引用 Cafe，Cafe 的 `reviews[]` 数组同时存储反向引用（双向引用，需保持同步）。

**User 模型**核心字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| username | String | 用户名，唯一 |
| email | String | 邮箱，唯一，用于登录与邮件通知 |
| password | String | bcrypt 哈希存储，saltRounds=10 |
| favorites[] | [ObjectId → Cafe] | 收藏的咖啡馆引用数组 |
| preferenceEmbedding | [Number] | 768 维用户偏好向量，由行为数据动态更新 |
| preferenceEmbeddingUpdatedAt | Date | 偏好向量最近更新时间，用于节流控制 |
| preferences.manual | Object | 用户手动设置的偏好（mustHaveAmenities、avoidAmenities） |

**Cafe 模型**核心字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 咖啡馆名称 |
| description | String | 文字描述 |
| geometry | GeoJSON Point | 经纬度坐标，支持 `$near` 地理查询 |
| embedding | [Number] | 768 维语义向量，由 buildCafeText 生成 |
| amenities | [String] | 英文枚举键数组，如 `wifi`、`power_outlet`、`quiet`、`outdoor_seating` |
| specialty | String | 咖啡种类，如"手冲咖啡 Pour Over" |
| vibe | String | 氛围标签，参与 embedding 拼接 |
| reviews[] | [ObjectId → Review] | 评论引用数组（双向引用） |
| averageRating | Number | 综合评分，由评论聚合计算 |
| aiSummary | String | 由 generateCafeSummary 生成的评论摘要 |
| price | Number | 人均消费等级（1-5） |

**Review 模型**核心字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| cafe | ObjectId → Cafe | 所属咖啡馆引用 |
| author | ObjectId → User | 评论作者引用 |
| content | String | 评论正文 |
| rating | Number | 综合评分，0.5 步长，范围 1-5 |
| multiDimRatings | Object | 多维度评分：taste / price / environment / service / workspace，各自 0.5 步长 |
| aiAnalysis | Object | Qwen 情感分析结果：`{ sentiment, keywords, summary, confidence }` |

**设计要点**：`preferenceEmbedding` 与 `embedding` 均以普通 Number 数组存储，MongoDB 无需特殊索引即可读取全量向量供应用层排序。GeoJSON Point 格式存储位置信息，配合 MongoDB 的 `2dsphere` 索引支持高效的附近搜索查询。Review 的 `multiDimRatings` 采用嵌套文档设计，五个维度评分与综合评分分离存储，前者用于详细展示，后者用于排序与推荐打分。

---

## 3.4 API 接口设计

本系统后端暴露 RESTful API，所有接口统一挂载于 `/api` 前缀下，响应格式遵循统一规范：

```json
{
  "success": true | false,
  "message": "操作描述",
  "data": {},
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

错误响应时 `success` 为 `false`，HTTP 状态码携带语义（400 参数错误、401 未认证、403 无权限、404 资源不存在、500 服务器错误）。

核心接口列表如下：

| 方法 | 路径 | 描述 | 认证要求 |
|------|------|------|----------|
| POST | /api/cafes/ai-search | 语义搜索咖啡馆（embedding 向量排序） | 可选 |
| GET | /api/recommendations | 个性化推荐（向量路径或规则路径） | 必须 |
| GET | /api/recommendations/explore | 探索推荐（按 specialty 分组） | 必须 |
| POST | /api/reviews/:id/analyze | 触发单条评论情感分析 | 必须 |
| GET | /api/cafes/nearby | 附近咖啡馆搜索（GeoJSON $near） | 可选 |
| GET | /api/users/me | 获取当前登录用户信息 | 必须 |
| PUT | /api/users/me | 更新用户资料与手动偏好 | 必须 |
| POST | /api/users/me/favorites | 收藏/取消收藏咖啡馆 | 必须 |
| POST | /api/auth/login | 用户登录，返回 token 和 refreshToken | 无 |
| POST | /api/auth/refresh | 刷新访问令牌 | 无（携带 refreshToken） |
| POST | /api/auth/register | 用户注册 | 无 |
| GET | /api/cafes/:id | 获取咖啡馆详情（含评论） | 可选 |
| POST | /api/cafes | 创建新咖啡馆（同步生成 embedding） | 必须 |

`/api/cafes/ai-search` 接口接受 `{ query: string, limit?: number, amenityBoost?: string[] }` 请求体，优先使用语义搜索；若 embedding 服务未就绪，则自动降级为关键字搜索，前端无感知。

`/api/recommendations` 与 `/api/recommendations/explore` 接口仅对已认证用户开放，系统根据 `user.preferenceEmbedding` 是否存在自动选择向量路径或规则路径，响应体中附带每条推荐的 `reasons` 字段供前端展示推荐理由。

---

## 3.5 安全设计

**JWT 认证流程**：用户登录后，后端在 JSON 响应体中返回访问令牌（`token`，7天有效）和刷新令牌（`refreshToken`，30天有效），由前端负责存储和管理。用户配置对象缓存于 `localStorage` 供界面状态使用。后续请求通过 `Authorization: Bearer <token>` 请求头携带令牌，后端 `protect` 中间件验证 JWT 签名。

**Refresh Token 自动轮换**：Axios 响应拦截器在收到 401 时，将并发请求挂起（队列化），调用 `/api/auth/refresh` 获取新令牌后统一重发挂起的请求，确保用户无感知续期；若刷新失败（refreshToken 亦过期），则清除本地认证状态并重定向至登录页，全程对业务代码透明。

**速率限制**：认证相关接口（`/api/auth`）配置严格限制，每个 IP 每分钟最多 5 次请求，防止暴力破解；通用接口配置宽松限制，每个 IP 每 15 分钟最多 100 次请求，防止爬虫滥用。限制策略由 express-rate-limit 实现，配置于 Express 中间件层，早于路由处理器执行。

**多层输入防护**：

1. **Joi 参数校验**：所有路由的入参（body、query、params）均由 Joi Schema 定义合法值域，非法请求在进入控制器前即返回 400 错误，错误详情不暴露内部结构。
2. **NoSQL 注入防护**：express-mongo-sanitize 中间件在请求处理前清除请求体与查询参数中的 MongoDB 操作符（如 `$where`、`$gt`），防止注入攻击绕过 Mongoose 层直接操作数据库。
3. **HTTP 安全头**：helmet 中间件自动设置 `X-Content-Type-Options`、`X-Frame-Options`、`Strict-Transport-Security` 等安全响应头，减少常见的 Web 攻击面。
4. **密码存储**：用户密码使用 bcryptjs 以 saltRounds=10 进行哈希后存储，原始密码不落库，历史数据泄露时无法直接还原明文。
