"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { useAccount } from "wagmi";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  tokenId:number;
  uri: string;
  owner: string;
  seller: `0x${string}`;
  startPrice: string;
  highestBid: string;
  highestBidder: `0x${string}`;
  endTime: string;
  isActive: boolean;
  minIncrement: string;
  color: string;
  metadata?: NFTMetaData;
}

interface Query {
  totalCount: number;
  items: Collectible[];
}

export function weiToEther(weiValue: string): string {
  // 将 Wei 值转换为 BigInt
  const weiBigInt = BigInt(weiValue);

  // 计算 Ether 值
  const etherBigInt = weiBigInt / BigInt(10 ** 18);

  // 计算余数
  const remainder = weiBigInt % BigInt(10 ** 18);

  // 将余数转换为 Ether 小数部分
  const etherFraction = remainder.toString().padStart(18, '0').slice(0, 18);

  // 组合整数部分和小数部分
  let result = `${etherBigInt}`;
  if (etherFraction !== '000000000000000000') {
    // 去掉末尾的零
    result += `.${etherFraction.replace(/0+$/, '')}`;
  }

  return result;
}

function convertToPercentage(number: number): string {
  const percentage = (number / 10000) * 100;
  return `${percentage.toFixed(2)}%`; // 使用toFixed来格式化小数点后两位
}


export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [myTotalBalance, setMyTotalBalance] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1); // 当前页
  const [pageSize] = useState(4); // 每页展示 4 个 NFT


  const { queryAccountAuctionNFT } = GraphqlServer();


  useEffect(() => {
    const updateMyCollectibles = async (): Promise<void> => {
      if (connectedAddress === undefined)
        return;

      setAllCollectiblesLoading(true);
      const offset = (currentPage - 1) * pageSize;

      // 请求当前页的数据
      const query = await queryAccountAuctionNFT(connectedAddress,pageSize, offset) as Query;
      const items = query.items;
      setMyTotalBalance(query.totalCount);
      const collectibleUpdate: Collectible[] = [];
      const updatedCollectibles = items.map((collectible) => {
        
        // 展开 metadata 并合并到顶层
        return {
          ...collectible,
          ...collectible.metadata, // 将 metadata 展开到顶层
        };
      });

      collectibleUpdate.push(...updatedCollectibles); // 合并更新后的数据
      collectibleUpdate.sort((a, b) => a.id - b.id); // 排序

      // 更新 state
      setMyAllCollectibles(collectibleUpdate);
      setAllCollectiblesLoading(false); // 加载完成
    };

    updateMyCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, currentPage]);


  const totalPages = Math.ceil(parseInt(myTotalBalance?.toString() || "0") / pageSize); // 总页数
  const paginatedItems = myAllCollectibles; // 直接使用所有当前页加载的数据

  const handlePageChange = (page: number) => {
    setCurrentPage(page); // 更新当前页
  };


  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>
      {myAllCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">No NFTs found</div>
        </div>
      ) : (
        <div>
          {/* DaisyUI Pagination */}
          <div className="flex justify-center mt-8">
            <div className="btn-group">
              <button
                className="btn btn-primary"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  className={`btn ${currentPage === index + 1 ? 'btn-active' : 'btn-secondary'}`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                className="btn btn-primary"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
            {paginatedItems.map(item => (
              <NFTCard nft={item} key={item.id} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
