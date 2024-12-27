import { useState } from "react";
import { Collectible } from "./MyHoldings";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import NFTFrame from "~~/components/myframe/Frame";
import { useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";


export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const { address: connectedAddress } = useAccount();

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { updateBuyNFTCollectible } = GraphqlServer();

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
        <div className="card-actions justify-end">
          <button
            className="btn btn-secondary btn-md px-8 tracking-wide"
            onClick={async () => {
              try {
                await writeContractAsync({
                  functionName: "purchaseNFT",
                  args: [BigInt(nft.id.toString())],
                  value: parseEther(nft.price)
                });
                if (connectedAddress)
                  await updateBuyNFTCollectible({
                    id: nft.id,
                    owner: connectedAddress.toString(),
                  });
                window.location.reload();
              } catch (err) {
                console.error("Error calling transferFrom function");
              }
            }}
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
};
