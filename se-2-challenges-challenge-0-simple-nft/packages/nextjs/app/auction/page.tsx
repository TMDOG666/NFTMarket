"use client";

import { MyHoldings, weiToEther } from "./_components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import Modal from "react-modal";
import deployedContracts from '~~/contracts/deployedContracts';
import { useState, useEffect } from "react";
import { EtherInput } from "~~/components/scaffold-eth";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
  color: string;
  metadata?: NFTMetaData;
}

interface Query {
  totalCount: number;
  items: Collectible[];
}

const Auction: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectibleAuction");

  const { writeContractAsync: writeContractAsyncYourCollectible } = useScaffoldWriteContract("YourCollectible");
  const { queryAccountNFT, addAuctionCollectible, queryNFTById, updateNFTCollectibleOwner } = GraphqlServer();

  const [shouldUpload, setShouldUpload] = useState<boolean>(false);
  const [transactionHashQueue, setTransactionHashQueue] = useState<{
    transactionHash: string,
    data: {
      startPrice: number;
      minIncrement: number;
    }
  }[]>([]);

  const [myTotalBalance, setMyTotalBalance] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [startPrice, setStartPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("");
  const [durationDays, setDurationDays] = useState(0);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const { data: transferEvents, isLoading } = useScaffoldEventHistory({
    contractName: "YourCollectibleAuction",
    eventName: "AuctionCreated",
    fromBlock: 0n, // 起始区块高度，可根据需要调整
    enabled: shouldUpload,
  });

  const { data: listingFee } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "listingFee",
    watch: true,
  });


  const [selectedNFT, setSelectedNFT] = useState<Collectible | null>(null);
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectNFT = (nft: any) => {
    setSelectedNFT(nft);
    setIsDropdownOpen(false); // 选择NFT后关闭下拉框
  };

  const handleOpenSelectNFT = () => {
    setIsDropdownOpen(true); // 选择NFT后关闭下拉框
  };

  // 更新队列数据并存储到 localStorage
  const updateMetadataQueue = (newQueue: any[]) => {
    setTransactionHashQueue(newQueue);
    // 将队列数据保存到 localStorage
    localStorage.setItem('transferHashQueue', JSON.stringify(newQueue));
  };

  const removeMetadataQueue = () => {
    localStorage.removeItem('transferHashQueue');
  };

  const handleAddItemToQueue = (newItem: any) => {
    const updatedQueue = [...transactionHashQueue, newItem];
    updateMetadataQueue(updatedQueue);
  };



  const getColor = (color: number) => {
    switch (color) {
      case 1: return "green";
      case 2: return "blue";
      case 3: return "purple";
      case 4: return "gold";
      case 5: return "red";
      default: return "white";
    }
  };

  useEffect(() => {
    const addAuctionCollectibleAsanc = async () => {
      const savedQueue = localStorage.getItem('transferHashQueue');
      console.log(savedQueue)
      if (savedQueue) {
        setTransactionHashQueue(JSON.parse(savedQueue));
        setShouldUpload(true);
        console.log("Queue:", transactionHashQueue)
        console.log("Queue length:", transactionHashQueue.length);
      }
      console.log(transferEvents)
      if (transferEvents && transferEvents.length > 0) {
        // 遍历队列中的每个交易哈希
        transactionHashQueue.forEach(async (item, index) => {
          try {
            const filteredEvents = transferEvents.filter(event => event.log.transactionHash === item.transactionHash);
            if (filteredEvents.length > 0) {
              const event = filteredEvents[0];
              const id = event.args.auctionId ? parseInt(event.args.auctionId.toString()) : 0;
              const tokenId = event.args.tokenId ? parseInt(event.args.tokenId.toString()) : 0;
              const endTime = event.args.endTime ? parseInt(event.args.endTime.toString()) : 0;


              console.log("Minted Token ID:", tokenId);

              const qurey = await queryNFTById(tokenId) as Collectible;
              const uri = qurey.uri ? qurey.uri.replace("https://ipfs.io/ipfs/", "") : '';
              const metadata = qurey.metadata ? qurey.metadata as Record<string, any> : {};
              const color = qurey.color ? qurey.color : "white";

              console.log(item)

              console.log(qurey)

              // 执行后端上传操作
              await addAuctionCollectible({
                id: id,
                tokenId: tokenId,
                uri: uri,
                owner: deployedContracts[11155111].YourCollectibleAuction.address,
                seller: qurey.owner,
                startPrice: item.data.startPrice,
                minIncrement: item.data.minIncrement,
                endTime: endTime,
                isActive: true,
                color: color,
                metadata: metadata
              });

              //修改nft的owner
              await updateNFTCollectibleOwner({
                id: tokenId,
                owner: deployedContracts[11155111].YourCollectibleAuction.address,
              });

              console.log("NFT uploaded successfully");

              // 上传成功后，删除已处理的队列项
              setTransactionHashQueue(prevQueue => prevQueue.filter((_, i) => i !== index));
              removeMetadataQueue();
              window.location.reload();
            }
          } catch (error) {
            // 处理错误
            console.error("Error processing event for transactionHash:", item.transactionHash, error);
            // 可以选择在这里进行一些补救操作，例如将失败的项重新放回队列或记录日志等
          }
        });
        setShouldUpload(false);
      }
    }
    addAuctionCollectibleAsanc();

  }, [transferEvents])

  useEffect(() => {


    const updateMyCollectibles = async (): Promise<void> => {
      if (connectedAddress === undefined)
        return;

      setAllCollectiblesLoading(true);
      // 请求当前页的数据
      const query = await queryAccountNFT(connectedAddress.toString(), 1000, 0) as Query;
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
  }, [connectedAddress]);

  const handleAuctionMyNFT = async () => {
    if (!selectedNFT) {
      notification.error("请选择一个 NFT！");
      return;
    }
    const durationInSeconds =
      durationDays * 24 * 60 * 60 + durationHours * 60 * 60 + durationMinutes * 60 + durationSeconds;

    try {
      await writeContractAsyncYourCollectible({
        functionName: "approve",
        args: [deployedContracts[11155111].YourCollectibleAuction.address, BigInt(selectedNFT.id.toString())],
      });

      const transactionHash = await writeContractAsync({
        functionName: "createAuction",
        args: [
          BigInt(selectedNFT.id), // tokenId
          BigInt(parseFloat(startPrice) * 1e18), // 转为 wei
          BigInt(parseFloat(minIncrement) * 1e18), // 转为 wei
          BigInt(durationInSeconds),
        ],
        value: listingFee
      });

      if (transactionHash) {
        // 将新的映射添加到队列中，保持 FIFO
        setTransactionHashQueue(prevQueue => {
          const newQueue = [...prevQueue,
          {
            transactionHash: transactionHash.toString(),
            data: {
              startPrice: parseFloat(startPrice) * 1e18,
              minIncrement: parseFloat(minIncrement) * 1e18,
            }
          }];
          if (newQueue.length > 10) {  // 限制队列长度为10，超出时删除最旧的元素
            newQueue.shift();
          }
          return newQueue;
        });
        setShouldUpload(true);
        handleAddItemToQueue(
          {
            transactionHash: transactionHash.toString(),
            data: {
              startPrice: parseFloat(startPrice) * 1e18,
              minIncrement: parseFloat(minIncrement) * 1e18,
            }
          }
        );
      }

      notification.success("拍卖创建成功！");
      setModalIsOpen(false);
      setSelectedNFT(null);
      setStartPrice("");
      setMinIncrement("");
      setDurationDays(0);
      setDurationHours(0);
      setDurationMinutes(0);
      setDurationSeconds(0);
    } catch (error) {
      notification.error("创建拍卖失败");
      console.log(error)
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">拍卖中心</span>
        </h1>
      </div>
      <div className="flex justify-center">
        {!isConnected || isConnecting ? (
          <RainbowKitCustomConnectButton />
        ) : (
          <button className="btn btn-secondary" onClick={() => setModalIsOpen(true)}>
            拍卖 NFT
          </button>
        )}
      </div>
      <MyHoldings />

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="card card-compact bg-base-100 shadow-lg"
        style={{
          content: {
            width: "100%",
            maxWidth: "800px",  // 最大宽度为800px
            margin: "auto",
            marginTop: "100px",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <h2 className="text-lg font-bold mb-4">拍卖你的NFT</h2>

        <div className="flex flex-col my-2">
          <label className="text-lg font-semibold mb-2">选择 NFT：</label>
          <div className="dropdown relative">
            <button tabIndex={0} className="btn select-bordered w-full" onClick={() => { handleOpenSelectNFT() }}>
              {selectedNFT ?
                <>
                  <div className="flex items-center space-x-2">
                    # {selectedNFT.id}
                    {selectedNFT.image && <img src={selectedNFT.image} alt={selectedNFT.name} className="h-8 w-8 rounded" />}
                    <span>{selectedNFT.name || `NFT #${selectedNFT.id}`}</span>
                    {selectedNFT.attributes?.map((attr, index) => (
                      <span key={index} className="badge badge-primary py-3">
                        {attr.value}
                      </span>
                    ))}
                    <span className="badge badge-primary py-3">
                      {selectedNFT.color}
                    </span>
                  </div>

                </>
                :

                "请选择你的 NFT"}
            </button>
            <ul
              tabIndex={0}
              className={`dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full max-w-[350px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] absolute left-1/2 transform -translate-x-1/2 mt-2 ${isDropdownOpen ? 'block' : 'hidden'}`}
            >
              {myAllCollectibles.map((nft) => (
                <li key={nft.id} onClick={() => handleSelectNFT(nft)} >
                  <div className="flex items-center space-x-2">
                    #{nft.id}
                    {nft.image && <img src={nft.image} alt={nft.name} className="h-8 w-8 rounded" />}
                    <span>{nft.name || `NFT #${nft.id}`}</span>
                    {nft.attributes?.map((attr, index) => (
                      <span key={index} className="badge badge-primary py-3">
                        {attr.value}
                      </span>
                    ))}
                    <span className="badge badge-primary py-3">
                      {nft.color}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col my-2">
          <label className="text-lg font-semibold mb-2">起拍价 (ETH)：</label>
          <EtherInput value={startPrice} placeholder="ETH" onChange={(newValue) => setStartPrice(newValue)} />
        </div>

        <div className="flex flex-col my-2">
          <label className="text-lg font-semibold mb-2">最小加价 (ETH)：</label>
          <EtherInput value={minIncrement} placeholder="ETH" onChange={(newValue) => setMinIncrement(newValue)} />
        </div>

        <div className="flex flex-row space-x-4 my-2">
          <label className="text-lg font-semibold mb-2">持续时间：</label>

          {/* 天数选择 */}
          <div className="flex flex-col">
            <label className="text-lg font-semibold">天：</label>
            <select
              className="select select-bordered w-full"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value))}
            >
              {Array.from({ length: 31 }, (_, index) => (
                <option key={index} value={index}>
                  {index} 天
                </option>
              ))}
            </select>
          </div>

          {/* 小时选择 */}
          <div className="flex flex-col">
            <label className="text-lg font-semibold">小时：</label>
            <select
              className="select select-bordered w-full"
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value))}
            >
              {Array.from({ length: 25 }, (_, index) => (
                <option key={index} value={index}>
                  {index} 小时
                </option>
              ))}
            </select>
          </div>

          {/* 分钟选择 */}
          <div className="flex flex-col">
            <label className="text-lg font-semibold">分钟：</label>
            <select
              className="select select-bordered w-full"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
            >
              {Array.from({ length: 61 }, (_, index) => (
                <option key={index} value={index}>
                  {index} 分钟
                </option>
              ))}
            </select>
          </div>


          {/* 秒数选择 */}
          <div className="flex flex-col">
            <label className="text-lg font-semibold">秒：</label>
            <select
              className="select select-bordered w-full"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(parseInt(e.target.value))}
            >
              {Array.from({ length: 61 }, (_, index) => (
                <option key={index} value={index}>
                  {index} 秒
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="text-xl p-0 m-0 font-semibold text-orange-500">上架费用： {listingFee ? weiToEther(listingFee?.toString()) : ""} ETH</p>
        </div>
        <div className="flex justify-end mt-4 space-x-4">
          <button onClick={handleAuctionMyNFT} className="btn btn-primary">
            发起拍卖
          </button>
          <button onClick={() => setModalIsOpen(false)} className="btn btn-secondary">
            关闭
          </button>
        </div>
      </Modal>

    </>
  );
};

export default Auction;
