# 第二章 系统分析与设计

本章从需求分析、总体设计和 AI 子系统专项设计三个层次对 SipSpot 平台展开系统性阐述。需求分析明确各类用户的权限边界与功能诉求，总体设计确定系统架构、数据模型与接口规范，AI 子系统设计则聚焦于语义搜索、情感分析和个性化推荐三条核心智能功能路径的详细设计方案。

---

## 2.1 需求分析

### 2.1.1 用户角色分析

SipSpot 平台面向三类用户群体：游客（未登录访客）、注册用户和店主/管理员。三类角色的权限范围呈逐级包含关系，具体如表2-1所示。

**表2-1 用户角色与权限边界**

| 用户角色 | 访问权限级别 | 可执行操作 |
|---------|------------|-----------|
| 游客 | 公开只读 | 浏览咖啡馆列表与详情、执行自然语言语义搜索、查看高德地图附近标注 |
| 注册用户 | 含游客全部权限 + 个人操作 | 撰写多维度评分评论、收藏/取消收藏咖啡馆、获取 AI 个性化推荐、管理个人资料与偏好设置 |
| 店主/管理员 | 含注册用户全部权限 + 内容管理 | 发布新咖啡馆、编辑/删除自有咖啡馆条目、上传及管理咖啡馆图片 |

**游客**是平台的轻量访问者，无需注册即可享有完整的信息浏览与语义搜索功能，这一设计降低了进入门槛，有助于内容传播与新用户转化。

**注册用户**是平台的核心参与群体。每次评论或收藏行为均会触发偏好向量的更新计算，形成"行为 → 偏好向量 → 推荐优化"的正向反馈闭环，持续提升个性化推荐质量。

**店主/管理员**是平台的内容生产者，负责维护咖啡馆的结构化信息。系统通过后端 `checkOwnership` 中间件在接口层严格校验资源归属，确保店主仅能操作自身创建的内容，防止越权写操作。

### 2.1.2 功能需求

本系统的核心差异化竞争力在于将 AI 能力深度融入咖啡馆发现流程，功能需求分为 AI 核心功能与基础平台功能两类。

**1. 自然语言语义搜索需求**

传统关键词搜索要求用户精确匹配预定义标签，难以表达模糊的情景化需求。本系统需支持用户以自然语言描述搜索意图，例如"安静适合写代码的地方"或"有氛围感的下午茶空间"。系统须将查询文本编码为稠密语义向量，在所有已建立向量索引的咖啡馆中计算语义相似度，按相似度降序返回 Top-K 结果。该功能需同时支持中文、英文及中英混合查询，并在向量模型不可用时自动降级为关键词匹配，保证功能连续性。

**2. 评论情感分析需求**

用户提交评论后，系统须异步触发情感分析，输出结果应包含：情感倾向（positive / negative / neutral）、3至5个关键词、不超过50字的一句话摘要及置信度评分。分析结果须写回评论文档并汇聚至咖啡馆详情页的 AI 综合摘要区域，帮助后续用户快速了解口碑概况。当云端 AI API 不可用时，系统须自动切换至本地规则方法，确保每条评论均能完成情感标注而不留空字段。

**3. 个性化推荐需求**

系统须根据用户的历史评论与收藏行为，动态生成并持久化用户偏好向量，用于驱动个性化推荐。推荐结果须区分"精准推荐"与"探索推荐"两类：前者最大化与用户已知偏好的匹配度，后者主动推送用户尚未尝试过的咖啡种类，防止推荐结果同质化。对于新用户（偏好向量尚未建立），须有基于规则的冷启动方案可作回退。

**4. 基础平台功能需求**

除上述 AI 功能外，平台还需提供以下基础能力：

- 咖啡馆信息完整 CRUD，支持图片上传至 Cloudinary 云存储；
- 多维度评分系统（总体评分 + 口味/价格/环境/服务/办公适合度五维细分），评分步长0.5星；
- 地理位置功能：GeoJSON Point 存储坐标，支持"附近咖啡馆"查询，前端集成高德地图展示点位标注；
- 用户账户完整生命周期管理：注册、登录、密码修改、邮箱验证；
- 收藏功能，收藏行为同步参与偏好向量计算。

