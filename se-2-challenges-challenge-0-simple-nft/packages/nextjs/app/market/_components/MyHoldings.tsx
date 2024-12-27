"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { useAccount } from "wagmi";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";
import { AddressInput } from "~~/components/scaffold-eth";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
  seller: `0x${string}`;
  price: string;
  royaltyRate: string;
  color: string;
  metadata?: NFTMetaData;
}

interface Query {
  totalCount: number;
  items: Collectible[];
}

export function weiToEther(weiValue: string): string {
  const weiBigInt = BigInt(weiValue);
  const etherBigInt = weiBigInt / BigInt(10 ** 18);
  const remainder = weiBigInt % BigInt(10 ** 18);
  const etherFraction = remainder.toString().padStart(18, '0').slice(0, 18);

  let result = `${etherBigInt}`;
  if (etherFraction !== '000000000000000000') {
    result += `.${etherFraction.replace(/0+$/, '')}`;
  }

  return result;
}

function convertToPercentage(number: number): string {
  const percentage = (number / 10000) * 100;
  return `${percentage.toFixed(2)}%`;
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(4);
  const [myTotalBalance, setMyTotalBalance] = useState<number>(0);

  // 筛选条件
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1 * 1e18]);
  const [color, setColor] = useState<string>('');
  const [metadataSearch, setMetadataSearch] = useState<string>('');
  const [searchSeller, setSearchSeller] = useState<string>('');

  const { queryAllListedNFT, searchNFTCollectibles } = GraphqlServer();

  const updateFilteredCollectibles = async (): Promise<void> => {
    if (connectedAddress === undefined) return;
    setAllCollectiblesLoading(true);

    // 计算分页的 offset
    const offset = (currentPage - 1) * pageSize;

    let price: [number, number] = [0, 0];
    if (priceRange) {
      price = [priceRange[0], priceRange[1]]
    }

    // 调用新的筛选查询接口
    const query = await searchNFTCollectibles({ seller: searchSeller, isList: true, limit: pageSize, offset, priceRange: price, color, metadataSearch }) as Query;
    const items = query.items;
    setMyTotalBalance(query.totalCount);

    const updatedCollectibles = items.map((collectible) => {
      collectible.price = weiToEther(collectible.price);
      collectible.royaltyRate = convertToPercentage(Number(collectible.royaltyRate));
      return {
        ...collectible,
        ...collectible.metadata,
      };
    });

    setMyAllCollectibles(updatedCollectibles);
    setAllCollectiblesLoading(false);
  };

  useEffect(() => {
    const updateMyCollectibles = async (): Promise<void> => {
      if (connectedAddress === undefined)
        return;

      setAllCollectiblesLoading(true);
      // 计算分页的 offset
      const offset = (currentPage - 1) * pageSize;

      let price: [number, number] = [0, 0];
      if (priceRange) {
        price = [priceRange[0], priceRange[1]]
      }
      
      // 请求当前页的数据
      const query = await queryAllListedNFT(pageSize, offset) as Query;
      console.log(query);
      const items = query.items;
      setMyTotalBalance(query.totalCount);
      const collectibleUpdate: Collectible[] = [];


      const updatedCollectibles = items.map((collectible) => {
        // 展开 metadata 并合并到顶层
        collectible.price = weiToEther(collectible.price);
        collectible.royaltyRate = convertToPercentage(Number(collectible.royaltyRate));
        return {
          ...collectible,
          ...collectible.metadata, // 将 metadata 展开到顶层
        };
      });

      collectibleUpdate.push(...updatedCollectibles); // 合并更新后的数据
      collectibleUpdate.sort((a, b) => a.id - b.id);
      setMyAllCollectibles(collectibleUpdate);
      setAllCollectiblesLoading(false);
    };

    updateMyCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, currentPage]);

  const totalPages = Math.ceil(parseInt(myTotalBalance?.toString() || "0") / pageSize);
  const paginatedItems = myAllCollectibles;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>

      <div className="flex flex-wrap gap-5 justify-center items-start mt-8">
        {/* 搜索功能区 */}
        <div className="flex flex-col gap-4 w-full sm:w-2/3 lg:w-1/2">
          {/* 搜索描述 */}
          <input
            type="text"
            className="input input-bordered text-lg"
            placeholder="Search by description"
            value={metadataSearch}
            onChange={(e) => setMetadataSearch(e.target.value)}
          />

          {/* 搜索卖家 */}
          <AddressInput
            placeholder="Search by seller"
            value={searchSeller}
            onChange={(address) => setSearchSeller(address)}
          />
        </div>

        {/* 筛选功能区 */}
        <div className="flex flex-col gap-3 w-full sm:w-2/3 lg:w-1/2">
          {/* 价格范围 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm">Price Range</label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                className="range range-primary flex-1"
                min={0}
                max={0.5 * 1e18}
                step={0.01 * 1e18}
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseFloat(e.target.value), priceRange[1]])}
              />
              <input
                type="range"
                className="range range-primary flex-1"
                min={0}
                max={1 * 1e18}
                step={0.01 * 1e18}
                value={priceRange[1] || 1 * 1e18}
                onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>Min: {weiToEther(priceRange[0].toString())} ETH</span>
              <span>Max: {weiToEther(priceRange[1].toString())} ETH</span>
            </div>
          </div>

          {/* 颜色选择 */}
          <div className="flex flex-col">
            <label className="text-sm">Select Color</label>
            <select
              className="select select-bordered"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value="">Select color</option>
              <option value="red">Red</option>
              <option value="gold">Gold</option>
              <option value="purple">Purple</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="white">White</option>
            </select>
          </div>
        </div>

        {/* 搜索按钮 */}
        <div className="w-full sm:w-auto">
          <button
            className="btn btn-secondary w-full sm:w-auto px-8 py-2"
            onClick={() => updateFilteredCollectibles()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-6-6"
              />
            </svg>
            搜索
          </button>
        </div>
      </div>




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
