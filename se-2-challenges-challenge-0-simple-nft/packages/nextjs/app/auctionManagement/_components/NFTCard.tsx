import { useState } from "react";
import { Collectible } from "./MyHoldings";
import { Address, IntegerInput, EtherInput, NumberInput } from "~~/components/scaffold-eth";
import NFTFrame from "~~/components/myframe/Frame";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import deployedContracts from '~~/contracts/deployedContracts';
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";


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

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [transferToAddress, setTransferToAddress] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [addNum, setAddNum] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // 当前页
  const ITEMS_PER_PAGE = 2; // 每页显示的交易记录数

  const { writeContractAsync, writeContract } = useScaffoldWriteContract("YourCollectibleAuction");


  const { address: connectedAddress } = useAccount();
  const { data: transferEvents } = useScaffoldEventHistory({
    contractName: "YourCollectibleAuction",
    eventName: "BidPlaced",
    fromBlock: 0n,
  });

  const bigIntToDate = (timeNum: bigint | undefined) => {
    return new Date(Number(timeNum)).toLocaleString();
  }

  const stringToDate = (timeNum: string) => {
    return new Date(Number(timeNum) * 1000).toLocaleString();
  }

  const handelSetBidPrice = (num: number) => {
    if (num < 0) return;
    setAddNum(num);

    const highestBid = Number(nft.highestBid || 0);
    const startPrice = Number(nft.startPrice || 0);
    const minIncrement = Number(nft.minIncrement || 0);

    const basePrice = highestBid > 0 ? highestBid : startPrice;
    const endPrice = basePrice + num * minIncrement;

    // 使用 toFixed 保留小数位
    setBidPrice(parseFloat(endPrice.toFixed(6)).toString()); // 保留6位小数，防止过多小数位
  };

  // ** 1. 筛选出匹配的竞拍记录 **
  const tokenIdEvents = transferEvents?.filter(event => Number(event.args.auctionId) === nft.id) || [];

  // ** 2. 进行分页 **
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = tokenIdEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);


  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
      <figure className="relative">
        {/* eslint-disable-next-line  */}
        {/*<img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />*/}
        <div className="h-60 min-w-full">
          <NFTFrame fileUrl={nft.image} frameColor={nft.color} />
        </div>        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white "># {nft.tokenId}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <div tabIndex={0} className="collapse collapse-plus border-base-300 bg-base-200 border" >
          <input type="checkbox" />
          <div className="collapse-title text-xl font-medium">历史竞拍记录</div>
          <div className="collapse-content">
            {tokenIdEvents.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center">
                  暂无竞拍记录
                </td>
              </tr>
            ) : (
              paginatedEvents.map((event, index) => {
                let amount = '';
                if (event.args.amount) {
                  amount = weiToEther(event.args.amount.toString());
                }
                return (
                  <div key={index}>
                    <p># {startIndex + index + 1}</p> {/* 修改为全局序号 */}
                    <p>竞拍者：<Address address={event.args.bidder} /></p>
                    <p>竞拍时间：{bigIntToDate(event.args.ackTime)}</p>
                    <p>{amount} ETH</p>
                    <hr />
                  </div>
                );

              })
            )}
            <div className="flex items-center justify-center space-x-2 mt-4">
              {Array.from(
                { length: Math.ceil((tokenIdEvents?.length || 0) / ITEMS_PER_PAGE) },
                (_, i) => (
                  <button
                    key={i}
                    className={`btn btn-square ${currentPage === i + 1 ? "btn-active" : ""}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
          <div className="flex flex-wrap space-x-2 mt-1">
            {nft.attributes?.map((attr, index) => (
              <span key={index} className="badge badge-primary py-3">
                {attr.value}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="my-0 text-lg">{nft.description}</p>
        </div>
        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold">Seller : </span>
          <Address address={nft.seller} />
        </div>

        <div className="flex flex-col my-2 space-y-1">
          <span className="text-lg font-semibold mb-1">起拍价: {weiToEther(nft.startPrice.toString())} ETH</span>
        </div>

        <div className="flex flex-col my-2 space-y-1">
          <span className="text-lg font-semibold mb-1">最小加价: {weiToEther(nft.minIncrement.toString())} ETH</span>
        </div>

        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold">最高竞拍者: </span>
        </div>
        <Address address={nft.highestBidder} />

        <div className="flex flex-col my-2 space-y-1">
          <span className="text-lg font-semibold mb-1">最高竞拍价: {weiToEther(nft.highestBid)} ETH</span>
        </div>

        <div className="flex flex-col my-2 space-y-1">
          <span className="text-lg font-semibold mb-1">截止时间: {stringToDate(nft.endTime)}</span>
        </div>

        <div className="card-actions justify-end">
          {nft.isActive ?
            (
              <button
                className="btn btn-error btn-md px-8 tracking-wide"
                onClick={() => {
                  try {
                    writeContractAsync({
                      functionName: "endAuction",
                      args: [BigInt(nft.id.toString())],
                    });
                  } catch (err) {
                    console.error("Error calling transferFrom function");
                  }
                }}
              >
                结束竞拍
              </button>
            )
            :
            (
              <button
                className="btn btn-secondary btn-md px-8 tracking-wide"
                disabled
              >
                拍卖已结束
              </button>)
          }

        </div>
      </div>
    </div>
  );
};
