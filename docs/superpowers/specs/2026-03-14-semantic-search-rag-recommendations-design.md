# SipSpot — Semantic Search + RAG Recommendations Design

**Date**: 2026-03-14
**Status**: Approved
**Scope**: Backend + minimal frontend change

---

## Overview

Upgrade SipSpot's AI capabilities from rule-based keyword matching to semantic vector search and embedding-based personalized recommendations. The existing keyword fallback system is fully preserved — zero regression risk.

**Goals:**
- Replace regex-based `aiSearchController` with semantic embedding search
- Upgrade `recommendationController` to use user preference vectors
- Keep all existing functionality as fallback when embedding service is unavailable

**Out of scope:** Redis cache, reranker model, MongoDB Atlas Vector Search (revisit at >2000 cafes)

---

## Architecture

### Approach: Pre-warmed Singleton in Main Process

Run `@xenova/transformers` (`Xenova/multilingual-e5-small`) as a singleton inside the Express process. Model pre-warms inside an async `startServer()` function at startup — before `app.listen()`. Zero extra infrastructure.

### Semantic Search Flow

```
POST /api/cafes/ai-search
  1. embeddingService.generateEmbedding(query, 'query')
  2. Cafe.find({ isActive: true, embeddingUpdatedAt: { $exists: true, $ne: null }, city? })
     .select('+embedding')
  3. vectorService.rankCafes(queryEmb, cafes, { amenityBoost, topK: 10 })
     amenityBoost: Chinese amenity strings detected in query (e.g. 'WiFi', '安静环境')
  4. Return ranked results immediately (no LLM wait)

POST /api/cafes/ai-search/explain  (called by frontend async, after results render)
  body: { query: string (max 200 chars), cafeNames: string[] (max 5 items, each max 100 chars) }
  Validation: Joi schema in validation.js (see Validation section)
  Rate limit: 10 req/min per IP via inline rateLimit() in routes/cafes.js
  → aiService.generateSearchExplanation(query, cafeNames) — Qwen API
  → Return { explanation: string }
```

### Personalized Recommendation Flow

```
GET /api/recommendations
  1. Load user with .select('+preferenceEmbedding')
  2. If preferenceEmbedding.length < 384 → fallback to existing score-based engine
  3. Cafe.find({ isActive: true, embeddingUpdatedAt: { $exists: true, $ne: null },
                 _id: { $nin: user.favorites } }).select('+embedding')
  4. vectorService.rankCafes(user.preferenceEmbedding, candidates, { topK: limit })
     → returns { cafe, similarityScore }[]
  5. recommendationController maps to { cafe, score, reasons, type }:
       score = Math.round(similarityScore * 100)
       reasons = ['基于您的偏好推荐']  (+ amenity match reasons if applicable)
       type = score >= 70 ? 'personalized' : 'general'
  6. Return same shape as existing response
```

### Preference Embedding Update Flow

```
User favorites a cafe:
  process.nextTick(async () => { try {
    if (!vectorService.shouldUpdatePreference(user)) return;
    add { cafeId, weight: 2, addedAt: now } to preferenceHistory
    trim preferenceHistory to 100 items ($slice: -100) via findByIdAndUpdate
    computeUserEmbedding → findByIdAndUpdate (bypasses pre-save hooks)
  } catch(e) { console.error('preferenceEmbedding update failed:', e.message); } })

User unfavorites a cafe:
  process.nextTick(async () => { try {
    if (!vectorService.shouldUpdatePreference(user)) return;
    remove matching cafeId from preferenceHistory via $pull
    computeUserEmbedding → findByIdAndUpdate
  } catch(e) { console.error(...); } })

User submits review rating >= 4:
  process.nextTick(async () => { try {
    if (!vectorService.shouldUpdatePreference(user)) return;
    add { cafeId, weight: 1, addedAt: now } to preferenceHistory ($slice: -100)
    computeUserEmbedding → findByIdAndUpdate
  } catch(e) { console.error(...); } })

computeUserEmbedding(historyItems):
  1. Sort by addedAt descending, slice to 30 (sliding window for computation)
  2. Apply exponential decay: effectiveWeight = item.weight × (0.85 ^ index)
  3. Weighted average of cafe embeddings
  4. L2 normalize
  5. Return normalized vector

Throttle: vectorService.shouldUpdatePreference(user) returns false if
  user.preferenceEmbeddingUpdatedAt > Date.now() - 60_000
```

### Cafe Embedding Generation

```
Cafe create/update controller:
  res.json() first, then:
  process.nextTick(async () => { try {
    if (!embeddingService.isReady()) return;
    const text = `passage: ${cafe.name} ${cafe.description.substring(0, 400)} `
               + `${cafe.amenities.join(' ')} ${cafe.specialty || ''} ${cafe.vibe || ''}`;
    const embedding = await embeddingService.generateEmbedding(text, 'passage');
    await Cafe.findByIdAndUpdate(cafe._id, { embedding, embeddingUpdatedAt: new Date() });
  } catch(e) { console.error('cafe embedding failed:', e.message); } })
```

