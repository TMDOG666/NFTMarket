import { useState } from "react";
import { Collectible } from "./MyHoldings";
import { Address, AddressInput, EtherInput } from "~~/components/scaffold-eth";
import NFTFrame from "~~/components/myframe/Frame";
import { useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";
import deployedContracts from '~~/contracts/deployedContracts';


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
  const [newListPrice, setNewListPrice] = useState("");
  const [listPrice, setlistPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // 当前页
  const ITEMS_PER_PAGE = 2; // 每页显示的交易记录数

  const { updateNFTCollectiblePrice, updatePullNFTCollectible } = GraphqlServer();

  const { address: connectedAddress } = useAccount();
  const { data: transferEvents, isLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "Purchased",
    fromBlock: 0n,
  });

  // ** 1. 筛选出匹配的竞拍记录 **
  const tokenIdEvents = transferEvents?.filter(event => Number(event.args.tokenId) === nft.id) || [];

  // ** 2. 进行分页 **
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = tokenIdEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);


  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
      <figure className="relative">
        {/* eslint-disable-next-line  */}
        {/*<img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />*/}
        <div className="h-60 min-w-full">
          <NFTFrame fileUrl={nft.image} frameColor={nft.color} />
        </div>        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white "># {nft.id}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <div tabIndex={0} className="collapse collapse-plus border-base-300 bg-base-200 border" >
          <input type="checkbox" />
          <div className="collapse-title text-xl font-medium">历史交易记录</div>
          <div className="collapse-content">
            {tokenIdEvents.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center">
                  No events found
                </td>
              </tr>
            ) : (
              paginatedEvents.map((event, index) => {
                if (event.args.buyer === connectedAddress || event.args.seller === connectedAddress) {
                  console.log(event);
                  let price = '';
                  if (event.args.price) {
                    price = weiToEther(event.args.price.toString());
                  }
                  return (
                    <div key={index}>
                      <p># {startIndex + index + 1}</p> {/* 修改为全局序号 */}
                      <p>卖家：<Address address={event.args.seller} /></p>
                      <p>买家：<Address address={event.args.buyer} /></p>
                      <p>{price} ETH</p>
                      <hr />
                    </div>
                  );
                }
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
          <span className="text-lg font-semibold mb-1">Price: {nft.price} ETH</span>
        </div>
        <div className="flex flex-col my-2 space-y-1">
          <span className="text-lg font-semibold mb-1">RoyaltyRate: {nft.royaltyRate}</span>
        </div>
        <div className="flex flex-col my-2 space-y-1">
          <span className="text-lg font-semibold mb-1">NewListPrice: </span>
          <EtherInput
            value={newListPrice}
            placeholder="receiver newListPrice"
            onChange={newValue => setNewListPrice(newValue)}
          />
        </div>
        <div className="card-actions justify-end">
          <button
            className="btn btn-secondary btn-md px-8 tracking-wide"
            onClick={async () => {
              try {
                await writeContractAsync({
                  functionName: "updateNFTPrice",
                  args: [BigInt(nft.id.toString()), BigInt(parseFloat(newListPrice) * 1e18)],
                });
                await updateNFTCollectiblePrice({
                  id: nft.id,
                  price: parseFloat(newListPrice) * 1e18
                });
                window.location.reload();
              } catch (err) {
                console.error("Error calling transferFrom function");
              }
            }}
          >
            修改价格
          </button>
        </div>
        {nft.isList &&
          (
            <div className="card-actions justify-end">
              <button
                className="btn btn-error btn-md px-8 tracking-wide"
                onClick={async () => {
                  try {
                    await writeContractAsync({
                      functionName: "delistNFT",
                      args: [BigInt(nft.id.toString())],
                    });
                    if (connectedAddress)
                      await updatePullNFTCollectible({
                        id: nft.id,
                        owner: connectedAddress.toString()
                      })
                    window.location.reload();
                  } catch (err) {
                    console.error("Error calling transferFrom function");
                  }
                }}
              >
                下架
              </button>
            </div>
          )
        }
        {nft.isList == false && (
          <>
            <div className="flex flex-col my-2 space-y-1">
              <span className="text-lg font-semibold mb-1">ListPrice: </span>
              <EtherInput
                value={listPrice}
                placeholder="receiver listPrice"
                onChange={newValue => setlistPrice(newValue)}
              />
            </div>
            <button
              className="btn btn-secondary btn-md px-8 tracking-wide"
              onClick={async () => {
                try {
                  await writeContractAsync({
                    functionName: "approve",
                    args: [deployedContracts[11155111].YourCollectible.address, BigInt(nft.id.toString())],
                  });

                  await writeContractAsync({
                    functionName: "listNFT",
                    args: [BigInt(nft.id.toString()), BigInt(parseFloat(listPrice) * 1e18)],
                    value: BigInt(0.001 * 1e18),
                  });
                } catch (err) {
                  console.error(err)
                  console.error("Error calling transferFrom function");
                }
              }}
            >
              上架
            </button>

          </>
        )}
      </div>
    </div>
  );
};