### 2.1.3 非功能需求

平台的非功能需求覆盖性能、安全、可用性和可扩展性四个维度，量化指标如表2-2所示。

**表2-2 非功能需求指标**

| 类别 | 需求描述 | 量化指标 |
|------|---------|---------|
| 性能 | 常规 API 响应时间（不含 AI 推理） | < 500 ms |
| 性能 | Embedding 推理耗时（模型已预热） | < 3 s |
| 性能 | 语义搜索端到端响应时间 | < 5 s |
| 安全 | 身份认证方式 | JWT，Authorization: Bearer 携带，有效期7天 |
| 安全 | 输入合法性校验 | Joi Schema 校验所有入参，非法请求在控制器前即被拦截 |
| 安全 | 接口速率限制 | 认证接口 ≤ 5 次/分钟；通用接口 ≤ 100 次/15 分钟 |
| 可用性 | 语义搜索降级 | 向量模型未就绪时自动回退关键词搜索，降级状态在响应中标注 |
| 可用性 | 情感分析降级 | Qwen API 不可用时自动切换本地关键词词典方法 |
| 可扩展性 | 向量存储扩展路径 | 当前 MongoDB 存储 embedding，架构上预留迁移至专用向量数据库的替换接口 |
| 可维护性 | 代码规范 | TypeScript 类型声明，ESLint 静态检查，JSDoc 注释 |

在可扩展性方面，当前系统将768维 embedding 向量以普通数值数组字段直接存储于 MongoDB 文档，推荐与搜索时在 Node.js 应用层全量遍历计算余弦相似度，时间复杂度为 O(n)。该方案在咖啡馆数量处于百至千量级时性能可接受。系统在架构上预留了 `rankCafes` 函数的替换接口，后续可平滑迁移至 MongoDB Atlas Vector Search（HNSW 索引）或 Milvus 等专用向量数据库，上游控制器代码无需修改。

---

## 2.2 系统总体设计

### 2.2.1 总体架构设计

本系统采用前后端分离的三层架构：前端基于 React 19 构建单页应用（SPA），后端基于 Node.js/Express 提供 RESTful API，数据层采用 MongoDB，并在后端服务层内置专用的 AI 子系统。各层之间通过标准 HTTP 协议通信，开发阶段由 Vite 开发服务器将 `/api` 路径代理至后端 5001 端口，生产环境通过反向代理完成等效路由转发。系统总体架构如图2-1所示。

**图2-1 系统总体架构图**

```
┌──────────────────────────────────────────────────────────┐
│                    表现层（前端）                          │
│                                                          │
│   React 19 SPA + React Router 7 + TailwindCSS v4        │
│   Axios 实例（含 Token 刷新拦截器）+ AMap SDK            │
│   页面组件：Home / Search / CafeDetail / Profile / ...  │
└──────────────────────────┬───────────────────────────────┘
                           │  HTTP / JSON（开发态 Vite 代理）
┌──────────────────────────▼───────────────────────────────┐
│                    业务逻辑层（后端）                      │
│                                                          │
│   Express.js REST API（端口 5001）                        │
│   路由层：/api/auth  /api/cafes  /api/users              │
│          /api/reviews  /api/recommendations              │
│   中间件：helmet / rate-limit / mongo-sanitize / Joi     │
│   认证：JWT protect / optionalAuth / checkOwnership      │
│   ┌────────────────────────────────────────────────┐     │
│   │               AI 服务层                         │     │
│   │  embeddingService  vectorService  aiService    │     │
│   │  （multilingual-e5-base 本地推理）（Qwen API）  │     │
│   └────────────────────────────────────────────────┘     │
└──────────────────────────┬───────────────────────────────┘
                           │  Mongoose ODM / Cloudinary SDK
┌──────────────────────────▼───────────────────────────────┐
│                      数据层                               │
│                                                          │
│   MongoDB（User / Cafe / Review 文档集合）                │
│   GeoJSON 2dsphere 索引（地理查询）                       │
│   Cloudinary 云存储（用户上传图片）                        │
└──────────────────────────────────────────────────────────┘
```

