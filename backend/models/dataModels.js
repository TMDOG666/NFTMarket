import { syncDataToElasticsearch } from "../services/esAsyncOperation.js";
import client from "../elasticsearch/elasticsearch.js"
import mongoose from "mongoose";
import dotenv from "dotenv";

// 环境变量配置
dotenv.config();

// 1. 连接 MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nft_database";
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// 2. 定义 MongoDB 数据模型
const AuctionCollectibleSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    tokenId: { type: Number, required: true, unique: true },
    uri: { type: String, required: true },
    owner: { type: String, required: true, index: true }, // 索引
    seller: { type: String, required: true },
    startPrice: { type: Number, required: true },
    highestBid: { type: Number, default: 0 },
    highestBidder: { type: String, default: "" },
    endTime: { type: Number, required: true },
    isActive: { type: Boolean, required: true, default: false },
    minIncrement: { type: Number, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    color: { type: String, required: true },
});

const NFTCollectibleSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    uri: { type: String, required: true },
    owner: { type: String, required: true, index: true }, // 索引
    seller: { type: String, required: true },
    price: { type: Number, required: true },
    isList: { type: Boolean, required: true },
    royaltyRate: { type: Number, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    color: { type: String, required: true },
});

const NFTBlindBoxSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    tokenIds: { type: [Number], required: true },
    describes: { type: String, required: true },
    tags: { type: [String], required: true },
    seller: { type: String, required: true },
    isActive: { type: Boolean, required: true },
    price: { type: Number, required: true },
    coverUrl: { type: String, required: true },
});




// 在模型的保存操作时，自动同步数据到 Elasticsearch
AuctionCollectibleSchema.post('save', async function (doc) {
    console.log("AuctionCollectible saved", doc);
    try {
        await syncDataToElasticsearch(doc, 'AuctionCollectible');
    } catch (err) {
        console.error("Error syncing AuctionCollectible to Elasticsearch:", err);
    }
});

NFTCollectibleSchema.post('save', async function (doc) {
    console.log("NFTCollectible saved", doc);
    try {
        await syncDataToElasticsearch(doc, 'NFTCollectible');
    } catch (err) {
        console.error("Error syncing NFTCollectible to Elasticsearch:", err);
    }
});

NFTBlindBoxSchema.post('save', async function (doc) {
    console.log("NFTBlindBox saved", doc);
    try {
        await syncDataToElasticsearch(doc, 'NFTBlindBox');
    } catch (err) {
        console.error("Error syncing NFTBlindBox to Elasticsearch:", err);
    }
});

// 同步删除操作：当数据从数据库中删除时，删除 Elasticsearch 中对应的文档
AuctionCollectibleSchema.post('remove', async function () {
    try {
        await client.delete({
            index: 'auction_collectibles',
            id: this.id.toString(),
        });
        console.log(`AuctionCollectible with ID ${this.id} removed from Elasticsearch`);
    } catch (err) {
        console.error("Error removing AuctionCollectible from Elasticsearch:", err);
    }
});

NFTCollectibleSchema.post('remove', async function () {
    try {
        await client.delete({
            index: 'nft_collectibles',
            id: this.id.toString(),
        });
        console.log(`NFTCollectible with ID ${this.id} removed from Elasticsearch`);
    } catch (err) {
        console.error("Error removing NFTCollectible from Elasticsearch:", err);
    }
});

NFTBlindBoxSchema.post('remove', async function () {
    try {
        await client.delete({
            index: 'nft_blind_boxes',
            id: this.id.toString(),
        });
        console.log(`NFTBlindBox with ID ${this.id} removed from Elasticsearch`);
    } catch (err) {
        console.error("Error removing NFTBlindBox from Elasticsearch:", err);
    }
});


const AuctionCollectible = mongoose.model("AuctionCollectible", AuctionCollectibleSchema);
const NFTCollectible = mongoose.model("NFTCollectible", NFTCollectibleSchema);
const NFTBlindBox = mongoose.model("NFTBlindBox", NFTBlindBoxSchema);

console.log("Models and post-save hooks set up");
export { AuctionCollectible, NFTCollectible, NFTBlindBox, AuctionCollectibleSchema, NFTCollectibleSchema, NFTBlindBoxSchema };