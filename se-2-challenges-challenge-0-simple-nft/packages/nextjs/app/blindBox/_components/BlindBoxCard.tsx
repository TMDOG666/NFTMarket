import { useState, useEffect } from "react";
import { Collectible } from "./MyHoldings";
import { Address, AddressInput, IntegerInput, EtherInput } from "~~/components/scaffold-eth";
import NFTFrame from "~~/components/myframe/Frame";
import { notification } from "~~/utils/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import deployedContracts from '~~/contracts/deployedContracts';
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";
import { useAccount } from "wagmi";
import { weiToEther } from "~~/utils/scaffold-eth/weiToEther";
import { ShowNFTModal } from "./ShowNFTModal";
import { PrizePreviewModal } from "./ShowDrawnNFT";



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

export const BlindBoxCard = ({ blindBox }: { blindBox: NFTBlindBox }) => {

  const [currentPage, setCurrentPage] = useState(1); // 当前页
  const ITEMS_PER_PAGE = 2; // 每页显示的交易记录数
  const { data: listingFee } = useScaffoldReadContract({
    contractName: "BlindBox",
    functionName: "blindBoxListFee",
    watch: true,
  });

  const { data: blindBoxContract, isLoading: blindBoxContractIsLoading } = useScaffoldContract({ contractName: "BlindBox" });


  const { writeContractAsync } = useScaffoldWriteContract("BlindBox");
  const { updateNFTCollectibleOwner, queryNFTById, updatePullNFTBlindBox } = GraphqlServer();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentDetailBlindBox, setCurrentDetailBlindBox] = useState<NFTBlindBox | null>(null);

  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [currentDrawBlindBoxNFT, setCurrentDrawBlindBoxNFT] = useState<Collectible | null>(null);


  const [shouldUpload, setShouldUpload] = useState<boolean>(false);
  const [blindBoxdataBuyQueue, setBlindBoxdataBuyQueue] = useState<{ requestId: string, boxId: number, buyer: string }[]>([]);

  const [isDrawNotification, setIsDrawNotification] = useState<string>();

  const { address: connectedAddress } = useAccount();
  const { data: transferEvents, isLoading } = useScaffoldEventHistory({
    contractName: "BlindBox",
    eventName: "BoxPurchased",
    fromBlock: 0n,
    filters: { boxId: BigInt(blindBox.id) }
  });

  const { data: drawTransferEvents } = useScaffoldEventHistory({
    contractName: "BlindBox",
    eventName: "BoxPurchased",
    fromBlock: 0n,
    enabled: shouldUpload,
    filters: { boxId: BigInt(blindBox.id) }
  });

  // 更新队列数据并存储到 localStorage
  const updateBlindBoxBuyQueue = (newQueue: any[]) => {
    setBlindBoxdataBuyQueue(newQueue);
    // 将队列数据保存到 localStorage
    localStorage.setItem('blindBoxBuyQueue', JSON.stringify(newQueue));
  };

  const removeMetadataQueue = () => {
    localStorage.removeItem('blindBoxBuyQueue');
  };

  const handleAddItemToQueue = (newItem: any) => {
    const updatedQueue = [...blindBoxdataBuyQueue, newItem];
    updateBlindBoxBuyQueue(updatedQueue);
  };

  const handleRemoveItemFromQueue = (index: number) => {
    const updatedQueue = blindBoxdataBuyQueue.filter((_, i) => i !== index);
    updateBlindBoxBuyQueue(updatedQueue);
  };

  // 打开弹框并设置盲盒信息
  const handleDetailOpenModal = (blindBox: NFTBlindBox) => {
    setCurrentDetailBlindBox(blindBox);
    setIsDetailModalOpen(true);
  };

  const handleDrawOpenModal = (nft: Collectible) => {
    setCurrentDrawBlindBoxNFT(nft);
    setIsDrawModalOpen(true);
  };

  // 关闭弹框
  const handleDetailCloseModal = () => {
    setIsDetailModalOpen(false);
    setCurrentDetailBlindBox(null); // 可选：清空当前盲盒信息
  };

  const handleDrawCloseModal = () => {
    setIsDrawModalOpen(false);
    setCurrentDrawBlindBoxNFT(null); // 可选：清空当前盲盒信息
  };

  // 使用 useEffect 监听 transactionHash 和 transferEvents 变化
  useEffect(() => {
    const savedQueue = localStorage.getItem('blindBoxBuyQueue');
    console.log("aaa", savedQueue)

    if (savedQueue) {
      setBlindBoxdataBuyQueue(JSON.parse(savedQueue));
      setShouldUpload(true);
    }
    console.log(blindBoxdataBuyQueue, shouldUpload)
    console.log(drawTransferEvents)
    if (drawTransferEvents && drawTransferEvents.length > 0) {
      // 遍历队列中的每个交易哈希
      blindBoxdataBuyQueue.forEach(async (item, index) => {
        try {
          console.log(item.requestId.toString())
          const filteredEvents = drawTransferEvents.filter(event => event.log.args.requestId?.toString() === item.requestId);
          console.log(filteredEvents)
          if (filteredEvents.length > 0) {
            const event = filteredEvents[0];
            const tokenId = event.log.args.nftId ? parseInt(event.log.args.nftId.toString()) : 0;
            console.log(item)
            // 执行后端上传操作
            await updateNFTCollectibleOwner({
              id: tokenId,
              owner: item.buyer
            });
            // 上传成功后，删除已处理的队列项
            setBlindBoxdataBuyQueue(prevQueue => prevQueue.filter((_, i) => i !== index));
            removeMetadataQueue();
            if (isDrawNotification)
              notification.remove(isDrawNotification)
            notification.success("抽取成功！")
            const nft = await queryNFTById(tokenId) as Collectible;
            console.log(nft);
            handleDrawOpenModal(nft);
            setShouldUpload(false);
          } else {
            if (!isDrawNotification)
              notification.info("正在抽取中...");
          }
        } catch (error) {
          // 处理错误
          console.error("Error processing event for transactionHash:", item.boxId, error);
          // 可以选择在这里进行一些补救操作，例如将失败的项重新放回队列或记录日志等
        }
      });
    }
  }, [drawTransferEvents]);  // 监听 transferEvents 和 metadataQueue


  // ** 1. 筛选出匹配的竞拍记录 **
  const tokenIdEvents = transferEvents?.filter(event => Number(event.args.boxId) === blindBox.id) || [];

  // ** 2. 进行分页 **
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = tokenIdEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
      <figure className="relative">
        {/* eslint-disable-next-line  */}
        {/*<img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />*/}
        <div className="h-60 min-w-full">
          <img src={blindBox.coverUrl} />
        </div>

        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white "># {blindBox.id}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <div tabIndex={0} className="collapse collapse-plus border-base-300 bg-base-200 border" >
          <input type="checkbox" />
          <div className="collapse-title text-xl font-medium">历史交易记录</div>
          <div className="collapse-content">
            {tokenIdEvents.length === 0 ? (
              <table>
                <tbody>
                  <tr>
                    <td colSpan={3} className="text-center">
                      No events found
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              paginatedEvents.map((event, index) => {
                return (
                  <div key={index}>
                    <p># {startIndex + index + 1}</p> {/* 修改为全局序号 */}
                    <p>买家: <Address address={event.args.buyer} /></p>
                    <p>奖品NFT ID: # {event.args.nftId?.toString()}</p>
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
          <p className="text-xl p-0 m-0 font-semibold">{blindBox.describes}</p>
          <div className="flex flex-wrap space-x-2 mt-1">
            {blindBox.tags?.map((tag, index) => (
              <span key={index} className="badge badge-primary py-3">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="my-0 text-lg">{blindBox.describes}</p>
        </div>
        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold">Seller : </span>
          <Address address={blindBox.seller} />
        </div>
        <div className="flex flex-col my-2 space-y-1">
          <span className="text-lg font-semibold mb-1">售价: {weiToEther(blindBox.price.toString())} ETH</span>
        </div>
        <div className="card-actions justify-end">
          <button
            className="btn btn-secondary btn-md px-8 tracking-wide"
            onClick={() => handleDetailOpenModal(blindBox)}
          >
            盲盒详情
          </button>
          <button
            className="btn btn-error btn-md px-8 tracking-wide"
            onClick={async () => {
              try {
                if (!connectedAddress || !blindBoxContract) {
                  notification.error("请先连接账户");
                  return;
                }
                const notificationId = notification.loading(`正在购买... ${blindBox.id}`);

                await writeContractAsync({
                  functionName: "purchaseBox",
                  args: [BigInt(blindBox.id)],
                  value: BigInt(blindBox.price),
                })

                const requestId = await blindBoxContract.read.getRequestId([connectedAddress]);
                console.log(requestId, "requestId");

                setBlindBoxdataBuyQueue(prevQueue => {
                  return [...prevQueue, { requestId: requestId.toString(), boxId: blindBox.id, buyer: connectedAddress }]
                });
                handleAddItemToQueue({ requestId: requestId.toString(), boxId: blindBox.id, buyer: connectedAddress })
                setShouldUpload(true);
                notification.remove(notificationId);
                notification.success("购买成功!")
                const drawNotificationId = notification.loading("正在抽取盲盒...");
                setIsDrawNotification(drawNotificationId);
                console.log(blindBoxdataBuyQueue, "blindBoxdataBuyQueue")
                //刷新页面
                setTimeout(() => {
                  location.reload();
                }, 40000);
              } catch (err) {
                console.error(err)
                console.error("Error calling transferFrom function");
              }
            }}
          >
            购买
          </button>
          {currentDetailBlindBox && (
            <>
              <ShowNFTModal
                blindBox={currentDetailBlindBox}
                isOpen={isDetailModalOpen}
                onClose={handleDetailCloseModal}
              />
            </>
          )}
          {currentDrawBlindBoxNFT && (
            <>
              <PrizePreviewModal
                nft={currentDrawBlindBoxNFT}
                isOpen={isDrawModalOpen}//
                onClose={handleDrawCloseModal}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
