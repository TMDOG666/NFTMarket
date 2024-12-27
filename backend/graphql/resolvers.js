import { AuctionCollectible, NFTBlindBox, NFTCollectible } from '../models/dataModels.js';
import { validateAuctionCollectible, validateNFTBlindBox, validateNFTCollectible } from './validation.js';
import { upsert, fetchWithPagination } from '../services/dbOperation.js';
import { searchAuctionCollectibles, searchNFTBlindBoxes, searchNFTCollectibles } from '../services/esSerchSerevice.js';


// 过滤掉空值或者 null 的参数
// 过滤掉空值、null、undefined、空字符串的参数
const filterNullOrEmptyParams = (params) => {
    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => {
        // 对单个参数的判断：排除 null、undefined 和空字符串
        if (value === null || value === undefined || value === "") {
          return false;
        }
  
        // 对数组的判断：排除包含 null 的数组
        if (Array.isArray(value)) {
          // 如果数组中所有元素都是 null，移除该数组
          if (value.every(item => item === null)) {
            return false;
          }
          // 移除数组中的 null 元素
          return value.some(item => item !== null);
        }
  
        // 其他情况保留
        return true;
      })
    );
  };
  


// 4. 定义解析器
export const resolvers = {
    Query: {
        // AuctionCollectible 查询
        getAllListAuctionCollectiblesBySeller: async (_, { seller, limit = 10, offset = 0 }) => {
            const totalCount = await AuctionCollectible.countDocuments({ seller }); // 只计算该用户创建的 AuctionCollectible
            const items = await fetchWithPagination(AuctionCollectible, { seller }, { id: 1 }, limit, offset);
            return { totalCount, items };
        },
        getAllListAuctionCollectibles: async (_, { limit = 10, offset = 0 }) => {
            const totalCount = await AuctionCollectible.countDocuments({ isActive: true }); // 计算所有 AuctionCollectible 的数量
            const items = await fetchWithPagination(AuctionCollectible, { isActive: true }, { id: 1 }, limit, offset);
            return { totalCount, items };
        },
        getAllAuctionCollectibles: async (_, { limit = 10, offset = 0 }) => {
            const totalCount = await AuctionCollectible.countDocuments(); // 计算所有 AuctionCollectible 的数量
            const items = await fetchWithPagination(AuctionCollectible, {}, { id: 1 }, limit, offset);
            return { totalCount, items };
        },
        getAuctionCollectiblesBySeller: async (_, { seller, limit = 10, offset = 0 }) => {
            const totalCount = await AuctionCollectible.countDocuments({ seller: seller });
            const items = await fetchWithPagination(AuctionCollectible, { seller }, { id: 1 }, limit, offset);
            return { totalCount, items };
        },

        // NFTCollectible 查询
        // 查询所有已经上架的 NFT
        getAllListedNFTCollectibles: async (_, { limit = 10, offset = 0 }) => {
            const totalCount = await NFTCollectible.countDocuments({ isList: true }); // 只计算 isList 为 true 的 NFT
            const items = await fetchWithPagination(NFTCollectible, { isList: true }, { id: 1 }, limit, offset); // 只查询 isList 为 true 的 NFT
            return { totalCount, items };
        },
        getAllListedNFTCollectiblesBySeller: async (_, { seller, limit = 10, offset = 0 }) => {
            const totalCount = await NFTCollectible.countDocuments({ isList: true, seller: seller }); // 只计算 isList 为 true 的 NFT
            const items = await fetchWithPagination(NFTCollectible, { isList: true, seller: seller }, { id: 1 }, limit, offset); // 只查询 isList 为 true 的 NFT
            return { totalCount, items };
        },
        getAllNFTCollectibles: async (_, { limit = 10, offset = 0 }) => {
            const totalCount = await NFTCollectible.countDocuments();
            const items = await fetchWithPagination(NFTCollectible, {}, { id: 1 }, limit, offset);
            return { totalCount, items };
        },
        getNFTCollectiblesByOwner: async (_, { owner, limit = 10, offset = 0 }) => {
            const totalCount = await NFTCollectible.countDocuments({ owner: owner }); // 只计算 isList 为 true 的 NFT
            const items = await fetchWithPagination(NFTCollectible, { owner }, { id: 1 }, limit, offset);
            return { totalCount, items };
        },
        getNFTCollectibleById: async (_, { id }) => {
            return await NFTCollectible.findOne({ id });
        },
        getNFTCollectibleByIds: async (_, { ids, limit = 10, offset = 0 }) => {
            const totalCount = ids.length;
            const items = await fetchWithPagination(NFTCollectible, { id: { $in: ids } }, { id: 1 }, limit, offset);
            return { totalCount, items };
        },

        // NFTBlindBox 查询
        getAllNFTBlindBoxes: async (_, { limit = 10, offset = 0 }) => {
            const totalCount = await NFTBlindBox.countDocuments(); // 计算所有 NFTBlindBox 的数量
            const items = await fetchWithPagination(NFTBlindBox, { isActive: true }, { id: 1 }, limit, offset); // 查询所有 NFTBlindBox
            return { totalCount, items };
        },
        getAllNFTBlindBoxBySeller: async (_, { seller, limit = 10, offset = 0 }) => {
            const totalCount = await NFTBlindBox.countDocuments({ seller: seller }); // 只计算该用户创建的 NFTBlindBox
            const items = await fetchWithPagination(NFTBlindBox, { seller }, { id: 1 }, limit, offset); // 查询该用户创建的 NFTBlindBox
            return { totalCount, items };
        },
        getNFTBlindBoxById: async (_, { id }) => {
            return await NFTBlindBox.findOne({ id });
        },


        // NFTCollectible 查询
        searchNFTCollectibles: async (_, { seller, priceRange, isList, color, metadataSearch, limit, offset }) => {
            // 过滤掉空值或 null 的参数
            const filteredParams = filterNullOrEmptyParams({ seller, priceRange, isList, color, metadataSearch, limit, offset });
            const response = await searchNFTCollectibles(filteredParams);
            return {
                totalCount: response.hits.total.value,
                items: response.hits.hits.map(hit => hit._source),
            };
        },

        // AuctionCollectible 查询
        searchAuctionCollectibles: async (_, { seller, startPriceRange, isActive, color, metadataSearch, limit, offset }) => {
            // 过滤掉空值或 null 的参数
            const filteredParams = filterNullOrEmptyParams({ seller, startPriceRange, isActive, color, metadataSearch, limit, offset });

            const response = await searchAuctionCollectibles(filteredParams);
            return {
                totalCount: response.hits.total.value,
                items: response.hits.hits.map(hit => hit._source),
            };
        },

        // NFTBlindBox 查询
        searchNFTBlindBoxes: async (_, { seller, priceRange, isActive, describesSearch, tags, limit, offset }) => {
            // 过滤掉空值或 null 的参数
            const filteredParams = filterNullOrEmptyParams({ seller, priceRange, isActive, describesSearch, tags, limit, offset });

            const response = await searchNFTBlindBoxes(filteredParams);
            return {
                totalCount: response.hits.total.value,
                items: response.hits.hits.map(hit => hit._source),
            };
        },


    },
    Mutation: {
        // AuctionCollectible 操作
        upsertAuctionCollectible: async (_, args) => {
            validateAuctionCollectible(args); // 数据校验
            return await upsert(AuctionCollectible, { id: args.id }, args);
        },

        // 修改 AuctionCollectible 的 owner
        updateAuctionCollectibleOwner: async (_, { id, owner }) => {
            const auctionCollectible = await AuctionCollectible.findOne({ id });
            if (!auctionCollectible) {
                throw new Error("AuctionCollectible not found");
            }

            // 更新 owner
            auctionCollectible.owner = owner;
            await auctionCollectible.save();
            return auctionCollectible;
        },

        updateAuctionCollectibleHighestBid: async (_, { id, highestBidder, highestBid }) => {
            const auctionCollectible = await AuctionCollectible.findOne({ id });
            if (!auctionCollectible) {
                throw new Error("AuctionCollectible not found");
            }
            auctionCollectible.highestBidder = highestBidder;
            auctionCollectible.highestBid = highestBid;
            await auctionCollectible.save();
            return auctionCollectible;
        },

        updateAuctionCollectibleEnd: async (_, { id, owner }) => {
            const auctionCollectible = await AuctionCollectible.findOne({ id });
            if (!auctionCollectible) {
                throw new Error("AuctionCollectible not found");
            }

            auctionCollectible.owner = owner;
            auctionCollectible.isActive = false;
            await auctionCollectible.save();
            return auctionCollectible;
        },

        // NFTCollectible 操作
        upsertNFTCollectible: async (_, args) => {
            validateNFTCollectible(args); // 数据校验
            return await upsert(NFTCollectible, { id: args.id }, args);
        },

        // 修改 NFTCollectible 的 owner
        updateNFTCollectibleOwner: async (_, { id, owner }) => {
            const nftCollectible = await NFTCollectible.findOne({ id });
            if (!nftCollectible) {
                throw new Error("NFTCollectible not found");
            }

            // 更新 owner
            nftCollectible.owner = owner;
            await nftCollectible.save();
            return nftCollectible;
        },

        updateBatchNFTCollectibleOwner: async (_, { ids, owner }) => {
            const nfts = await NFTCollectible.find({ id: { $in: ids } });
            for (const nft of nfts) {
                nft.owner = owner;
                await nft.save(); // 保留钩子触发
            }
            return nfts;
        },
        

        // 购买 NFTCollectible
        updateBuyNFTCollectible: async (_, { id, owner }) => {
            const nftCollectible = await NFTCollectible.findOne({ id });
            if (!nftCollectible) {
                throw new Error("NFTCollectible not found");
            }

            // 更新 owner
            nftCollectible.owner = owner;
            nftCollectible.isList = false;
            await nftCollectible.save();
            return nftCollectible;
        },

        // 修改 NFTCollectible 的 price
        updateNFTCollectiblePrice: async (_, { id, price }) => {
            const nftCollectible = await NFTCollectible.findOne({ id });
            if (!nftCollectible) {
                throw new Error("NFTCollectible not found");
            }

            // 更新 owner
            nftCollectible.price = price;
            await nftCollectible.save();
            return nftCollectible;
        },

        // 更新已经上架的 NFT
        updateNFTCollectible: async (_, { id, price, isList, seller }) => {
            const nft = await NFTCollectible.findOne({ id });
            if (!nft) {
                throw new Error("NFT not found");
            }

            // 更新价格和是否上架状态
            nft.price = price;
            nft.isList = isList;
            nft.seller = seller;

            await nft.save();
            return nft;
        },

        // 下架 NFTCollectible
        updatePullNFTCollectible: async (_, { id, owner }) => {
            const nftCollectible = await NFTCollectible.findOne({ id });
            if (!nftCollectible) {
                throw new Error("NFTCollectible not found");
            }

            // 更新 owner
            nftCollectible.owner = owner;
            nftCollectible.isList = false;
            await nftCollectible.save();
            return nftCollectible;
        },

        // NFTBlindBox 操作
        upsertNFTBlindBox: async (_, args) => {
            validateNFTBlindBox(args); // 数据校验
            return await upsert(NFTBlindBox, { id: args.id }, args);
        },

        // 下架盲盒
        updatePullNFTBlindBox: async (_, { id }) => {
            const nftBlindBox = await NFTBlindBox.findOne({ id });
            if (!nftBlindBox) {
                throw new Error("NFTBlindBox not found");
            }
            nftBlindBox.isActive = false;
            await nftBlindBox.save();
            return nftBlindBox;
        },

        // 购买盲盒 将tokenIds对应的tokenId删除
        updateBuyNFTBlindBox: async (_, { id, tokenId }) => {
            const nftBlindBox = await NFTBlindBox.findOne({ id });
            if (!nftBlindBox) {
                throw new Error("NFTBlindBox not found");
            }

            nftBlindBox.tokenIds = nftBlindBox.tokenIds.filter((id) => id !== tokenId);
            await nftBlindBox.save();
            return nftBlindBox;
        },

        updateNFTBlindBoxTokenIds: async (_, { id, tokenIds }) => {
            const nftBlindBox = await NFTBlindBox.findOne({ id });
            if (!nftBlindBox) {
                throw new Error("NFTBlindBox not found");
            }
            nftBlindBox.tokenIds = tokenIds;
            await nftBlindBox.save();
            return nftBlindBox;
        },
    },
};

