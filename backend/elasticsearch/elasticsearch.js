import { Client } from '@elastic/elasticsearch';

const client = new Client({
    node: 'http://localhost:9200',
    auth: {
        apiKey: 'bnhBQUFwUUJYSWZWUzNReGRtU2s6aGt0TWV0ekRRX3FyeC1mSVFoTXZ6Zw==', // 将此处替换为你的 API 密钥
    }
});

const createAllIndexes = async () => {
    try {
        // 创建 AuctionCollectible 索引
        const auctionCollectibleExists = await client.indices.exists({ index: 'auction_collectibles' });
        console.log(auctionCollectibleExists);
        if (auctionCollectibleExists) {
            console.log("AuctionCollectible 索引已存在");
        } else {
            await client.indices.create({
                index: 'auction_collectibles',
                body: {
                    mappings: {
                        properties: {
                            id: { type: 'integer' },
                            tokenId: { type: 'integer' },
                            uri: { type: 'text' },
                            owner: { type: 'keyword' },
                            seller: { type: 'keyword' },
                            startPrice: { type: 'float' },
                            highestBid: { type: 'float' },
                            highestBidder: { type: 'keyword' },
                            endTime: { type: 'integer' },
                            isActive: { type: 'boolean' },
                            minIncrement: { type: 'float' },
                            metadata: {
                                type: 'object',
                                dynamic: 'true', // 开启动态映射
                            },
                            color: { type: 'keyword' },
                        },
                    },
                },
            });
            console.log("AuctionCollectible 索引创建成功");
        }



        // 创建 NFTCollectible 索引
        const nftCollectibleExists = await client.indices.exists({ index: 'nft_collectibles' });
        if (nftCollectibleExists) {
            console.log("NFTCollectible 索引已存在");
            
        } else {
            await client.indices.create({
                index: 'nft_collectibles',
                body: {
                    mappings: {
                        properties: {
                            id: { type: 'integer' },
                            uri: { type: 'text' },
                            owner: { type: 'keyword' },
                            seller: { type: 'keyword' },
                            price: { type: 'float' },
                            isList: { type: 'boolean' },
                            royaltyRate: { type: 'float' },
                            metadata: {
                                type: 'object',
                                dynamic: 'true', // 开启动态映射
                            },
                            color: { type: 'keyword' },
                        },
                    },
                },
            });
            console.log("NFTCollectible 索引创建成功");
        }



        // 创建 NFTBlindBox 索引
        const nftBlindBoxExists = await client.indices.exists({ index: 'nft_blind_boxes' });
        if (nftBlindBoxExists) {
            console.log("NFTBlindBox 索引已存在");
        } else {
            await client.indices.create({
                index: 'nft_blind_boxes',
                body: {
                    mappings: {
                        properties: {
                            id: { type: 'integer' },
                            tokenIds: { type: 'integer' },
                            describes: { type: 'text' },
                            tags: { type: 'keyword' },
                            seller: { type: 'keyword' },
                            isActive: { type: 'boolean' },
                            price: { type: 'float' },
                            coverUrl: { type: 'text' },
                        },
                    },
                },
            });
            console.log("NFTBlindBox 索引创建成功");
        }
    } catch (error) {
        console.error("创建索引时发生错误: ", error);
    }
};


// 调用创建索引的函数
createAllIndexes();

export default client;
