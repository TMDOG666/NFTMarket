import { useState, useEffect } from "react";
import NFTFrame from "~~/components/myframe/Frame";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";
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

export const ShowNFTModal = ({
    blindBox,
    isOpen,
    onClose,
}: {
    blindBox: NFTBlindBox;
    isOpen: boolean;
    onClose: () => void;
}) => {
    const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
    const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0); // 总数
    const [currentPage, setCurrentPage] = useState(1); // 当前页
    const pageSize = 6; // 每页显示数量

    const { queryNFTByIds } = GraphqlServer();

    const colorRanking: { [key: string]: number } = {
        red: 1,
        gold: 2,
        purple: 3,
        blue: 4,
        green: 5,
        white: 6,
    };

    const sortByColor = (nfts: Collectible[]) => {
        return nfts.sort((a, b) => {
            const colorA = colorRanking[a.color.toLowerCase()] || 6; // 默认到白色
            const colorB = colorRanking[b.color.toLowerCase()] || 6; // 默认到白色
            return colorA - colorB;
        });
    };

    const fetchCollectibles = async (page: number) => {
        setAllCollectiblesLoading(true);
        try {
            const offset = (page - 1) * pageSize;
            const result = await queryNFTByIds(blindBox.tokenIds, pageSize, offset);
            setMyAllCollectibles(sortByColor(result.items));
            setTotalCount(result.totalCount);
        } catch (error) {
            console.error("Error fetching NFTs for blind box:", error);
        } finally {
            setAllCollectiblesLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCollectibles(currentPage);
        }
    }, [isOpen, currentPage]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
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
            <h2 className="text-lg font-bold mb-4">查看盲盒</h2>
            <div className="flex justify-end mt-4 space-x-4">
                <button onClick={onClose} className="btn btn-secondary">
                    关闭
                </button>
            </div>
            {allCollectiblesLoading ? (
                <div>加载中...</div>
            ) : (
                <div>
                    <label className="text-lg font-semibold mb-2">盲盒中的 NFT：</label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                        {myAllCollectibles.map((nft) => (
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
                                <span className="badge badge-primary py-1">{nft.color}</span>
                            </div>
                        ))}
                    </div>
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
                </div>
            )}
        </Modal>
    );
};
