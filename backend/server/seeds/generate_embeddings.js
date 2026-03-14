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
