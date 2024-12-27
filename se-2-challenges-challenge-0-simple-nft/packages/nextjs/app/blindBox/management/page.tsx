"use client";

import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS, getUrl, uploadFileToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import nftsMetadata from "~~/utils/simpleNFT/nftsMetadata";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";
import Modal from "react-modal";
import { useState, useEffect } from "react";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { EtherInput, InputBase } from "~~/components/scaffold-eth";
import { weiToEther } from "~~/utils/scaffold-eth/weiToEther";
import deployedContracts from '~~/contracts/deployedContracts';
import { ViweNFTFrame, NFTFrame } from "~~/components/myframe";


export interface Collectible extends Partial<NFTMetaData> {
    id: number;
    uri: string;
    owner: string;
    color: string;
    metadata?: NFTMetaData;
}

interface BlindBox {
    id: number;
    tokenIds: number[];
    describes: string;
    tags: string[];
    seller: string;
    isActive: boolean;
    price: number;
    coverUrl: string;
}

interface Query {
    totalCount: number;
    items: Collectible[];
}

const BlindBoxManagement: NextPage = () => {
    const { address: connectedAddress, isConnected, isConnecting } = useAccount();
    const { writeContractAsync } = useScaffoldWriteContract("BlindBox");

    const { writeContractAsync:writeYourCollectibleAsync } = useScaffoldWriteContract("YourCollectible");

    const { data: userListBlindBoxFee } = useScaffoldReadContract({
        contractName: "BlindBox",
        functionName: "blindBoxListFee",
        watch: true,
    });

    const { addNFTBlindBox, queryAccountNFT ,updateBatchNFTCollectibleOwner} = GraphqlServer();

    const [shouldUpload, setShouldUpload] = useState<boolean>(false);
    const [blindBoxdataQueue, setBlindBoxdataQueue] = useState<{ transactionHash: string, blindBox: BlindBox }[]>([]);


    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);


    const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
    const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
    const [myTotalBalance, setMyTotalBalance] = useState(0);
    const [selectedNFTs, setSelectedNFTs] = useState<Collectible[]>();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [blindBoxPrice, setBlindBoxPrice] = useState("");
    const [blindBoxTags, setBlindBoxTags] = useState<string>("");
    const [blindBoxDescription, setBlindBoxDescription] = useState<string>("");
    const [blindBoxCoverUrl, setBlindBoxCoverUrl] = useState<string>("");
    const [coverFile, setCoverFile] = useState<File | null>(null);

    const { data: transferEvents, isLoading } = useScaffoldEventHistory({
        contractName: "BlindBox",
        eventName: "BoxCreated",
        fromBlock: 0n, // 起始区块高度，可根据需要调整
        enabled: shouldUpload,
    });


    // 更新队列数据并存储到 localStorage
    const updateBlindBoxQueue = (newQueue: any[]) => {
        setBlindBoxdataQueue(newQueue);
        // 将队列数据保存到 localStorage
        localStorage.setItem('blindBoxQueue', JSON.stringify(newQueue));
    };

    const removeMetadataQueue = () => {
        localStorage.removeItem('blindBoxQueue');
    };

    const handleAddItemToQueue = (newItem: any) => {
        const updatedQueue = [...blindBoxdataQueue, newItem];
        updateBlindBoxQueue(updatedQueue);
    };

    const handleRemoveItemFromQueue = (index: number) => {
        const updatedQueue = blindBoxdataQueue.filter((_, i) => i !== index);
        updateBlindBoxQueue(updatedQueue);
    };

    const handleSelectNFT = (nft: Collectible) => {
        console.log(nft);
        setSelectedNFTs((prevSelected) => {
            if (!prevSelected) return [nft];
            if (prevSelected.find((item) => item.id === nft.id)) {
                return prevSelected.filter((item) => item.id !== nft.id);
            }
            return [...prevSelected, nft];
        });
        console.log(selectedNFTs);
    };

    const handleOpenSelectNFT = () => {
        setIsDropdownOpen(true);
    };


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

    // 使用 useEffect 监听 transactionHash 和 transferEvents 变化
    useEffect(() => {
        const savedQueue = localStorage.getItem('blindBoxQueue');
        if (savedQueue) {
            setBlindBoxdataQueue(JSON.parse(savedQueue));
            setShouldUpload(true);
        }
        if (transferEvents && transferEvents.length > 0) {
            // 遍历队列中的每个交易哈希
            blindBoxdataQueue.forEach(async (item, index) => {
                try {
                    const filteredEvents = transferEvents.filter(event => event.log.transactionHash === item.transactionHash);
                    if (filteredEvents.length > 0) {
                        const event = filteredEvents[0];
                        const id = event.log.args.boxId ? parseInt(event.log.args.boxId.toString()) : 0;
                        const cover = item.blindBox.coverUrl?item.blindBox.coverUrl:"null"
                        console.log(item)
                        // 执行后端上传操作
                        await addNFTBlindBox({
                            id: id,
                            seller: item.blindBox.seller,
                            tokenIds: item.blindBox.tokenIds,
                            price: item.blindBox.price,
                            coverUrl: cover,
                            describes: item.blindBox.describes,
                            tags: item.blindBox.tags,
                            isActive: item.blindBox.isActive
                        });

                        console.log("NFTBilndBox uploaded successfully");

                        // 上传成功后，删除已处理的队列项
                        setBlindBoxdataQueue(prevQueue => prevQueue.filter((_, i) => i !== index));
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
    }, [transferEvents]);  // 监听 transferEvents 和 metadataQueue


    const handleCreateMyNFTBlindBox = async () => {
        if (!selectedNFTs || !blindBoxPrice || !blindBoxTags || !blindBoxDescription || !connectedAddress || !coverFile) {
            notification.error("请填写所有必需信息并选择至少一个NFT。");
            return;
        }

        const notificationId = notification.loading("正在创建盲盒...");
        try {

            
            const imageHash = await uploadFileToIPFS(coverFile);
            const imageUrl = getUrl(imageHash?.data.IpfsHash)
            console.log(imageUrl);
            setBlindBoxCoverUrl(imageUrl);
            notification.success("CoverFile uploaded to IPFS");
            console.log(blindBoxCoverUrl);

            await writeYourCollectibleAsync({
                functionName:"batchApprove",
                args: [deployedContracts[11155111].BlindBox.address, selectedNFTs.map((nft: Collectible) => BigInt(nft.id))
            ],
            })
            const transactionHash = await writeContractAsync({
                functionName: "createBox",
                args: [
                    deployedContracts[11155111].YourCollectible.address,
                    selectedNFTs.map((nft: any) => BigInt(nft.id)),
                    BigInt(parseFloat(blindBoxPrice) * 1e18),
                ],
                value: userListBlindBoxFee
            });
            //更新数据库
            await updateBatchNFTCollectibleOwner({
                ids:selectedNFTs.map((nft: any) => nft.id),
                owner: deployedContracts[11155111].BlindBox.address
            })

            if (transactionHash) {
                // 将新的映射添加到队列中
                setBlindBoxdataQueue(prevQueue => {
                    return [...prevQueue,
                    {
                        transactionHash: transactionHash.toString(),
                        blindBox: {
                            id: 0,
                            seller: connectedAddress.toString(),
                            tokenIds: selectedNFTs.map((nft: Collectible) => nft.id),
                            price: parseFloat(blindBoxPrice)*1e18,
                            coverUrl:imageUrl,
                            describes: blindBoxDescription,
                            tags: blindBoxTags.split(","),
                            isActive: true
                        }
                    }];
                });
                setShouldUpload(true);
                handleAddItemToQueue({
                    transactionHash: transactionHash.toString(),
                    blindBox: {
                        id: 0,
                        seller: connectedAddress.toString(),
                        tokenIds: selectedNFTs.map((nft: Collectible) => nft.id),
                        price: parseFloat(blindBoxPrice)*1e18,
                        coverUrl: imageUrl,
                        describes: blindBoxDescription,
                        tags: blindBoxTags.split(","),
                        isActive: true
                    }
                });
                notification.remove(notificationId);

            }
            setModalIsOpen(false);
        } catch (error) {
            notification.remove(notificationId);
            console.error(error);
        }
    };


    return (
        <>
            <div className="flex items-center flex-col pt-10">
                <div className="px-5">
                    <h1 className="text-center mb-8">
                        <span className="block text-4xl font-bold">盲盒管理</span>
                    </h1>
                </div>
                <div className="flex flex-col justify-center mt-1">
                    <p className="text-xl p-0 m-0 font-semibold text-orange-500">盲盒上架费用： {userListBlindBoxFee ? weiToEther(userListBlindBoxFee?.toString()) : ""} ETH</p>
                </div>
            </div>
            <div className="flex justify-center">
                {!isConnected || isConnecting ? (
                    <RainbowKitCustomConnectButton />
                ) : (
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalIsOpen(true)}>
                            Create My BlindBox
                        </button>
                    </>
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
                        maxWidth: "800px", // 最大宽度为800px
                        maxHeight: "80vh", // 最大高度为80%视口高度
                        margin: "auto",
                        marginTop: "100px",
                        padding: "20px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                        overflow: "hidden", // 防止内容溢出
                        overflowY: "auto", // 启用垂直滚动
                    },
                }}
            >
                <h2 className="text-lg font-bold mb-4">拍卖你的NFT</h2>

                {/* 下拉选择框 */}
                <div className="flex flex-col my-2 z-100">
                    <label className="text-lg font-semibold mb-2">选择 NFT：</label>
                    <div className="dropdown relative">
                        <button
                            tabIndex={0}
                            className="btn select-bordered w-full"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {selectedNFTs?.length
                                ? `已选择 ${selectedNFTs.length} 个NFT`
                                : "请选择你的 NFT"}
                        </button>
                        <ul
                            tabIndex={0}
                            className={`dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full max-w-[600px] absolute left-1/2 transform -translate-x-1/2 mt-2 ${isDropdownOpen ? "block" : "hidden"
                                }`}
                        >
                            {myAllCollectibles.map((nft) => (
                                <li key={nft.id} onClick={() => handleSelectNFT(nft)}>
                                    <div className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedNFTs?.some((item) => item.id === nft.id)}
                                            readOnly
                                        />
                                        #{nft.id}
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

                {/* NFT 回显 */}
                {selectedNFTs && selectedNFTs?.length > 0 && (
                    <div className="mt-4">
                        <label className="text-lg font-semibold mb-2">已选择的 NFT：</label>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                            {selectedNFTs.map((nft) => (
                                <div
                                    key={nft.id}
                                    className="flex flex-col items-center card card-compact bg-base-100 shadow-lg"
                                    style={{ width: "200px", height: "200px" }}
                                >
                                    {nft.metadata && (
                                        <div className="w-full h-full">
                                            <NFTFrame fileUrl={nft.metadata.image} frameColor={nft.color} />
                                        </div>
                                    )}
                                    <span className="text-xs text-center">{nft.name || `NFT #${nft.id}`}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="btn btn-secondary btn-md px-8 tracking-wide"
                >
                    📁 上传封面
                </button>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*,.glb"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setCoverFile(e.target.files[0]);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                setImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(e.target.files[0]);
                        }
                    }}
                    className="hidden"
                />
                <br />
                {imagePreview && (
                    <>
                        {/*<Frame imageUrl = {imagePreview} frameColor={"white"}></Frame>*/}
                        <div className="w-200">
                            <img src={imagePreview} ></img>
                        </div>
                    </>
                )}

                <div className="flex flex-col my-2">
                    <label className="text-lg font-semibold mb-2">盲盒描述：</label>
                    <InputBase value={blindBoxDescription} placeholder="描述" onChange={(newValue) => setBlindBoxDescription(newValue)} />
                </div>

                <div className="flex flex-col my-2">
                    <label className="text-lg font-semibold mb-2">盲盒标签 （","隔开）：</label>
                    <InputBase value={blindBoxTags} placeholder="标签" onChange={(newValue) => setBlindBoxTags(newValue)} />
                </div>

                <div className="flex flex-col my-2">
                    <label className="text-lg font-semibold mb-2">盲盒价格 (ETH)：</label>
                    <EtherInput value={blindBoxPrice} placeholder="ETH" onChange={(newValue) => setBlindBoxPrice(newValue)} />
                </div>

                <div className="flex flex-col justify-center mt-1">
                    <p className="text-xl p-0 m-0 font-semibold text-orange-500">上架手续费： {userListBlindBoxFee ? weiToEther(userListBlindBoxFee?.toString()) : ""} ETH</p>
                </div>
                <div className="flex justify-end mt-4 space-x-4">
                    <button onClick={handleCreateMyNFTBlindBox} className="btn btn-primary">
                        创建盲盒
                    </button>
                    <button onClick={() => setModalIsOpen(false)} className="btn btn-secondary">
                        关闭
                    </button>
                </div>
            </Modal>

        </>
    );
};

export default BlindBoxManagement;
