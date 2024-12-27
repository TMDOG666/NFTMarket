import { AuctionCollectible, NFTCollectible } from "../models/dataModels.js";

// 定时任务函数
export const checkAuctionStatus = async () => {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000); // 获取当前时间的秒数
    const expiredAuctions = await AuctionCollectible.find({
      endTime: { $lt: currentTimeInSeconds }, // 使用秒
      isActive: true,
    });
  
    if (expiredAuctions.length > 0) {
      const updatedAuctions = [];
  
      // 遍历每个过期的拍卖，更新 isActive 和 owner
      for (let auction of expiredAuctions) {
        let updatedAuction;
  
        // 如果有最高出价者，更新 AuctionCollectible 的 owner 为最高出价者
        if (auction.highestBidder) {
          auction.owner = auction.highestBidder;
  
          // 更新 NFTCollectible 的 owner 为最高出价者
          const nftCollectible = await NFTCollectible.findOne({ id: auction.tokenId });
          if (nftCollectible) {
            nftCollectible.owner = auction.highestBidder;
            await nftCollectible.save();
            console.log(`NFTCollectible with id ${auction.id} owner updated to ${auction.highestBidder}`);
          }
        }
  
        // 更新拍卖物品的 isActive 为 false
        auction.isActive = false;
        updatedAuction = await auction.save();
  
        updatedAuctions.push(updatedAuction);
      }
  
      console.log(`Updated ${updatedAuctions.length} expired auction(s) to inactive.`);
    }
  };
  