---

## Data Model Changes

### Cafe Schema (`cafe.js`)

New fields added after `aiSummary`:

```js
embedding: {
    type: [Number],          // 384 dimensions (Xenova/multilingual-e5-small)
    default: [],
    select: false            // excluded from default queries
},
embeddingUpdatedAt: {
    type: Date,
    default: null
}
```

New index:
```js
CafeSchema.index({ embeddingUpdatedAt: 1, isActive: 1 });
```

### User Schema (`user.js`)

New fields added after `preferences`:

```js
preferenceEmbedding: {
    type: [Number],          // 384 dimensions, L2-normalized
    default: [],
    select: false
},
preferenceEmbeddingUpdatedAt: {
    type: Date,
    default: null
},
preferenceHistory: {
    // Capped at 100 items via $slice on every write (not schema-level)
    // Sliding window of 30 used during computeUserEmbedding
    type: [{
        cafeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe' },
        weight: Number,      // favorite=2, high-rated review=1
        addedAt: { type: Date, default: Date.now }
    }],
    default: [],
    select: false
}
```

**Migration risk**: None. All fields have `default` values; existing documents unaffected.

---

## New Services

### `backend/server/services/embeddingService.js`

```
Responsibilities:
  - Singleton HuggingFace model lifecycle management
  - Pre-warm at server startup via init() inside async startServer()
  - E5 prefix handling: 'query:' for searches, 'passage:' for documents

Interface:
  init()                                → Promise<void>
    If model load fails: log warning, set isReady=false, DO NOT throw
    Server continues to start; all callers fall back via isReady() check
  generateEmbedding(text, type)         → Promise<number[]>
  generateBatch(items: [{text,type}])   → Promise<number[][]>
  isReady()                             → boolean

Model: Xenova/multilingual-e5-small (384 dims, ~120MB cached locally)
  Package: @xenova/transformers ^2.x  (intentionally pinned to v2 for API stability;
           @huggingface/transformers v3 has breaking API changes — revisit separately)
  Memory: ~200-300MB heap increase; no --max-old-space-size flag needed for dev workload
Text truncation: description capped at 400 chars to stay within 512 token limit
```

### `backend/server/services/vectorService.js`

```
Responsibilities:
  - Pure math, no DB dependency, independently testable

Interface:
  cosineSimilarity(a, b)               → number (-1 to 1)
  normalizeVector(v)                    → number[]

  rankCafes(queryEmb, cafes, options?) → { cafe, similarityScore }[]
    options: {
      amenityBoost?: string[],   // Chinese amenity strings e.g. ['WiFi', '安静环境']
                                 // Must use Chinese enum values matching Cafe.amenities
                                 // (never English — known mismatch in User.preferences.learned
                                 //  does NOT affect this path; amenityBoost comes from
                                 //  query parsing in aiSearchController, not from user prefs)
      topK?: number
    }
    amenityBoost scoring: similarity += 0.1 per matched amenity (capped at +0.3)
    Returns sorted descending by adjusted similarityScore, sliced to topK

  computeUserEmbedding(historyItems)   → number[]
    historyItems: [{ embedding: number[], weight: number, addedAt: Date }]
    1. Sort by addedAt desc, slice to 30
    2. effectiveWeight = item.weight × (0.85 ^ index)
    3. Weighted average → normalizeVector

  shouldUpdatePreference(user)         → boolean
    false if user.preferenceEmbeddingUpdatedAt > Date.now() - 60_000
```

---

## Validation (`validation.js`)

New Joi schema for `/ai-search/explain`:

```js
explainSearchSchema = Joi.object({
    query: Joi.string().trim().max(200).required(),
    cafeNames: Joi.array()
        .items(Joi.string().trim().max(100))
        .max(5)
        .required()
});
```

Applied via existing `validate(explainSearchSchema)` middleware in `routes/cafes.js`.

---

## Modified Controllers

### `aiSearchController.js`

- `aiSearch`: if `embeddingService.isReady()`, run semantic search. Else fall back to existing `parseNaturalLanguageQuery()` — entire existing function preserved unchanged.
- `explainSearch` (new): validates input via Joi (handled by middleware), calls `aiService.generateSearchExplanation(query, cafeNames)`. If Qwen fails, returns `{ explanation: null }` with status 200 — frontend handles gracefully.

### `recommendationController.js`

- `getRecommendations`: upgraded to vector path when `preferenceEmbedding.length >= 384`. Falls back to existing `aiService.generatePersonalizedRecommendations`. Return shape unchanged: `{ cafe, score, reasons, type }[]`.
- All other endpoints unchanged.

### `cafeController.js`

- `createCafe` + `updateCafe`: fire-and-forget embedding generation via `process.nextTick` after `res.json()`. Wrapped in try/catch. Does not block response.

### `userController.js`

- `toggleFavorite`: fire-and-forget preferenceEmbedding update via `process.nextTick`. Handles both add and remove cases. Throttled. Wrapped in try/catch.

### `reviewController.js`

