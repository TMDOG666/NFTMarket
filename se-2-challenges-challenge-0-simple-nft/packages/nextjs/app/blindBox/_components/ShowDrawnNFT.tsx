import Modal from "react-modal";
import NFTFrame from "~~/components/myframe/Frame";
import { Collectible } from "./MyHoldings";
import { Address } from "~~/components/scaffold-eth";

export const PrizePreviewModal = ({
  nft,
  isOpen,
  onClose,
}: {
  nft: Collectible;
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal modal-open modal-middle flex items-center justify-center"
      overlayClassName="modal-overlay"
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
      <div className="card card-compact bg-base-100 shadow-lg w-full">
        {/* 图片展示 */}
        <figure className="relative">
          <div className="min-w-full" style={{height:'600px'}}>
            <NFTFrame fileUrl={nft.metadata?.image} frameColor={nft.color} />
          </div>
          <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
            <span className="text-white font-bold">#{nft.id}</span>
          </figcaption>
        </figure>
        <div className="card-body space-y-3">
          {/* 奖品名称 */}
          <div className="flex justify-between items-center">
            <p className="text-xl font-bold">{nft.metadata?.name || "未命名的奖品"}</p>
            <span className="badge badge-secondary py-2 px-4">{nft.color}</span>
          </div>

          {/* 描述 */}
          {nft.description && (
            <p className="text-gray-600 text-sm">{nft.metadata?.description}</p>
          )}

          {/* 属性展示 */}
          {nft.metadata?.attributes && nft.metadata?.attributes.length > 0 && (
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">奖品属性：</h3>
              <div className="flex flex-wrap space-x-2">
                {nft.metadata.attributes.map((attr, index) => (
                  <span key={index} className="badge badge-primary py-2">
                    {attr.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 拥有者信息 */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold">拥有者:</span>
            <Address address={nft.owner} />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4 mt-4">
            <button className="btn btn-secondary" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
