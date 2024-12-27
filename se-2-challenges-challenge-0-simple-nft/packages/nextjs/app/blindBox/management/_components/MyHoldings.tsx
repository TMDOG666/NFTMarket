"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";
import { BlindBoxCard } from "./BlindBoxCard";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: `0x${string}`;
  color: string;
  metadata?: NFTMetaData;
}

interface NFTBlindBox {
  id: number;
  tokenIds: number[];
  describes: string;
  tags: string[];
  seller: `0x${string}`;
  isActive: boolean;
  price: number;
  coverUrl: string;
}

interface Query {
  totalCount: number;
  items: NFTBlindBox[];
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllNFTBlindBox, setMyAllNFTBlindBox] = useState<NFTBlindBox[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [myTotalBalance, setMyTotalBalance] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1); // 当前页
  const [pageSize] = useState(4); // 每页展示 4 个 NFT

  const { queryAccountNFT ,queryAllNFTBlindBoxBySeller} = GraphqlServer();

  useEffect(() => {
    const updateMyCollectibles = async (): Promise<void> => {
      
      if (connectedAddress === undefined)
        return;

      setAllCollectiblesLoading(true);

      // 计算分页的 offset
      const offset = (currentPage - 1) * pageSize;

      // 请求当前页的数据
      const query = await queryAllNFTBlindBoxBySeller(connectedAddress.toString(), pageSize, offset) as Query;
      const items = query.items;
      setMyTotalBalance(query.totalCount);
      const blindBoxUpdate: NFTBlindBox[] = items;
      blindBoxUpdate.sort((a, b) => a.id - b.id); // 排序

      // 更新 state
      setMyAllNFTBlindBox(blindBoxUpdate);
      setAllCollectiblesLoading(false); // 加载完成
    };

    updateMyCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, currentPage]); // 在 currentPage 变化时重新加载数据

  const totalPages = Math.ceil(parseInt(myTotalBalance?.toString() || "0") / pageSize); // 总页数
  const paginatedItems = myAllNFTBlindBox; // 直接使用所有当前页加载的数据

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
      {myAllNFTBlindBox.length === 0 ? (
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
              <BlindBoxCard blindBox={item} key={item.id} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