**表现层**负责用户界面渲染与交互。Axios 实例封装所有 API 调用，响应拦截器实现 Token 自动刷新与并发请求队列化。React Router 7 提供客户端路由，TailwindCSS v4 基于 `@theme` 设计令牌系统统一视觉风格。高德地图（AMap）SDK 集成于地图视图组件，渲染附近咖啡馆的空间点位分布。

**业务逻辑层**承担核心业务处理、认证鉴权与数据校验。所有路由处理器遵循控制器—服务—模型三层分工，请求入参由 Joi Schema 统一校验，响应格式标准化为 `{ success, message, data?, pagination? }`。`express-rate-limit`、`helmet` 与 `express-mongo-sanitize` 构成安全防护中间件体系，在路由层之前依次执行。

**AI 服务层**是本系统的核心差异化模块，内嵌于业务逻辑层，由三个职责分离的服务构成：`embeddingService` 负责在服务器启动时异步加载并托管 multilingual-e5-base 本地推理模型；`vectorService` 提供纯数学的余弦相似度计算、咖啡馆语义排序与用户偏好向量计算；`aiService` 封装通义千问（Qwen）API 调用，实现评论情感分析与咖啡馆文案生成。三个服务均被控制器层直接调用，彼此无耦合依赖，可独立测试与替换。

**数据层**采用 MongoDB 存储结构化业务数据，Mongoose 提供 ODM 映射与 Schema 约束。咖啡馆位置信息以 GeoJSON Point 格式存储，配合 `2dsphere` 索引支持 `$near` 地理查询。图片资源存储于 Cloudinary，数据库仅保存持久化 URL，规避本地存储带来的运维负担。

### 2.2.2 数据模型设计

本系统定义三个核心 Mongoose 数据模型：User（用户）、Cafe（咖啡馆）、Review（评论）。三者关联关系如下：User 与 Cafe 通过 `favorites[]` 字段构成多对多关联；User 与 Review 为一对多关联（Review.author → User）；Cafe 与 Review 为一对多关联（Review.cafe → Cafe，Cafe.reviews[] 存储反向引用，构成双向引用，两侧须保持同步）。

**图2-2 数据模型 ER 关系示意图**

```
┌────────────────────────┐         ┌──────────────────────────┐
│         User           │         │          Cafe            │
├────────────────────────┤         ├──────────────────────────┤
│ _id: ObjectId          │  M   N  │ _id: ObjectId            │
│ username: String       ├─────────┤ name: String             │
│ email: String          │favorites│ description: String      │
│ password: String(hash) │         │ geometry: GeoJSON Point  │
│ preferenceEmbedding:   │         │ embedding: Number[768]   │
│   Number[768]          │         │ amenities: String[]      │
│ preferences.manual:    │         │   (英文枚举键: wifi等)   │
│   Object               │         │ specialty: String        │
└────────────┬───────────┘         │ vibe: String             │
             │ 1                   │ price: Number(1-5)       │
             │                     │ averageRating: Number    │
             │ N                   │ aiSummary: String        │
┌────────────▼───────────┐    N    │ reviews[]: ObjectId[]    │
│         Review         ├─────────┤ author: ObjectId → User  │
├────────────────────────┤  1      └──────────────────────────┘
│ _id: ObjectId          │
│ cafe: ObjectId → Cafe  │
│ author: ObjectId → User│
│ content: String        │
│ rating: Number(0.5步长)│
│ multiDimRatings:       │
│   taste / price /      │
│   environment /        │
│   service / workspace  │
│ aiAnalysis:            │
│   sentiment / keywords │
│   summary / confidence │
└────────────────────────┘
```

各模型重点设计说明如下：

**User 模型**的 `preferenceEmbedding` 字段存储768维浮点数数组，由用户的评论与收藏行为加权聚合计算而来，是个性化推荐引擎的核心输入。`preferences.manual` 嵌套对象存储用户手动设置的偏好（如必须包含的设施类型、需回避的设施类型），与行为学习的自动偏好互为补充。

