import { useState, useEffect } from "react";
import NFTFrame from "~~/components/myframe/Frame";
import { notification } from "~~/utils/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import deployedContracts from '~~/contracts/deployedContracts';
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";
import { useAccount } from "wagmi";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import Modal from "react-modal";



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

export const AddNewNFTModal = ({
    blindBox,
    isOpen,
    onClose,
}: {
    blindBox: NFTBlindBox;
    isOpen: boolean;
    onClose: () => void;
}) => {
    const { address: connectedAddress } = useAccount();
    const { writeContractAsync } = useScaffoldWriteContract("BlindBox");
    const { writeContractAsync: writeYourCollectibleAsync } = useScaffoldWriteContract("YourCollectible");
    const [selectedNFTs, setSelectedNFTs] = useState<Collectible[]>();
    const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
    const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
    const [myTotalBalance, setMyTotalBalance] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const { addNFTBlindBox, queryAccountNFT, updateBatchNFTCollectibleOwner, updateNFTBlindBoxTokenIds } = GraphqlServer();

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
        const updateMyCollectibles = async () => {
            if (!connectedAddress) return;

            setAllCollectiblesLoading(true);
            const query = (await queryAccountNFT(connectedAddress.toString(), 1000, 0)) as Query;
            const updatedCollectibles = query.items.map((collectible) => ({
                ...collectible,
                ...collectible.metadata,
            }));

            updatedCollectibles.sort((a, b) => a.id - b.id);
            setMyAllCollectibles(updatedCollectibles);
            setMyTotalBalance(query.totalCount);
            setAllCollectiblesLoading(false);
        };

        updateMyCollectibles();
    }, [connectedAddress]);

    const handleCreateMyNFTBlindBox = async () => {
        if (!selectedNFTs || !connectedAddress) {
            notification.error("请填写所有必需信息并选择至少一个NFT。");
            return;
        }

        const notificationId = notification.loading("正在补货...");
        try {
            await writeYourCollectibleAsync({
                functionName: "batchApprove",
                args: [
                    deployedContracts[11155111].BlindBox.address,
                    selectedNFTs.map((nft: Collectible) => BigInt(nft.id)),
                ],
            });
            await writeContractAsync({
                functionName: "addNFTs",
                args: [BigInt(blindBox.id), selectedNFTs.map((nft) => BigInt(nft.id))],
            });
            await updateBatchNFTCollectibleOwner({
                ids: selectedNFTs.map((nft) => nft.id),
                owner: deployedContracts[11155111].BlindBox.address,
            });
            await updateNFTBlindBoxTokenIds(blindBox.id, [
                ...blindBox.tokenIds,
                ...selectedNFTs.map((nft) => nft.id),
            ]);

            onClose(); // 调用父组件的关闭逻辑
            notification.remove(notificationId);
            notification.success("补货成功！")
        } catch (error) {
            notification.remove(notificationId);
            console.error(error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="card card-compact bg-base-100 shadow-lg"
            style={{
                content: {
                    width: "100%",
                    maxWidth: "800px",
                    maxHeight: "80vh",
                    margin: "auto",
                    marginTop: "100px",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    overflow: "hidden",
                    overflowY: "auto",
                },
            }}
        >
            <h2 className="text-lg font-bold mb-4">拍卖你的NFT</h2>
            {/* 下拉选择框 */}
            <div className="flex flex-col my-2 ">
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
                        className={`dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full max-w-[600px] absolute left-1/2 transform -translate-x-1/2 mt-2 ${
                            isDropdownOpen ? "block" : "hidden"
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
                                    <span className="badge badge-primary py-3">{nft.color}</span>
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
                                <span className="text-xs text-center">
                                    {nft.name || `NFT #${nft.id}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end mt-4 space-x-4">
                <button onClick={handleCreateMyNFTBlindBox} className="btn btn-primary">
                    上架
                </button>
                <button onClick={onClose} className="btn btn-secondary">
                    关闭
                </button>
            </div>
        </Modal>
    );
};
