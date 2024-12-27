import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';

// 配置环境变量
dotenv.config();

// 创建 Express 应用
const app = express();
const port = process.env.PORT || 5000;

// 连接 MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nft_database';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// 使用 body-parser 解析请求体
app.use(bodyParser.json());
app.use(cors())

// 定义 MongoDB 数据模型
const AuctionCollectibleSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  tokenId: { type: Number, required: true, unique: true },
  uri: { type: String, required: true },
  owner: { type: String, required: true },
  seller: { type: String, required: true },
  startPrice: { type: Number, required: true },
  highestBid: { type: Number, required: true, default: 0 },
  highestBidder: { type: String, default: "" },
  endTime: { type: Date, required: true },
  minIncrement: { type: Number, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

const NFTCollectibleSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  uri: { type: String, required: true },
  owner: { type: String, required: true },
  seller: { type: String, required: true },
  price: { type: Number, required: true },
  isList: { type: Boolean, required: true },
  royaltyRate: { type: Number, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

const AuctionCollectible = mongoose.model('AuctionCollectible', AuctionCollectibleSchema);
const NFTCollectible = mongoose.model('NFTCollectible', NFTCollectibleSchema);

// 路由：添加拍卖收藏品
app.post('/addAuctionCollectible', async (req, res) => {
  const { id, tokenId, uri, owner, seller, startPrice, highestBid, highestBidder, endTime, minIncrement, metadata } = req.body;

  try {
    const newAuctionCollectible = new AuctionCollectible({
      id,
      tokenId,
      uri,
      owner,
      seller,
      startPrice,
      highestBid,
      highestBidder,
      endTime,
      minIncrement,
      metadata
    });

    await newAuctionCollectible.save();
    res.status(201).json({ message: 'Auction collectible added successfully', data: newAuctionCollectible });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding auction collectible', error: err.message });
  }
});

// 路由：添加 NFT 收藏品
app.post('/addNFTCollectible', async (req, res) => {
  const { id, uri, owner, seller, price, isList, royaltyRate, metadata } = req.body;

  try {
    const newNFTCollectible = new NFTCollectible({
      id,
      uri,
      owner,
      seller,
      price,
      isList,
      royaltyRate,
      metadata
    });

    await newNFTCollectible.save();
    res.status(201).json({ message: 'NFT collectible added successfully', data: newNFTCollectible });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding NFT collectible', error: err.message });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
