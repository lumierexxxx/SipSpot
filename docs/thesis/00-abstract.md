# 摘要

随着中国咖啡消费市场的持续扩张，连锁品牌与独立精品咖啡馆数量迅速增长，用户在海量选项中精准定位符合个人需求的咖啡馆已成为一项现实痛点。传统基于关键字匹配的搜索方式仅能处理字面词语，无法理解"安静适合写代码"或"适合午后独处"等自然语言意图，导致搜索结果与用户期望之间存在明显语义鸿沟。

本文设计并实现了面向中国市场的咖啡馆发现平台 SipSpot，采用 MERN（MongoDB、Express、React、Node.js）全栈架构，在前后端分离的基础上集成多项 AI 能力，旨在为用户提供语义感知的搜索体验、基于评论的情感洞察以及个性化的咖啡馆推荐服务。地图服务集成高德地图，提供基于地理位置的附近搜索功能。

在核心技术层面，系统构建了三大 AI 模块。其一，语义搜索模块采用 multilingual-e5-base 多语言预训练模型，将用户查询与咖啡馆文本描述分别编码为 768 维稠密向量，并在 Node.js 应用层执行余弦相似度计算与结果排序；模型不可用时系统自动降级为关键词匹配，保障服务可用性。其二，情感分析模块调用阿里巴巴通义千问（Qwen Plus）大语言模型，对用户评论进行深层语义解析，输出情感极性（sentiment）、核心关键词（keywords）、内容摘要（summary）及置信度（confidence）四项结构化结果；无 API 访问时降级为基于关键词词典的规则匹配。其三，个性化推荐引擎采用双路径架构：当用户具备偏好向量（preferenceEmbedding）时，系统以向量相似度为核心进行语义排序推荐；否则退回规则路径，依据用户的咖啡品类（specialty）、设施偏好（amenity）与氛围偏好（vibe）进行结构化匹配。用户偏好向量由其评论与收藏行为动态生成，采用指数衰减加权平均算法（衰减因子 0.85^index，取最近 30 条行为记录），确保向量能够实时反映用户的最新兴趣偏移。

系统已实现对"安静适合写代码的地方"、"适合约会的精致咖啡馆"等自然语言查询的语义理解与相关结果返回，有效突破了传统关键字搜索的语义瓶颈。实验表明，SipSpot 在功能完备性与用户体验方面均具备实用价值，为国内咖啡馆发现类应用的智能化建设提供了可参考的系统设计范式。

**关键词**：语义搜索、向量嵌入、情感分析、个性化推荐、MERN架构、咖啡馆发现

---

# Abstract

As China's coffee consumption market continues its rapid expansion, the proliferation of both chain brands and independent specialty cafés has made it increasingly difficult for users to locate venues that truly match their personal needs. Conventional keyword-based search systems operate at the lexical level and are unable to interpret natural-language intent such as "a quiet place suitable for coding" or "a cozy spot for a solo afternoon," resulting in a significant semantic gap between search results and user expectations.

This paper presents the design and implementation of SipSpot, a café discovery platform targeting the Chinese market. Built on a MERN stack (MongoDB, Express, React, Node.js) with a decoupled frontend-backend architecture, the system integrates multiple AI capabilities to provide semantically-aware search, sentiment-driven review insights, and personalized café recommendations. Geolocation features are powered by AMap (高德地图), enabling proximity-based café discovery.

The system is underpinned by three core AI modules. First, the semantic search module employs the multilingual-e5-base pre-trained model to encode both user queries and café textual descriptions into 768-dimensional dense vectors. Cosine similarity computation and result ranking are performed entirely within the Node.js application layer, avoiding database-side vector operations. When the model is unavailable, the system gracefully degrades to keyword matching to maintain service continuity. Second, the sentiment analysis module integrates Alibaba's Qwen Plus large language model to perform deep semantic parsing of user reviews, producing four structured outputs per review: sentiment polarity, core keywords, content summary, and a confidence score. A keyword-dictionary rule engine serves as the fallback when API access is unavailable. Third, the personalized recommendation engine adopts a dual-path architecture: when a user has an established preference embedding (preferenceEmbedding), the system ranks candidates by vector cosine similarity to deliver semantically personalized results; otherwise, it falls back to a rule-based path that filters and ranks cafés according to the user's stated preferences for coffee specialties, amenities, and vibe. User preference vectors are generated dynamically from review and favorites behavior using an exponential decay weighted-average algorithm (decay factor 0.85^index over the most recent 30 behavioral records), enabling the vector to continuously reflect shifts in the user's evolving interests.

The deployed system successfully handles natural-language queries such as "a quiet place to write code" and "an elegant café for a date," returning semantically relevant results that keyword search fails to surface. Evaluation demonstrates that SipSpot achieves practical utility in both functional completeness and user experience quality, offering a replicable system design reference for intelligent café discovery applications in the domestic market.

**Keywords**: Semantic Search, Vector Embedding, Sentiment Analysis, Personalized Recommendation, MERN Architecture, Café Discovery
