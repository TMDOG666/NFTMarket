import { useState } from "react";
import { Collectible } from "./MyHoldings";
import { Address, AddressInput, IntegerInput, EtherInput } from "~~/components/scaffold-eth";
import NFTFrame from "~~/components/myframe/Frame";
import { notification } from "~~/utils/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import deployedContracts from '~~/contracts/deployedContracts';
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";
import { useAccount } from "wagmi";
import { weiToEther } from "~~/utils/scaffold-eth/weiToEther";
import { AddNewNFTModal } from './AddNewNFTModal'; // 根据你的项目路径调整导入路径
import { ShowNFTModal } from "./ShowNFTModal";



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
    const [transferToAddress, setTransferToAddress] = useState("");
    const [listPrice, setlistPrice] = useState("");
    const [currentPage, setCurrentPage] = useState(1); // 当前页
    const ITEMS_PER_PAGE = 2; // 每页显示的交易记录数
    const { data: listingFee } = useScaffoldReadContract({
        contractName: "BlindBox",
        functionName: "blindBoxListFee",
        watch: true,
    });

    const { writeContractAsync } = useScaffoldWriteContract("BlindBox");
    const { addNFTListCollectible, updateBatchNFTCollectibleOwner, updatePullNFTBlindBox } = GraphqlServer();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBlindBox, setCurrentBlindBox] = useState<NFTBlindBox | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [currentDetailBlindBox, setCurrentDetailBlindBox] = useState<NFTBlindBox | null>(null);

    const { address: connectedAddress } = useAccount();
    const { data: transferEvents, isLoading } = useScaffoldEventHistory({
        contractName: "BlindBox",
        eventName: "BoxPurchased",
        fromBlock: 0n,
    });

    // 打开弹框并设置盲盒信息
    const handleOpenModal = (blindBox: NFTBlindBox) => {
        setCurrentBlindBox(blindBox);
        setIsModalOpen(true);
    };

    // 关闭弹框
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentBlindBox(null); // 可选：清空当前盲盒信息
    };

    // 打开弹框并设置盲盒信息
    const handleDetailOpenModal = (blindBox: NFTBlindBox) => {
        setCurrentDetailBlindBox(blindBox);
        setIsDetailModalOpen(true);
    };

    // 关闭弹框
    const handleDetailCloseModal = () => {
        setIsDetailModalOpen(false);
        setCurrentDetailBlindBox(null); // 可选：清空当前盲盒信息
    };

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
                            <tr>
                                <td colSpan={3} className="text-center">
                                    No events found
                                </td>
                            </tr>
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
                    {blindBox.isActive
                        ?
                        <>

                            <button
                                className="btn btn-secondary btn-md px-8 tracking-wide"
                                onClick={() => handleOpenModal(blindBox)}
                            >
                                补货上新
                            </button>
                            <button
                                className="btn btn-error btn-md px-8 tracking-wide"
                                onClick={async () => {
                                    try {
                                        if (!connectedAddress) {
                                            notification.error("请先连接账户");
                                            return;
                                        }
                                        await writeContractAsync({
                                            functionName: "removeBox",
                                            args: [BigInt(blindBox.id)]
                                        })
                                        await updatePullNFTBlindBox({
                                            id: blindBox.id
                                        })
                                        await updateBatchNFTCollectibleOwner({
                                            ids: blindBox.tokenIds,
                                            owner: connectedAddress?.toString()
                                        })
                                        window.location.reload();
                                    } catch (err) {
                                        console.error(err)
                                        console.error("Error calling transferFrom function");
                                    }
                                }}
                            >
                                下架
                            </button>
                        </>

                        :
                        <button className="btn btn-error btn-md px-8 tracking-wide" disabled>
                            已下架
                        </button>
                    }
                    {currentBlindBox && (
                        <>
                            <AddNewNFTModal
                                blindBox={currentBlindBox}
                                isOpen={isModalOpen}
                                onClose={handleCloseModal}
                            />
                        </>
                    )}
                    {currentDetailBlindBox && (
                        <>
                            <ShowNFTModal
                                blindBox={currentDetailBlindBox}
                                isOpen={isDetailModalOpen}
                                onClose={handleDetailCloseModal}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
