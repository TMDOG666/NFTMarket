import { MongoClient } from 'mongodb';
import { Client } from '@elastic/elasticsearch';
import fs from 'fs';

// MongoDB 和 Elasticsearch 配置
const MONGO_URI = 'mongodb://localhost:27017';
const MONGO_DB = 'nft_database';
const COLLECTIONS = [
    {
        name: 'auctioncollectibles',
        index: 'auction_collectibles',
        mapping: {
            id: { type: 'integer' },
            tokenId: { type: 'integer' },
            uri: { type: 'keyword' },
            owner: { type: 'keyword' },
            seller: { type: 'keyword' },
            startPrice: { type: 'double' },
            highestBid: { type: 'double' },
            highestBidder: { type: 'keyword' },
            endTime: { type: 'long' },
            isActive: { type: 'boolean' },
            minIncrement: { type: 'double' },
            metadata: { type: 'object', enabled: false },
            color: { type: 'text' },
        },
    },
    {
        name: 'nftcollectibles',
        index: 'nft_collectibles',
        mapping: {
            id: { type: 'integer' },
            uri: { type: 'keyword' },
            owner: { type: 'keyword' },
            seller: { type: 'keyword' },
            price: { type: 'double' },
            isList: { type: 'boolean' },
            royaltyRate: { type: 'double' },
            metadata: { type: 'object', enabled: false },
            color: { type: 'text' },
        },
    },
];

const mongoClient = new MongoClient(MONGO_URI);
// 配置 Elasticsearch 客户端
const esClient = new Client({
    node: 'https://localhost:9200',
    auth: {
        username: 'elastic',
        password: 'KbLI*rPkqSBMfr85LNOl',
    },
    tls: {
        ca: './http_ca.crt',
        rejectUnauthorized: false,
    },
});

// 设置 Elasticsearch 索引及映射配置的函数
const setupElasticIndex = async (index, mapping) => {
    const exists = await esClient.indices.exists({ index });

    if (!exists) {
        await esClient.indices.create({
            index,
            body: {
                mappings: { properties: mapping },
            },
        });
        console.log(`索引 ${index} 创建成功。`);
    } else {
        console.log(`索引 ${index} 已存在。`);
    }
};

// 从 MongoDB 同步所有数据到 Elasticsearch 的函数
const bulkSync = async (collectionName, indexName) => {
    const db = mongoClient.db(MONGO_DB);
    const collection = db.collection(collectionName);

    // 获取 MongoDB 集合中的所有数据
    const data = await collection.find().toArray();

    console.log(`正在同步 ${data.length} 条文档到索引 ${indexName}...`);

    // 执行批量操作
    try {
        const bulkResult = await esClient.helpers.bulk({
            datasource: data, // 数据源
            onDocument: (doc) => {
                // 创建批量操作文档，并移除 `_id` 字段
                const { _id, ...docWithoutId } = doc;
                return {
                    index: {
                        _index: indexName,
                        _id: _id.toString(), // 使用 `_id` 作为文档ID
                    },
                    document: docWithoutId, // 提供不含 `_id` 的文档体
                };
            },
        });

        if (bulkResult.errors) {
            console.error(`索引 ${indexName} 的批量同步时发生错误:`, bulkResult);
        } else {
            console.log(`成功同步 ${data.length} 条文档到索引 ${indexName}。`);
        }
    } catch (error) {
        console.error('批量操作失败:', error);
    }
};


// 实时监听 MongoDB 的变化并同步到 Elasticsearch 的函数
const watchChanges = async (collectionName, indexName) => {
    const db = mongoClient.db(MONGO_DB);
    const collection = db.collection(collectionName);

    const changeStream = collection.watch();

    changeStream.on('change', async (change) => {
        const { operationType, fullDocument, documentKey } = change;

        try {
            if (operationType === 'insert' || operationType === 'update') {
                // 插入或更新文档
                await esClient.index({
                    index: indexName,
                    id: documentKey._id.toString(),
                    body: fullDocument,
                });
                console.log(`文档 ${documentKey._id} 已同步到索引 ${indexName}。`);
            } else if (operationType === 'delete') {
                // 删除文档
                await esClient.delete({
                    index: indexName,
                    id: documentKey._id.toString(),
                });
                console.log(`文档 ${documentKey._id} 已从索引 ${indexName} 中删除。`);
            }
        } catch (error) {
            console.error(`同步索引 ${indexName} 的文档时发生错误:`, error);
        }
    });
};

// 主函数，用于设置和启动所有集合的同步
const main = async () => {
    try {
        await mongoClient.connect();

        for (const { name, index, mapping } of COLLECTIONS) {
            console.log(`正在为集合 ${name} 设置 Elasticsearch 索引...`);
            await setupElasticIndex(index, mapping);

            console.log(`正在进行集合 ${name} 的批量同步...`);
            await bulkSync(name, index);

            console.log(`正在监听集合 ${name} 的变化...`);
            await watchChanges(name, index);
        }
    } catch (error) {
        console.error('同步过程中发生错误:', error);
    } finally {
        // 当程序退出时可选地关闭 MongoDB 连接
        process.on('SIGINT', async () => {
            await mongoClient.close();
            console.log('MongoDB 连接已关闭。');
            process.exit();
        });
    }
};

main();