**Cafe 模型**的 `geometry` 字段以 GeoJSON Point 格式（`{ type: "Point", coordinates: [lng, lat] }`）存储地理坐标，配合 `2dsphere` 索引支持高效的附近查询。`embedding` 字段存储768维语义向量，由 `buildCafeText()` 将结构化字段拼接为自然语言文本后调用 `generateEmbedding(text, 'passage')` 生成，用于语义搜索与推荐匹配。`amenities` 数组使用英文枚举键（如 `wifi`、`power_outlet`、`quiet`、`outdoor_seating`），与推荐引擎规则路径的 amenityBoost 参数保持一致。

**Review 模型**的 `multiDimRatings` 采用嵌套文档设计，五个细分维度（口味/价格/环境/服务/办公适合度）与综合评分 `rating` 分离存储，评分步长均为0.5，范围1至5。`aiAnalysis` 嵌套文档存储情感分析结果，包含 sentiment 枚举值、关键词数组、摘要文本和置信度评分。

### 2.2.3 系统接口设计

后端 RESTful API 统一挂载于 `/api` 前缀下，所有响应遵循统一结构：

```
{
  "success": true | false,
  "message": "操作描述",
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

错误响应时 `success` 为 `false`，HTTP 状态码携带语义（400 参数错误、401 未认证、403 无权限、404 资源不存在、500 服务器错误）。核心接口清单如表2-3所示。

**表2-3 核心 API 接口列表**

| 方法 | 路径 | 功能描述 | 认证要求 |
|------|------|---------|---------|
| POST | /api/cafes/ai-search | 自然语言语义搜索（向量排序，可降级关键词） | 可选 |
| GET | /api/recommendations | 个性化推荐（向量路径或规则路径自动切换） | 必须 |
| GET | /api/recommendations/explore | 探索推荐（按 specialty 分组，推送未尝试种类） | 必须 |
| POST | /api/reviews/:id/analyze | 触发单条评论情感分析，写回 aiAnalysis 字段 | 必须 |
| GET | /api/cafes/nearby | 附近咖啡馆查询（GeoJSON $near，需 lng/lat/radius 参数） | 可选 |
| GET | /api/cafes/:id | 获取咖啡馆详情（含评论列表与 aiSummary） | 可选 |
| POST | /api/cafes | 创建新咖啡馆（同步生成 embedding 向量） | 必须 |
| PUT | /api/cafes/:id | 更新咖啡馆信息（重新生成 embedding） | 必须（本人） |
| GET | /api/users/me | 获取当前登录用户完整信息 | 必须 |
| PUT | /api/users/me | 更新用户资料与手动偏好设置 | 必须 |
| POST | /api/users/me/favorites | 收藏/取消收藏咖啡馆（切换操作） | 必须 |
| POST | /api/auth/login | 用户登录，返回 token 和 refreshToken | 无 |
| POST | /api/auth/refresh | 刷新访问令牌（携带 refreshToken） | 无 |
| POST | /api/auth/register | 新用户注册 | 无 |

其中，`POST /api/cafes/ai-search` 接受请求体 `{ query: string, limit?: number, amenityBoost?: string[] }`，优先使用语义向量检索；若 embedding 服务未就绪则自动降级为关键词搜索，前端无感知，降级状态通过响应体 `fallback` 字段标注。`GET /api/recommendations` 与 `GET /api/recommendations/explore` 均仅对已认证用户开放，响应体中附带每条推荐的 `reasons` 字段供前端展示推荐理由。

---

## 2.3 AI 子系统设计

### 2.3.1 语义搜索子系统设计

**设计目标**：支持中英文及中英混合自然语言查询，语义理解优先于关键词匹配，返回语义相关度最高的咖啡馆列表，并具备完善的降级机制保障功能连续性。

**技术选型决策**

本系统选用 `Xenova/multilingual-e5-base`（通过 `@xenova/transformers` 在 Node.js 中本地运行）作为文本向量化模型。选型决策权衡如表2-4所示。

**表2-4 Embedding 模型选型对比**

| 维度 | multilingual-e5-base（选用） | OpenAI text-embedding | 仅关键词搜索 |
|------|-----------------------------|-----------------------|------------|
| 中英双语支持 | 原生支持100余种语言 | 支持，依赖 API | 有限 |
| 运行方式 | 本地推理，无外部依赖 | 调用 OpenAI API | 本地 |
| 费用 | 零 API 费用 | 按 Token 计费 | 零 |
| 向量维度 | 768维 | 1536维（ada-002） | 不适用 |
| 语义理解能力 | 较强，多语言检索基准表现稳定 | 强 | 弱 |
| 离线可用性 | 模型缓存后完全离线可用 | 依赖网络 | 完全离线 |

综合考量本系统面向中国市场、需处理中英混合查询、部署成本敏感及离线开发友好等约束，选用 multilingual-e5-base 在精度、成本与可用性之间取得最优平衡。

**语义搜索数据流**

系统完整语义搜索处理流程如图2-3所示。

**图2-3 语义搜索处理流程**

```
┌─────────────────────────────────┐
│  用户输入自然语言查询文本          │
│  （如："安静适合写代码的地方"）    │
└──────────────┬──────────────────┘
               ↓