- `createReview`: fire-and-forget preferenceEmbedding update via `process.nextTick` when `rating >= 4`. Throttled. Wrapped in try/catch.

---

## Route Changes (`routes/cafes.js`)

**CRITICAL ordering requirement**: The existing `router.use('/:cafeId/reviews', reviewRoutes)` wildcard mount must be moved to AFTER all static routes. If it remains before `/ai-search/explain`, Express will capture `ai-search` as `:cafeId` and route `/explain` into reviewRoutes incorrectly.

Correct order in `routes/cafes.js`:
```
1. Static GET routes  (/search, /nearby, /top/rated, /ai-search)
2. POST /ai-search/explain  ← new, must be here
3. POST / (createCafe)
4. GET|PUT|DELETE /:id
5. router.use('/:cafeId/reviews', reviewRoutes)  ← moved to last
```

New route definition:
```js
const explainLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
router.post('/ai-search/explain', explainLimiter, validate(explainSearchSchema), aiSearchController.explainSearch);
```

`rateLimit` is already available via `express-rate-limit` (existing dependency in server.js).

---

## Server Startup Change (`server.js`)

Refactor existing floating `.then()` chain into an `async function startServer()`:

```js
async function startServer() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    try {
        await embeddingService.init();
        console.log('Embedding model ready');
    } catch (err) {
        console.warn('Embedding model failed to load — semantic search disabled:', err.message);
        // isReady() returns false; all callers fall back automatically
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();
```

This replaces the existing `mongoose.connect().then(...)` pattern. `app.listen()` is moved inside `startServer()`.

---

## Backfill Script

**File**: `backend/server/seeds/generate_embeddings.js`
**Run once**: `node backend/server/seeds/generate_embeddings.js`
**Idempotent**: queries `embeddingUpdatedAt: null` — already-processed cafes are skipped automatically.

```
Flow:
  1. Connect MongoDB
  2. embeddingService.init() (wrapped in try/catch — abort script if model fails)
  3. Cafe.find({ isActive: true, embeddingUpdatedAt: null })
  4. Process in batches of 10
  5. For each cafe:
       try: generateEmbedding(cafeText, 'passage') → findByIdAndUpdate
       catch: log "FAILED: {cafe.name} — {error.message}", continue to next
  6. Print summary: "Done. Success: 118/120. Failed: 2 (see above)."
  7. Disconnect
```

---

## Frontend Change

**File**: `frontend/src/pages/AISearchPage.jsx`

After search results render, make a secondary async call to `/api/cafes/ai-search/explain`. Show a loading spinner in the explanation area while waiting. If the call fails or returns `{ explanation: null }`, hide the explanation section silently. Core search results display is never blocked.

---

## Fallback Strategy

| Scenario | Fallback |
|---|---|
| `embeddingService.init()` fails at startup | Log warning, server starts normally, `isReady()` = false |
| `embeddingService.isReady()` = false at search time | Existing `parseNaturalLanguageQuery()` keyword search |
| `user.preferenceEmbedding.length` < 384 | Existing score-based recommendation engine |
| Cafe has no embedding | Excluded at DB query level via `embeddingUpdatedAt: { $exists: true, $ne: null }` |
| Qwen explain API fails | Return `{ explanation: null }`, frontend hides section |
| `process.nextTick` async throws | Caught silently, logged, main request unaffected |

---

## New Dependencies

```json
"@xenova/transformers": "^2.x"
```

Note: `@huggingface/transformers` v3 exists but has breaking API changes vs v2. Pinning to `^2.x` is intentional. Upgrade path is a separate decision.

No other new dependencies.

---

## File Change Summary

| File | Type | Change |
|---|---|---|
| `services/embeddingService.js` | New | HF model singleton, init(), generateEmbedding() |
| `services/vectorService.js` | New | cosineSimilarity, rankCafes, computeUserEmbedding |
| `seeds/generate_embeddings.js` | New | One-time idempotent backfill script |
| `models/cafe.js` | Modified | +embedding, +embeddingUpdatedAt, +index |
| `models/user.js` | Modified | +preferenceEmbedding, +preferenceHistory, +preferenceEmbeddingUpdatedAt |
| `controllers/aiSearchController.js` | Modified | Semantic search + new explainSearch handler |
| `controllers/recommendationController.js` | Modified | Vector-based getRecommendations with fallback |
| `controllers/cafeController.js` | Modified | Async cafe embedding trigger on create/update |
| `controllers/userController.js` | Modified | Async preference update on toggleFavorite |
| `controllers/reviewController.js` | Modified | Async preference update on createReview >= 4 stars |
| `routes/cafes.js` | Modified | +/ai-search/explain route; reorder wildcard mount to last |
| `routes/recommendations.js` | Verified | No route path changes; controller internals only |
| `utils/validation.js` | Modified | +explainSearchSchema Joi schema |
| `server/server.js` | Modified | Refactor to async startServer(); add embeddingService.init() |
| `pages/AISearchPage.jsx` | Modified | Async explain secondary call with loading state |
| `package.json` | Modified | +@xenova/transformers ^2.x |
