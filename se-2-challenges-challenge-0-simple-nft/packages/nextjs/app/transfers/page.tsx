"use client";

import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

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

const Transfers: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { data: transferEvents, isLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "Purchased",
    // Specify the starting block number from which to read events, this is a bigint.
    fromBlock: 0n,
    
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-xl"></span>
      </div>
    );

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">交易记录</span>
          </h1>
        </div>
        <div className="overflow-x-auto shadow-lg">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="bg-primary">Token Id</th>
                <th className="bg-primary">卖家</th>
                <th className="bg-primary">买家</th>
                <th className="bg-primary">价格</th>
                <th className="bg-primary">版税费用</th>
                <th className="bg-primary">区块号</th>
                <th className="bg-primary">交易哈希</th>
                
              </tr>
            </thead>
            <tbody>
              {!transferEvents || transferEvents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center">
                    No events found
                  </td>
                </tr>
              ) : (
                transferEvents?.map((event, index) => {
                  if (event.args.buyer === connectedAddress || event.args.seller === connectedAddress){
                    console.log(event)
                    let price = ''
                    let royalty = ''
                    if(event.args.price){
                      price = weiToEther(event.args.price.toString())
                    }
                    if(event.args.royaltyAmount){
                      royalty = weiToEther(event.args.royaltyAmount.toString())
                    }else{
                      royalty = '0'
                    }
                    
                    return (
                      <tr key={index}>
                        <th className="text-center">{event.args.tokenId?.toString()}</th>
                        <td>
                          <Address address={event.args.seller} />
                        </td>
                        <td>
                          <Address address={event.args.buyer} />
                        </td>

                        <td>
                          <p>{price} ETH</p>
                        </td>

                        <td>
                          <p>{royalty} ETH</p>
                        </td>

                        <td>
                          <p>{event.log.blockNumber.toString()}</p>
                        </td>

                        <td>
                          <p>{event.log.transactionHash}</p>
                        </td>
                      </tr>
                    );
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Transfers;
