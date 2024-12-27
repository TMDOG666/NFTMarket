import { fetchGraphQL } from "./graphql";



export const GraphqlServer = () => {
  // 添加 NFT
  const addNFTCollectible = async (input: {
    id: number;
    uri: string;
    owner: string;
    royaltyRate: number;
    color: string;
    metadata: Record<string, any>;
  }) => {
    const mutation = `
      mutation UpsertNFTCollectible(
        $id: Int!,
        $uri: String!,
        $owner: String!,
        $royaltyRate: Float!,
        $color: String!,
        $metadata: JSON
      ) {
        upsertNFTCollectible(
          id: $id,
          uri: $uri,
          owner: $owner,
          seller: "0x000000000000000000000000000000000000000",
          price: 0,
          isList: false,
          royaltyRate: $royaltyRate,
          color: $color,
          metadata: $metadata
        ) {
          id
          uri
          owner
          metadata
          color
        }
      }
    `;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("新增的 NFT:", result.upsertNFTCollectible);
      return result.upsertNFTCollectible;
    } catch (error) {
      console.error("Error adding NFT:", error);
      throw error;
    }
  };

  // 添加上架 NFT(修改之前上架的 NFT)
  const addNFTListCollectible = async (input: {
    id: number;
    price: number;
    isList: boolean;
    seller: string;
  }) => {
    const mutation = `
      mutation UpdateNFTListCollectible(
        $id: Int!,
        $price: Float!,
        $isList: Boolean!,
        $seller: String!
      ) {
        updateNFTCollectible(
          id: $id,
          price: $price,
          isList: $isList,
          seller: $seller
        ) {
          id
          price
          isList
          seller
        }
      }`;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("修改的 NFT:", result.updateNFTCollectible);
      return result.updateNFTCollectible;
    } catch (error) {
      console.error("Error updating NFT list:", error);
      throw error;
    }
  };

  // 修改 NFT 的 owner
  const updateNFTCollectibleOwner = async (input: {
    id: number;
    owner: string;
  }) => {
    const mutation = `
      mutation UpdateNFTCollectibleOwner(
        $id: Int!,
        $owner: String!
      ) {
        updateNFTCollectibleOwner(
          id: $id,
          owner: $owner
        ) {
          id
          owner
        }
      }`;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("修改的 NFT owner:", result.updateNFTCollectibleOwner);
      return result.updateNFTCollectibleOwner;
    } catch (error) {
      console.error("Error updating NFT owner:", error);
      throw error;
    }
  };

  // 修改 批量NFT 的 owner
  const updateBatchNFTCollectibleOwner = async (input: {
    ids: number[];
    owner: string;
  }) => {
    const mutation = `
      mutation UpdateBatchNFTCollectibleOwner($ids: [Int]!, $owner: String!) {
  updateBatchNFTCollectibleOwner(ids: $ids, owner: $owner) {
    id
    uri
    owner
    seller
    price
    isList
    royaltyRate
    color
    metadata
  }
}`;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("批量修改的 NFT owner:", result.updateBatchNFTCollectibleOwner);
      return result.updateBatchNFTCollectibleOwner;
    } catch (error) {
      console.error("Error updating batch NFT owner:", error);
      throw error;
    }
  };

  // 修改 NFT 的 Price
  const updateNFTCollectiblePrice = async (input: {
    id: number;
    price: number;
  }) => {
    const mutation = `
      mutation UpdateNFTCollectiblePrice(
        $id: Int!,
        $price: Float!
      ) {
        updateNFTCollectiblePrice(
          id: $id,
          price: $price
        ) {
          id
          price
        }
      }`;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("修改的 NFT owner:", result.updateNFTCollectiblePrice);
      return result.updateNFTCollectiblePrice;
    } catch (error) {
      console.error("Error updating NFT owner:", error);
      throw error;
    }
  };

  // 购买 NFT 的 
  const updateBuyNFTCollectible = async (input: {
    id: number;
    owner: string;
  }) => {
    const mutation = `
        mutation UpdateBuyNFTCollectible(
          $id: Int!,
          $owner: String!
        ) {
          updateBuyNFTCollectible(
            id: $id,
            owner: $owner
          ) {
            id
            owner
          }
        }`;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("购买的 NFT owner:", result.updateBuyNFTCollectible);
      return result.updateBuyNFTCollectible;
    } catch (error) {
      console.error("Error updating buy NFT:", error);
      throw error;
    }
  };

  // 下架 NFT
  const updatePullNFTCollectible = async (input: {
    id: number;
    owner: string;
  }) => {
    const mutation = `
        mutation UpdatePullNFTCollectible(
          $id: Int!,
          $owner: String!
        ) {
          updatePullNFTCollectible(
            id: $id,
            owner: $owner
          ) {
            id
            owner
          }
        }`;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("下架的 NFT:", result.updatePullNFTCollectible);
      return result.updatePullNFTCollectible;
    } catch (error) {
      console.error("Error updating pull NFT:", error);
      throw error;
    }
  };

  // 查询所有上架的 NFT
  const queryAllListedNFT = async (limit: number, offset: number): Promise<any> => {
    const query = `
      query GetAllListedNFTCollectibles($limit: Int, $offset: Int) {
        getAllListedNFTCollectibles(limit: $limit, offset: $offset) {
          totalCount
          items {
            id
            uri
            owner
            seller
            price
            isList
            royaltyRate
            color
            metadata
          }
        }
      }
    `;

    try {
      const result = await fetchGraphQL(query, { limit, offset });
      console.log("分页查询的 NFT:", result.getAllListedNFTCollectibles);
      return result.getAllListedNFTCollectibles;
    } catch (error) {
      console.error("Error querying NFTs:", error);
      throw error;
    }
  };

  const queryAccountAuctionNFT = async (seller: string, limit: number, offset: number): Promise<any> => {
    const query = `
    query GetAuctionCollectiblesBySeller($seller: String!, $limit: Int, $offset: Int) {
  getAuctionCollectiblesBySeller(seller: $seller, limit: $limit, offset: $offset) {
    totalCount
    items {
      id
      tokenId
      uri
      owner
      seller
      startPrice
      highestBid
      highestBidder
      endTime
      isActive
      minIncrement
      color
      metadata
    }
  }
}
    `;
    try {
      const result = await fetchGraphQL(query, { seller, limit, offset });
      console.log("分页查询的 NFT:", result.getAuctionCollectiblesBySeller);
      return result.getAuctionCollectiblesBySeller;
    } catch (error) {
      console.error("Error querying NFTs:", error);
      throw error;
    }

  }



  // 查询用户所有上架的 NFT
  const queryAccountListedNFT = async (seller: string, limit: number, offset: number): Promise<any> => {
    const query = `
        query getAllListedNFTCollectiblesBySeller($seller:String!, $limit: Int, $offset: Int) {
          getAllListedNFTCollectiblesBySeller(seller:$seller, limit: $limit, offset: $offset) {
            totalCount
            items {
              id
              uri
              owner
              seller
              price
              isList
              royaltyRate
              color
              metadata
            }
          }
        }
      `;

    try {
      const result = await fetchGraphQL(query, { seller, limit, offset });
      console.log("分页查询的 NFT:", result.getAllListedNFTCollectiblesBySeller);
      return result.getAllListedNFTCollectiblesBySeller;
    } catch (error) {
      console.error("Error querying NFTs:", error);
      throw error;
    }
  };

  // 查询账户的 NFT
  const queryAccountNFT = async (owner: string, limit: number, offset: number): Promise<any> => {
    const query = `
      query GetNFTCollectiblesByOwner($owner: String!, $limit: Int!, $offset: Int!) {
        getNFTCollectiblesByOwner(owner: $owner, limit: $limit, offset: $offset) {
          totalCount
          items {
            id
            uri
            owner
            color
            metadata
          }
        }
      }
    `;

    try {
      const result = await fetchGraphQL(query, { owner, limit, offset });
      console.log("分页查询账户的 NFT:", result.getNFTCollectiblesByOwner);
      return result.getNFTCollectiblesByOwner;
    } catch (error) {
      console.error("Error querying account NFTs:", error);
      throw error;
    }
  };


  const queryNFTById = async (id: number): Promise<any> => {
    const query = `
      query GetNFTCollectibleById($id: Int!) {
        getNFTCollectibleById(id: $id) {
          id
          uri
          owner
          color
          metadata
        }
      }
    `;
    try {
      const result = await fetchGraphQL(query, { id });
      console.log("查询单个 NFT:", result.getNFTCollectibleById);
      return result.getNFTCollectibleById;
    } catch (error) {
      console.error("Error querying NFT by id:", error);
      throw error;
    }

  }

  // 查询账户的 NFT
  const queryNFTByIds = async (ids: number[], limit: number, offset: number): Promise<any> => {
    const query = `
    query Query($ids: [Int]!, $limit: Int, $offset: Int) {
      getNFTCollectibleByIds(ids: $ids, limit: $limit, offset: $offset) {
        totalCount
        items {
          id
          uri
          owner
          seller
          price
          isList
          royaltyRate
          color
          metadata
        }
      }
    }`;
    try {
      const result = await fetchGraphQL(query, { ids, limit, offset });
      console.log("分页查询账户的 NFT:", result.getNFTCollectibleByIds);
      return result.getNFTCollectibleByIds;
    } catch (error) {
      console.error("Error querying account NFTs:", error);
      throw error;
    }

  }

  // 添加拍卖 NFT
  const addAuctionCollectible = async (input: {
    id: number;
    tokenId: number;
    uri: string;
    owner: string;
    seller: string;
    startPrice: number;
    endTime: number;
    isActive: boolean;
    minIncrement: number;
    color: string;
    metadata: Record<string, any>;
    highestBidder?: string | null;
    highestBid?: number | null;
  }) => {
    const mutation = `
      mutation UpsertAuctionCollectible(
  $id: Int!,
  $tokenId: Int!, 
  $uri: String!, 
  $owner: String!, 
  $seller: String!, 
  $startPrice: Float!, 
  $endTime: Float!, 
  $isActive: Boolean!, 
  $minIncrement: Float!, 
  $color: String!, 
  $metadata: JSON, 
  $highestBidder: String, 
  $highestBid: Float
  ) {
  upsertAuctionCollectible(
    id: $id, 
    tokenId: $tokenId, 
    uri: $uri, 
    owner: $owner, 
    seller: $seller, 
    startPrice: $startPrice, 
    endTime: $endTime, 
    isActive: $isActive, 
    minIncrement: $minIncrement, 
    color: $color, 
    metadata: $metadata, 
    highestBidder: $highestBidder, 
    highestBid: $highestBid
    ) {
    id
    tokenId
    uri
    owner
    seller
    startPrice
    highestBid
    highestBidder
    endTime
    isActive
    minIncrement
    color
    metadata
  }
}
    `;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("新增的 NFT:", result.upsertNFTCollectible);
      return result.upsertNFTCollectible;
    } catch (error) {
      console.error("Error adding NFT:", error);
      throw error;
    }
  };

  const qureyAllListAuctionNFT = async (limit: number, offset: number) => {
    const query = `
      query GetAllListAuctionCollectibles($limit: Int, $offset: Int) {
      getAllListAuctionCollectibles(limit: $limit, offset: $offset) {
      items {
        id
        tokenId
        uri
        owner
        seller
        startPrice
        highestBid
        highestBidder
        endTime
        isActive
        minIncrement
        color
        metadata
      }
      totalCount
      }
  }
    `;

    try {
      const result = await fetchGraphQL(query, { limit, offset });
      console.log("查询所有拍卖的 NFT:", result.getAllListAuctionCollectibles);
      return result.getAllListAuctionCollectibles;
    } catch (error) {
      console.error("Error querying all auction NFTs:", error);
      throw error;
    }
  };

  const updateAuctionNTFHighestBid = async (input: { id: number, highestBidder: string, highestBid: number }) => {
    const mutation = `mutation UpdateAuctionCollectibleHighestBid($id: Int!, $highestBidder: String!, $highestBid: Float!) {
  updateAuctionCollectibleHighestBid(id: $id, highestBidder: $highestBidder, highestBid: $highestBid) {
    id
    highestBid
    highestBidder
  }
}`

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("新增的 最高价者:", result.updateAuctionCollectibleHighestBid);
      return result.updateAuctionCollectibleHighestBid;
    } catch (error) {
      console.error("Error set Auction:", error);
      throw error;
    }

  }

  const updateAuctionNTFEnd = async (input: { id: number, owner: string }) => {
    const mutation = `
  mutation UpdateAuctionCollectibleEnd($id: Int!, $owner: String!) {
  updateAuctionCollectibleEnd(id: $id, owner: $owner) {
    id
    isActive
    owner
  }
}
  `;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("结束拍卖:", result.updateAuctionCollectibleEnd);
      return result.updateAuctionCollectibleEnd;
    } catch (error) {
      console.error("Error end Auction:", error);
      throw error;
    }

  }

  const updateAuctionNTFOwner = async (input: { id: number, owner: string }) => {
    const mutation = `
      mutation UpdateAuctionCollectibleOwner($updateAuctionCollectibleOwnerId: Int!, $owner: String!) {
  updateAuctionCollectibleOwner(id: $updateAuctionCollectibleOwnerId, owner: $owner) {
    id
    owner
  }
}
    `;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("owner变更:", result.updateAuctionCollectibleOwner);
      return result.updateAuctionCollectibleOwner;
    } catch (error) {
      console.error("Error set Auction:", error);
      throw error;
    }
  }




  const queryAllNFTBlindBox = async (limit: number, offset: number) => {
    const query = `query GetAllNFTBlindBoxes($limit: Int, $offset: Int) {
  getAllNFTBlindBoxes(limit: $limit, offset: $offset) {
    totalCount
    items {
      id
      tokenIds
      describes
      tags
      seller
      isActive
      price
      coverUrl
    }
  }
}`;

    try {
      const result = await fetchGraphQL(query, { limit, offset });
      console.log("查询所有NFT盲盒:", result.getAllNFTBlindBoxes);
      return result.getAllNFTBlindBoxes;
    } catch (error) {
      console.error("Error querying all NFTBlindBox:", error);
      throw error;
    }

  }




  const addNFTBlindBox = async (input: {
    id: number;
    tokenIds: number[];
    describes: string;
    tags: string[];
    seller: string;
    isActive: boolean;
    price: number;
    coverUrl: string;
  }) => {
    const mutation = `
    mutation UpsertNFTBlindBox($id: Int!, $tokenIds: [Int]!, $describes: String!, $tags: [String]!, $seller: String!, $isActive: Boolean!, $price: Float!, $coverUrl: String!) {
      upsertNFTBlindBox(id: $id, tokenIds: $tokenIds, describes: $describes, tags: $tags, seller: $seller, isActive: $isActive, price: $price, coverUrl: $coverUrl) {
        id
        tokenIds
        describes
        tags
        seller
        isActive
        price
        coverUrl
      }
    }
    `;
    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("新增的NFT盲盒:", result.upsertNFTBlindBox);
      return result.upsertNFTBlindBox;
    } catch (error) {
      console.error("Error set NFTBlindBox:", error);
      throw error;
    }
  }

  const updatePullNFTBlindBox = async (input: { id: number }) => {
    const mutation = `
    mutation UpdatePullNFTBlindBox($id: Int!) {
      updatePullNFTBlindBox(id: $id) {
        id
        tokenIds
        describes
        tags
        seller
        isActive
        price
        coverUrl
      }
    }
    `;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("下架盲盒成功:", result.updatePullNFTBlindBox);
      return result.updatePullNFTBlindBox;
    } catch (error) {
      console.error("Error pull NFTBlindBox:", error);
      throw error;
    }
  }

  const updateBuyNFTBlindBox = async (input: {
    id: number,
    tokenId: number
  }) => {
    const mutation = `
    mutation UpdateBuyNFTBlindBox($id: Int!, $tokenId: Int!) {
      updateBuyNFTBlindBox(id: $id, tokenId: $tokenId) {
        id
        tokenIds
        describes
        tags
        seller
        isActive
        price
        coverUrl
      }
    }
    `;

    try {
      const result = await fetchGraphQL(mutation, input);
      console.log("购买盲盒成功:", result.updateBuyNFTBlindBox);
      return result.updateBuyNFTBlindBox;
    } catch (error) {
      console.error("Error buy NFTBlindBox:", error);
      throw error;
    }
  }

  const updateNFTBlindBoxTokenIds = async (id: number, tokenIds: number[]) => {
    const mutation = `
    mutation UpdateNFTBlindBoxTokenIds($id: Int!, $tokenIds: [Int]!) {
      updateNFTBlindBoxTokenIds(id: $id, tokenIds: $tokenIds) {
        id
        tokenIds
        describes
        tags
        seller
        isActive
        price
        coverUrl
      }
    }
    `;
    try {
      const result = await fetchGraphQL(mutation, { id, tokenIds });
      console.log("更新盲盒NFT:", result.updateNFTBlindBoxTokenIds);
      return result.updateNFTBlindBoxTokenIds;
    } catch (error) {
      console.error("Error update NFTBlindBoxTokenIds:", error);
      throw error;
    }
  }

  const queryAllNFTBlindBoxBySeller = async (seller: string, limit: number, offset: number) => {
    const query = `query GetAllNFTBlindBoxBySeller($seller: String!, $limit: Int, $offset: Int) {
  getAllNFTBlindBoxBySeller(seller: $seller, limit: $limit, offset: $offset) {
    totalCount
    items {
      id
      tokenIds
      describes
      tags
      seller
      isActive
      price
      coverUrl
    }
  }
}`;
    try {
      const result = await fetchGraphQL(query, { seller, limit, offset });
      console.log("查询用户所有NFT盲盒:", result.getAllNFTBlindBoxBySeller);
      return result.getAllNFTBlindBoxBySeller;
    } catch (error) {
      console.error("Error querying user all NFTBlindBox:", error);
      throw error;
    }
  }

  const queryNFTBlindBoxById = async (id: number) => {
    const query = `query GetNFTBlindBoxById($id: Int!) {
    getNFTBlindBoxById(id: $id) {
      id
      tokenIds
      describes
      tags
      seller
      isActive
      price
      coverUrl
    }
  }`;

    try {
      const result = await fetchGraphQL(query, { id });
      console.log("查询单个NFT盲盒:", result.getNFTBlindBoxById);
      return result.getNFTBlindBoxById;
    } catch (error) {
      console.error("Error querying NFTBlindBox:", error);
    }
  }

  const searchNFTCollectibles = async (input: {
    seller: string;
    priceRange: [number, number];
    isList: boolean;
    color: string;
    metadataSearch: string;
    limit: number;
    offset: number;
  }) => {
    // 构建动态查询
    let query = `
      query SearchNFTCollectibles($limit: Int, $offset: Int, $priceRange: [Float], $isList: Boolean, $color: String, $metadataSearch: String, $seller: String) {
        searchNFTCollectibles(
          limit: $limit,
          offset: $offset,
          priceRange: $priceRange,
          isList: $isList,
          color: $color,
          metadataSearch: $metadataSearch,
          seller: $seller
        ) {
          totalCount
          items {
            id
            uri
            owner
            seller
            price
            isList
            royaltyRate
            color
            metadata
          }
        }
      }
    `;

  
    try {
      const result = await fetchGraphQL(query, input);
      console.log("搜索到的 NFT 收藏品:", result.searchNFTCollectibles);
      return result.searchNFTCollectibles;
    } catch (error) {
      console.error("Error searching NFT collectibles:", error);
      throw error;
    }
  };
  


  // 搜索拍卖 NFT
  const searchAuctionNFTCollectibles = async (input: {
    seller: string;
    startPriceRange: [number, number];
    isActive: boolean;
    color: string;
    metadataSearch: string;
    limit: number;
    offset: number;
  }) => {
    const query = `
    query SearchAuctionNFTCollectibles(
      $seller: String,
      $startPriceRange: [Float],
      $isActive: Boolean,
      $color: String,
      $metadataSearch: String,
      $limit: Int,
      $offset: Int
    ) {
      searchAuctionCollectibles(
        seller: $seller,
        startPriceRange: $startPriceRange,
        isActive: $isActive,
        color: $color,
        metadataSearch: $metadataSearch,
        limit: $limit,
        offset: $offset
      ) {
        totalCount
        items {
          id
          tokenId
          uri
          owner
          seller
          startPrice
          highestBid
          highestBidder
          endTime
          isActive
          minIncrement
          color
          metadata
        }
      }
    }
  `;

    try {
      const result = await fetchGraphQL(query, input);
      console.log("搜索到的拍卖 NFT 收藏品:", result.searchAuctionCollectibles);
      return result.searchAuctionCollectibles;
    } catch (error) {
      console.error("Error searching auction NFT collectibles:", error);
      throw error;
    }
  };


  // 搜索盲盒 NFT
  const searchNFTBlindBoxes = async (input: {
    seller: string;
    priceRange: [number, number];
    isActive: boolean;
    describesSearch: string;
    tags: [string];
    limit: number;
    offset: number;
  }) => {
    const query = `
    query SearchNFTBlindBoxes(
      $seller: String,
      $priceRange: [Float],
      $isActive: Boolean,
      $describesSearch: String,
      $tags: [String],
      $limit: Int,
      $offset: Int
    ) {
      searchNFTBlindBoxes(
        seller: $seller,
        priceRange: $priceRange,
        isActive: $isActive,
        describesSearch: $describesSearch,
        tags: $tags,
        limit: $limit,
        offset: $offset
      ) {
        totalCount
        items {
          id
          tokenIds
          describes
          tags
          seller
          isActive
          price
          coverUrl
        }
      }
    }
  `;

    try {
      const result = await fetchGraphQL(query, input);
      console.log("搜索到的盲盒 NFT 收藏品:", result.searchNFTBlindBoxes);
      return result.searchNFTBlindBoxes;
    } catch (error) {
      console.error("Error searching NFT blind boxes:", error);
      throw error;
    }
  };


  return {
    updateNFTCollectibleOwner,
    updateBatchNFTCollectibleOwner,
    updatePullNFTCollectible,
    updateAuctionNTFHighestBid,
    updateAuctionNTFEnd,
    updateAuctionNTFOwner,
    updateNFTCollectiblePrice,
    updateBuyNFTCollectible,
    updatePullNFTBlindBox,
    updateBuyNFTBlindBox,
    updateNFTBlindBoxTokenIds,
    addNFTCollectible,
    addAuctionCollectible,
    addNFTListCollectible,
    addNFTBlindBox,
    queryAllListedNFT,
    qureyAllListAuctionNFT,
    queryAccountAuctionNFT,
    queryAccountListedNFT,
    queryAccountNFT,
    queryNFTById,
    queryNFTByIds,
    queryAllNFTBlindBox,
    queryAllNFTBlindBoxBySeller,
    queryNFTBlindBoxById,
    searchAuctionNFTCollectibles,
    searchNFTBlindBoxes,
    searchNFTCollectibles
  };
};