┌──────────────▼──────────────────┐
│  isReady() 检查模型状态           │
└──────┬───────────────┬──────────┘
       │ true          │ false
       ↓               ↓
┌──────▼─────┐  ┌──────▼──────────────────┐
│ 语义搜索路径│  │ 降级路径：关键词正则匹配  │
│            │  │ 响应中标注 fallback:true  │
│ generateEm-│  └─────────────────────────┘
│ bedding(   │
│ text,      │
│ 'query')   │
│ （内部自动  │
│ 添加        │
│ "query: "  │
│ 前缀，      │
│ 均值池化    │
│ + L2归一化）│
└──────┬─────┘
       ↓
┌──────▼──────────────────────────┐
│  生成 768 维查询向量               │
└──────────────┬──────────────────┘
               ↓
┌──────────────▼──────────────────┐
│  从 MongoDB 取出所有含             │
│  embedding 字段的咖啡馆文档        │
└──────────────┬──────────────────┘
               ↓
┌──────────────▼──────────────────┐
│  vectorService.rankCafes(       │
│    queryVec, cafes,             │
│    amenityBoost?                │
│  )                              │
│  对每条咖啡馆计算余弦相似度：       │
│  score = (A·B) / (|A|×|B|)     │
│  若 amenityBoost 命中：+0.1/个  │
│  上限 +0.3，最终分数截断至 1.0   │
└──────────────┬──────────────────┘
               ↓
┌──────────────▼──────────────────┐
│  按 score 降序排列 → 返回 Top-K  │
│  结果（含 score 字段供前端展示）  │
└─────────────────────────────────┘
```

**E5 前缀机制**：multilingual-e5-base 遵循 E5 检索协议，查询文本须以 `"query: "` 为前缀，文档文本须以 `"passage: "` 为前缀，以提高检索精度。`generateEmbedding(text, type)` 函数依据 `type` 参数（`'query'` 或 `'passage'`）自动添加对应前缀，调用方无需关心此细节。向量生成时采用均值池化（mean pooling）与 L2 归一化，确保输出向量模长为1，后续余弦相似度在数值上等同于点积运算。

**咖啡馆向量构建**：`buildCafeText(cafe)` 函数将咖啡馆结构化字段拼接为自然语言文本，拼接规则为：咖啡馆名称 + description（截断至400字符，避免超出模型512 token上下文限制）+ amenities（空格连接）+ specialty + vibe，再调用 `generateEmbedding(cafeText, 'passage')` 生成768维文档向量，于咖啡馆入库或信息更新时同步生成并持久化至 `embedding` 字段。

**降级设计**：服务器启动时调用 `init()` 异步预热模型。若模型加载失败（如首次运行时网络中断），`isReady()` 返回 `false`，系统路由至关键词正则匹配分支，保证核心搜索功能在 AI 不可用时仍正常运作，降级状态通过响应体字段透出供前端感知。

### 2.3.2 情感分析子系统设计

**设计目标**：用户提交评论后，系统自动分析评论情感倾向，生成结构化 AI 分析结果，辅助后续用户快速了解咖啡馆口碑；当云端 API 不可用时保证功能平稳降级，不出现空字段。

**接口设计**

情感分析子系统的输入/输出约定如下：

```
输入：
  reviewText  —— 评论正文（字符串）
  cafeName    —— 所属咖啡馆名称（提供上下文）

