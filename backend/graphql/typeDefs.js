import { gql } from "apollo-server";

// 3. 定义 GraphQL 类型
export const typeDefs = gql`
  scalar Date
  scalar JSON

  type AuctionCollectible {
    id: Int!
    tokenId: Int!
    uri: String!
    owner: String!
    seller: String!
    startPrice: Float!
    highestBid: Float
    highestBidder: String
    endTime: Float!
    isActive: Boolean!
    minIncrement: Float!
    color: String!
    metadata: JSON
  }

  type NFTCollectible {
    id: Int!
    uri: String!
    owner: String!
    seller: String!
    price: Float!
    isList: Boolean!
    royaltyRate: Float!
    color: String!
    metadata: JSON
  }

  type NFTBlindBox {
    id: Int!
    tokenIds: [Int]!
    describes: String!
    tags: [String]!
    seller: String!
    isActive: Boolean!
    price: Float!
    coverUrl: String!
  }

  type NFTPaginatedResult {
    totalCount: Int!
    items: [NFTCollectible]!
  }

  type NFTAuctionPaginatedResult {
    totalCount: Int!
    items: [AuctionCollectible]!
  }

  type NFTBlindBoxPaginatedResult {
    totalCount: Int!
    items: [NFTBlindBox]!
  }


  type Query {
    # AuctionCollectible 查询
    getAllListAuctionCollectiblesBySeller(seller: String!, limit: Int, offset: Int): NFTAuctionPaginatedResult
    getAllListAuctionCollectibles(limit: Int, offset: Int): NFTAuctionPaginatedResult
    getAllAuctionCollectibles(limit: Int, offset: Int): NFTAuctionPaginatedResult
    getAuctionCollectiblesBySeller(seller: String!, limit: Int, offset: Int): NFTAuctionPaginatedResult

    # NFTCollectible 查询
    getAllListedNFTCollectiblesBySeller(seller: String!, limit: Int, offset: Int): NFTPaginatedResult
    getAllListedNFTCollectibles(limit: Int, offset: Int): NFTPaginatedResult
    getAllNFTCollectibles(limit: Int, offset: Int): NFTPaginatedResult
    getNFTCollectiblesByOwner(owner: String!, limit: Int, offset: Int): NFTPaginatedResult
    getNFTCollectibleById(id: Int!): AuctionCollectible
    getNFTCollectibleByIds(ids: [Int]!, limit: Int, offset: Int): NFTPaginatedResult

    # NFTBlindBox 查询
    getAllNFTBlindBoxes(limit: Int, offset: Int): NFTBlindBoxPaginatedResult
    getAllNFTBlindBoxBySeller(seller: String!, limit: Int, offset: Int): NFTBlindBoxPaginatedResult
    getNFTBlindBoxById(id: Int!): NFTBlindBox


    # Search 查询
    # NFTCollectible 查询
    searchNFTCollectibles(
      seller: String
      priceRange: [Float]
      isList: Boolean
      color: String
      metadataSearch: String
      limit: Int
      offset: Int
    ): NFTPaginatedResult

    # AuctionCollectible 查询
    searchAuctionCollectibles(
      seller: String
      startPriceRange: [Float]
      isActive: Boolean
      color: String
      metadataSearch: String
      limit: Int
      offset: Int
    ): NFTAuctionPaginatedResult

    # NFTBlindBox 查询
    searchNFTBlindBoxes(
      seller: String
      priceRange: [Float]
      isActive: Boolean
      describesSearch: String
      tags: [String]
      limit: Int
      offset: Int
    ): NFTBlindBoxPaginatedResult
  }

  type Mutation {
  # AuctionCollectible 操作
  upsertAuctionCollectible(
    id: Int!
    tokenId: Int!
    uri: String!
    owner: String!
    seller: String!
    startPrice: Float!
    highestBid: Float
    highestBidder: String
    endTime: Float!
    isActive: Boolean!
    minIncrement: Float!
    color: String!
    metadata: JSON
  ): AuctionCollectible

  # 修改 AuctionCollectible 的 owner
  updateAuctionCollectibleOwner(id: Int!, owner: String!): AuctionCollectible

  # 竞拍 设置最高出价
  updateAuctionCollectibleHighestBid(id: Int!, highestBidder: String!, highestBid: Float!): AuctionCollectible

  # 竞拍 结束
  updateAuctionCollectibleEnd(id: Int!,owner: String!): AuctionCollectible

  # NFTCollectible 操作
  upsertNFTCollectible(
    id: Int!
    uri: String!
    owner: String!
    seller: String!
    price: Float!
    isList: Boolean!
    royaltyRate: Float!
    color: String!
    metadata: JSON
  ): NFTCollectible

  # 修改 NFTCollectible 的 owner
  updateNFTCollectibleOwner(id: Int!, owner: String!): NFTCollectible

  # 批量修改 NFTCollectible 的 owner
  updateBatchNFTCollectibleOwner(ids: [Int]!, owner: String!): [NFTCollectible]

  # 购买 NFTCollectible
  updateBuyNFTCollectible(id: Int!, owner: String!): NFTCollectible

  # 下架 NFTCollectible
  updatePullNFTCollectible(id: Int!, owner: String!): NFTCollectible

  # 修改 NFTCollectible 的 价格
  updateNFTCollectiblePrice(id: Int!, price: Float!): NFTCollectible

  # 更新已经上架的 NFT
  updateNFTCollectible(
    id: Int!
    price: Float!
    isList: Boolean!
    seller: String!
  ): NFTCollectible


  # NFTBlindBox 操作
  upsertNFTBlindBox(
    id: Int!
    tokenIds: [Int]!
    describes: String!
    tags: [String]!
    seller: String!
    isActive: Boolean!
    price: Float!
    coverUrl: String!
  ): NFTBlindBox

  # 下架 NFTBlindBox
  updatePullNFTBlindBox(id: Int!): NFTBlindBox

  # 购买 NFTBlindBox
  updateBuyNFTBlindBox(id: Int! , tokenId: Int!): NFTBlindBox
 
  # 补货 NFTBlindBox
  updateNFTBlindBoxTokenIds(id: Int!, tokenIds: [Int]!): NFTBlindBox
}

`;


