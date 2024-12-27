"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS, getUrl, uploadFileToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";
import { useState, useEffect } from "react";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import deployedContracts from '~~/contracts/deployedContracts';
import { InputBase } from "~~/components/scaffold-eth";
import { ViweNFTFrame, NFTFrame } from "~~/components/myframe";

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

const AirDrop: NextPage = () => {
    const { address: connectedAddress, isConnected, isConnecting } = useAccount();

    const { writeContractAsync: writeYourCollectibleAsync } = useScaffoldWriteContract("YourCollectible");

    const { updateNFTCollectibleOwner, queryAccountNFT, updateBatchNFTCollectibleOwner } = GraphqlServer();

    const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
    const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
    const [myTotalBalance, setMyTotalBalance] = useState(0);
    const [selectedNFTs, setSelectedNFTs] = useState<Collectible[]>();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [airDropAddresses, setAirDropAddresses] = useState<string>("");

    const handleSelectNFT = (nft: Collectible) => {
        setSelectedNFTs((prevSelected) => {
            if (!prevSelected) return [nft];
            if (prevSelected.find((item) => item.id === nft.id)) {
                return prevSelected.filter((item) => item.id !== nft.id);
            }
            return [...prevSelected, nft];
        });
    };

    useEffect(() => {
        const updateMyCollectibles = async (): Promise<void> => {
            if (connectedAddress === undefined)
                return;

            setAllCollectiblesLoading(true);
            const query = await queryAccountNFT(connectedAddress.toString(), 1000, 0) as Query;
            const items = query.items;
            setMyTotalBalance(query.totalCount);
            const collectibleUpdate: Collectible[] = [];
            const updatedCollectibles = items.map((collectible) => {
                return {
                    ...collectible,
                    ...collectible.metadata,
                };
            });

            collectibleUpdate.push(...updatedCollectibles);
            collectibleUpdate.sort((a, b) => a.id - b.id);

            setMyAllCollectibles(collectibleUpdate);
            setAllCollectiblesLoading(false);
        };

        updateMyCollectibles();
    }, [connectedAddress]);

    const handleAirDropNFT = async () => {
        if (!selectedNFTs || !airDropAddresses || !connectedAddress) {
            notification.error("请填写所有必需信息并选择至少一个NFT。");
            return;
        }

        const notificationId = notification.loading("正在空投...");
        try {
            const nftIds = selectedNFTs.map((nft: Collectible) => BigInt(nft.id))
            const addresses = airDropAddresses.split(",");
            await writeYourCollectibleAsync({
                functionName: "airdrop",
                args: [addresses, nftIds],
            })

            for (let i = 0; i < nftIds.length; i++) {
                await updateNFTCollectibleOwner({
                    id: parseInt(nftIds[i].toString()),
                    owner: addresses[i]
                })
            }
            notification.remove(notificationId);
        } catch (error) {
            notification.remove(notificationId);
            console.error(error);
        }
    };

    return (
        <div className="max-w-4xl min-w-3xl mx-auto py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">NFT空投</h1>
            </div>

            <div className="flex flex-col my-4">
                <label className="text-lg font-semibold mb-2">选择 NFT：</label>
                <div className="relative">
                    <button
                        className="btn w-full select-bordered"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        {selectedNFTs?.length
                            ? `已选择 ${selectedNFTs.length} 个NFT`
                            : "请选择你的 NFT"}
                    </button>
                    <ul
                        className={`dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full mt-2 transition-all duration-300 ${isDropdownOpen ? "block" : "hidden"}`}
                    >
                        {myAllCollectibles.map((nft) => (
                            <li key={nft.id} onClick={() => handleSelectNFT(nft)}>
                                <div className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedNFTs?.some((item) => item.id === nft.id)}
                                        readOnly
                                    />
                                    <span>#{nft.id}</span>
                                    <span>{nft.name || `NFT #${nft.id}`}</span>
                                    {nft.attributes?.map((attr, index) => (
                                        <span key={index} className="badge badge-primary py-2">
                                            {attr.value}
                                        </span>
                                    ))}
                                    <span className="badge badge-primary py-2">{nft.color}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {selectedNFTs && selectedNFTs?.length > 0 && (
                <div className="mt-4">
                    <label className="text-lg font-semibold mb-2">已选择的 NFT：</label>
                    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-2 w-full">
                        {selectedNFTs.map((nft) => (
                            <div
                                key={nft.id}
                                className="flex flex-col items-center card card-compact bg-base-100 shadow-lg"
                            >
                                {nft.metadata && (
                                    <div className="w-60 h-60">
                                        <NFTFrame fileUrl={nft.metadata.image} frameColor={nft.color} />
                                    </div>
                                )}
                                <span className="text-xs text-center mt-2">{nft.name || `NFT #${nft.id}`}</span>
                            </div>
                        ))}
                    </div>
                </div>

            )}

            <div className="flex flex-col my-4">
                <label className="text-lg font-semibold mb-2">空投地址（多个地址用逗号隔开）：</label>
                <InputBase
                    value={airDropAddresses}
                    placeholder="地址列表"
                    onChange={(newValue) => setAirDropAddresses(newValue)}
                />
            </div>

            <div className="flex justify-end mt-6">
                <button onClick={handleAirDropNFT} className="btn btn-primary">
                    空投
                </button>
            </div>
        </div>
    );
};

export default AirDrop;