输出（aiAnalysis 字段）：
  sentiment   —— "positive" | "negative" | "neutral"
  keywords    —— 3-5 个关键词字符串数组
  summary     —— 不超过 50 字的一句话摘要
  confidence  —— [0, 1] 区间置信度浮点数
```

**两级处理架构**

情感分析采用主路径 + 降级路径的两级设计，如图2-4所示。

**图2-4 情感分析两级处理架构**

```
收到情感分析请求
       ↓
QWEN_API_KEY 是否已配置？
       ├── 是 ──→ 调用通义千问 qwen-plus API
       │          temperature=0.4（低温保证 JSON 格式稳定性）
       │          超时阈值：15 秒
       │               ↓
       │          API 调用成功？
       │          ├── 是 ──→ 正则清洗 markdown 代码块
       │          │          JSON.parse() 解析响应
       │          │          写回 Review.aiAnalysis
       │          └── 否 ──→ 转入降级路径
       │
       └── 否 ──→ 降级路径：basicSentimentAnalysis()
                  33个正向词典 + 28个负向词典
                  关键词计数 → 情感倾向判断
                  confidence 基准值 0.6，随正负词差值线性增长（上限 0.9）
                  写回 Review.aiAnalysis
```

**Prompt 设计原则**：系统提示明确约束"请始终返回有效的JSON格式，不要添加额外的解释或markdown标记"，确保响应可被 `JSON.parse()` 直接解析。针对 Qwen 偶发性地在 JSON 外包裹 markdown 代码块的情况，解析前增加正则清洗步骤（去除 ` ```json ` 与 ` ``` ` 标记），实现对格式异常的容错处理。

**咖啡馆摘要生成设计**：`generateCafeSummary()` 在本地对评论集合进行情感聚合，统计好评率与高频关键词后生成纯文本摘要，不调用 Qwen API，适合批量处理场景（如定期刷新咖啡馆详情页 `aiSummary` 字段）。区别于此，`generateCafeDescription()` 调用 Qwen API（temperature=0.7，保证文本多样性），基于咖啡馆基础信息与近期评论片段生成80至120字的自然语言简介，适用于咖啡馆首次创建时的文案自动生成场景。

### 2.3.3 个性化推荐子系统设计

**设计目标**：基于用户历史行为自动学习偏好表征，驱动个性化推荐；同时提供探索推荐防止结果同质化；对新用户提供冷启动规则方案。

**双路径推荐架构**

推荐引擎以用户是否存在 `preferenceEmbedding` 为分支条件，实现向量路径与规则路径的自动切换，架构如图2-5所示。

**图2-5 双路径推荐架构**

```
GET /api/recommendations（已认证用户）
              ↓
  读取 user.preferenceEmbedding
              ↓
  ┌───────────┴────────────────────────┐
  │ 存在（768维偏好向量）               │ 不存在（新用户 / 行为不足）
  ↓                                   ↓
【向量路径】                         【规则路径（冷启动）】
vectorService.rankCafes(             加权评分算法：
  preferenceEmbedding,               • amenity 命中：+6分/个，上限30分
  cafes                              • specialty 命中：+20分
)                                    • 价格区间匹配：+15分
余弦相似度排序                          轻微偏差：+8分
附带 amenityBoost 可选                • 综合评分：min(20, rating×4)
                                     • 热度（评论数）：min(15, reviewCount)
                                     • 未访问加成：+5分
              ↓                                   ↓
  ┌───────────┴────────────────────────┘
  已收藏咖啡馆从候选集中排除
  附带 reasons 字段说明推荐依据
              ↓
    返回推荐列表（JSON）
```

**偏好向量计算设计**（`computeUserEmbedding`）

用户每次提交评论或切换收藏状态后，分别由 reviewController 和 userController 触发偏好向量更新。算法取用户近30条行为记录，按时间倒序施加指数衰减权重：

```
Algorithm: ComputeUserEmbedding
Input:  behaviors[0..N-1]（按时间降序排列，N ≤ 30）
        behaviors[i].embedding（咖啡馆768维向量）
        behaviors[i].weight（评论权重1.0，收藏权重0.8）
