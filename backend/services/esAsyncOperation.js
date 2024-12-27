import { NFTCollectible, NFTBlindBox, AuctionCollectible ,AuctionCollectibleSchema, NFTCollectibleSchema,NFTBlindBoxSchema} from '../models/dataModels.js';
import client from '../elasticsearch/elasticsearch.js';

// 同步 AuctionCollectible 数据到 Elasticsearch
const syncAuctionCollectibleToElasticsearch = async (auctionCollectible) => {
    const { id, tokenId, uri, owner, seller, startPrice, highestBid, highestBidder, endTime, isActive, minIncrement, color, metadata } = auctionCollectible;

    await client.index({
        index: 'auction_collectibles', // 对应 Elasticsearch 中的索引
        id: auctionCollectible.id.toString(),
        body: {
            id,
            tokenId,
            uri,
            owner,
            seller,
            startPrice,
            highestBid,
            highestBidder,
            endTime,
            isActive,
            minIncrement,
            color,
            metadata,
        },
    });
};

// 同步 NFTCollectible 数据到 Elasticsearch
const syncNFTCollectibleToElasticsearch = async (nftCollectible) => {
    const { id, tokenId, uri, owner, seller, price, isList, royaltyRate, metadata, color } = nftCollectible;

    await client.index({
        index: 'nft_collectibles', // 对应 Elasticsearch 中的索引
        id: nftCollectible.id.toString(),
        body: {
            id,
            tokenId,
            uri,
            owner,
            seller,
            price,
            isList,
            royaltyRate,
            metadata,
            color,
        },
    });
};

// 同步 NFTBlindBox 数据到 Elasticsearch
const syncNFTBlindBoxToElasticsearch = async (nftBlindBox) => {
    const { id, tokenIds, describes, tags, seller, isActive, price, coverUrl, metadata } = nftBlindBox;

    await client.index({
        index: 'nft_blind_boxes', // 对应 Elasticsearch 中的索引
        id: nftBlindBox.id.toString(),
        body: {
            id,
            tokenIds,
            describes,
            tags,
            seller,
            isActive,
            price,
            coverUrl,
            metadata,
        },
    });
};

// 同步数据库数据到 Elasticsearch（新增和更新）
const syncDataToElasticsearch = async (document, modelName) => {
    try {
        switch (modelName) {
            case "AuctionCollectible" :
                await syncAuctionCollectibleToElasticsearch(document);
                break;
            case "NFTCollectible" :
                await syncNFTCollectibleToElasticsearch(document);
                break;
            case "NFTBlindBox" :
                await syncNFTBlindBoxToElasticsearch(document);
                break;
        }
        console.log("Document updated in Elasticsearch");
    } catch (error) {
        console.error(`Error syncing ${modelName} with Elasticsearch: `, error);
    }
};


  

// 批量同步数据
const bulkSyncDataToElasticsearch = async (documents, modelName) => {
    const body = [];

    documents.forEach((document) => {
        if (!document.id) {
            throw new Error(`Document ID is missing for ${modelName}`);
        }
        const id = document.id.toString();
        body.push({
            update: { _index: modelName.toLowerCase() + 's', _id: id },
        });
        body.push({
            doc: document,
            doc_as_upsert: true,
        });
    });

    try {
        const { body: bulkResponse } = await client.bulk({ body });
        if (bulkResponse.errors) {
            console.error('Error occurred during bulk sync:', bulkResponse.errors);
        }
    } catch (error) {
        console.error(`Error syncing ${modelName} with Elasticsearch: `, error);
    }
};

export { syncAuctionCollectibleToElasticsearch, syncNFTCollectibleToElasticsearch, syncNFTBlindBoxToElasticsearch, syncDataToElasticsearch, bulkSyncDataToElasticsearch };