Output: preferenceEmbedding（768维，L2归一化）

1. weightedSum ← 零向量（768维）
2. totalWeight ← 0
3. FOR i = 0 TO N-1 DO
4.     decayFactor ← 0.85 ^ i
5.     effectiveWeight ← behaviors[i].weight × decayFactor
6.     weightedSum ← weightedSum + effectiveWeight × behaviors[i].embedding
7.     totalWeight ← totalWeight + effectiveWeight
8. END FOR
9. avgVector ← weightedSum / totalWeight
10. RETURN L2Normalize(avgVector)
```

衰减因子 0.85 使最新行为的影响力约为第10条行为的2倍，在响应近期偏好变化与保留历史稳定性之间取得平衡。为避免频繁写入，`shouldUpdatePreference()` 函数实施1分钟节流，时间窗内重复触发的更新请求直接跳过。

**探索推荐设计**（`GET /api/recommendations/explore`）

为防止推荐结果同质化，探索推荐以咖啡种类（specialty）为分组维度，识别用户在历史评论和收藏中尚未出现的 specialty 类别，在每个未尝试种类中选出综合评分最高的代表性咖啡馆加入推荐列表，主动引导用户突破已知偏好边界，发现新类型咖啡馆体验。该功能通过单独接口返回，前端将精准推荐与探索推荐分区展示，避免两类结果的语义混淆。

---

## 2.4 安全设计

本系统的安全设计覆盖身份认证、令牌管理、速率限制和输入防护四个层面。

**JWT 认证流程**：用户登录后，后端在 JSON 响应体中同时返回访问令牌（`token`，7天有效）和刷新令牌（`refreshToken`，30天有效）。后续请求通过 `Authorization: Bearer <token>` 请求头携带访问令牌，后端 `protect` 中间件验证 JWT 签名与有效期，验证通过后将解码的用户信息注入 `req.user` 供控制器使用；验证失败则返回 401 状态码。用户对象缓存于前端 localStorage，用于界面状态管理，不涉及敏感凭证。

**Refresh Token 自动轮换机制**：Axios 响应拦截器在收到 401 响应时，将当前并发请求挂起（队列化），调用 `POST /api/auth/refresh` 获取新访问令牌后统一重发挂起请求，用户无感知续期。若刷新令牌亦已过期，则清除本地认证状态并重定向至登录页，全程对业务层代码透明。

**速率限制**：认证相关接口（`/api/auth`）采用严格策略，每 IP 每分钟最多5次请求，有效抵御暴力破解与撞库攻击；通用接口采用宽松策略，每 IP 每15分钟最多100次请求，防止爬虫滥用。两套策略均由 `express-rate-limit` 中间件实现，早于路由处理器执行，超限请求直接返回 429 状态码。

**多层输入防护**：Joi Schema 对所有路由入参（body、query、params）定义合法值域，非法请求在进入控制器前即被拦截并返回 400 错误；`express-mongo-sanitize` 中间件清除请求体与查询参数中的 MongoDB 操作符（如 `$where`、`$gt`），防止 NoSQL 注入攻击；`helmet` 中间件自动注入 `X-Content-Type-Options`、`X-Frame-Options`、`Strict-Transport-Security` 等安全响应头，减少常见 Web 攻击面；用户密码使用 bcryptjs 以 saltRounds=10 哈希后存储，原始明文不落库。

---

## 本章小结

本章从三个层次完成了 SipSpot 平台的系统分析与设计工作。需求分析阶段明确了游客、注册用户和店主三类角色的权限边界，定义了 AI 语义搜索、情感分析、个性化推荐三项核心功能需求及量化非功能指标。总体设计阶段确定了前后端分离的三层架构，设计了 User/Cafe/Review 三大数据模型及核心 RESTful API 接口规范。AI 子系统设计阶段详细阐述了语义搜索的 E5 前缀机制与降级策略、情感分析的两级处理架构与 Prompt 设计原则、个性化推荐的双路径架构与偏好向量指数衰减更新算法。上述设计成果为第三章的系统实现提供了完整的技术依据。
