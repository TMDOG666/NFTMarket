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
import { InputBase } from "~~/components/scaffold-eth";
import { weiToEther } from "../auction/_components/NFTCard";
import { NFTFrame, ViweNFTFrame } from "~~/components/myframe";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
  });

  const { data: userMintFee } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "userMintFee",
    watch: true,
  });
  const { addNFTCollectible } = GraphqlServer();

  const [shouldUpload, setShouldUpload] = useState<boolean>(false);
  const [metadataQueue, setMetadataQueue] = useState<{ transactionHash: string, metadata: any }[]>([]);


  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState([{ trait_type: "", value: "" }]);
  const [royaltyRate, setRoyaltyRate] = useState<number>(0);
  //const [result, setResult] = useState<string | undefined>(undefined);

  const { data: transferEvents, isLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "NFTMinted",
    fromBlock: 0n, // 起始区块高度，可根据需要调整
    enabled: shouldUpload,
  });

  const handleAddAttribute = () => {
    setAttributes([...attributes, { trait_type: "", value: "" }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeTraitTypeChange = (index: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], trait_type: value };
    setAttributes(newAttributes);
  };

  const handleAttributeValueChange = (index: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], value };
    setAttributes(newAttributes);
  };

  // 更新队列数据并存储到 localStorage
  const updateMetadataQueue = (newQueue: any[]) => {
    setMetadataQueue(newQueue);
    // 将队列数据保存到 localStorage
    localStorage.setItem('metadataQueue', JSON.stringify(newQueue));
  };

  const removeMetadataQueue = () => {
    localStorage.removeItem('metadataQueue');
  };

  const handleAddItemToQueue = (newItem: any) => {
    const updatedQueue = [...metadataQueue, newItem];
    updateMetadataQueue(updatedQueue);
  };

  const handleRemoveItemFromQueue = (index: number) => {
    const updatedQueue = metadataQueue.filter((_, i) => i !== index);
    updateMetadataQueue(updatedQueue);
  };


  const handleMintItem = async () => {
    if (tokenIdCounter === undefined) return;

    const tokenIdCounterNumber = Number(tokenIdCounter);
    const currentTokenMetaData = nftsMetadata[tokenIdCounterNumber % nftsMetadata.length];
    const notificationId = notification.loading("Uploading to IPFS");

    try {
      // 上传 metadata 到 IPFS
      const uploadedItem = await addToIPFS(currentTokenMetaData);
      notification.remove(notificationId);
      notification.success("Metadata uploaded to IPFS");

      // 调用 mintItem 函数
      const transactionHash = await writeContractAsync({
        functionName: "mintItem",
        args: [connectedAddress, uploadedItem?.data.IpfsHash, 100n],
        value: userMintFee
      });
      console.log("Transaction Hash:", transactionHash);

      if (transactionHash) {
        // 将新的映射添加到队列中，保持 FIFO
        setMetadataQueue(prevQueue => {
          const newQueue = [...prevQueue, { transactionHash: transactionHash.toString(), metadata: currentTokenMetaData }];
          if (newQueue.length > 10) {  // 限制队列长度为10，超出时删除最旧的元素
            newQueue.shift();
          }
          return newQueue;
        });
        setShouldUpload(true);
        handleAddItemToQueue({ transactionHash: transactionHash.toString(), metadata: currentTokenMetaData });
      }

    } catch (error) {
      notification.remove(notificationId);
      console.error(error);
    }
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

  // 使用 useEffect 监听 transactionHash 和 transferEvents 变化
  useEffect(() => {
    const savedQueue = localStorage.getItem('metadataQueue');
    if (savedQueue) {
      setMetadataQueue(JSON.parse(savedQueue));
      setShouldUpload(true);
    }
    if (transferEvents && transferEvents.length > 0) {
      // 遍历队列中的每个交易哈希
      metadataQueue.forEach(async (item, index) => {
        try {
          const filteredEvents = transferEvents.filter(event => event.log.transactionHash === item.transactionHash);
          if (filteredEvents.length > 0) {
            const event = filteredEvents[0];
            const tokenId = event.args.tokenId ? parseInt(event.args.tokenId.toString()) : 0;
            const ipfsHash = event.args.tokenURI ? event.args.tokenURI.replace("https://ipfs.io/ipfs/", "") : '';
            const owner = event.args.owner ? event.args.owner : "";
            const royaltyRate = event.args.royaltyRate ? parseInt(event.args.royaltyRate.toString()) : 0;
            const color = event.args.rarity ? getColor(parseInt(event.args.rarity.toString())) : "white";

            console.log("Minted Token ID:", tokenId);
            console.log("IPFS Hash:", ipfsHash);

            // 执行后端上传操作
            await addNFTCollectible({
              id: tokenId,
              uri: ipfsHash,
              owner: owner,
              royaltyRate: royaltyRate,
              color: color,
              metadata: item.metadata
            });

            console.log("NFT uploaded successfully");

            // 上传成功后，删除已处理的队列项
            setMetadataQueue(prevQueue => prevQueue.filter((_, i) => i !== index));
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


  const handleCreateMyNFT = async () => {
    if (!file || !name || !description) return;

    const notificationId = notification.loading("Uploading to IPFS");
    try {
      const imageHash = await uploadFileToIPFS(file);
      const metadata = {
        external_url: "https://ipfs.io/ipfs/QmPS39QmTU9WTqvxEVq79GcguSi1yKnDjd6K3cVFgjeZ1i",
        description,
        name,
        image: getUrl(imageHash?.data.IpfsHash),
        attributes,
      };
      const uploadedItem = await addToIPFS(metadata);

      notification.remove(notificationId);
      notification.success("Metadata uploaded to IPFS");

      const transactionHash = await writeContractAsync({
        functionName: "mintItem",
        args: [connectedAddress, uploadedItem?.data.IpfsHash, BigInt(royaltyRate * 100)],
        value: userMintFee
      });
      if (transactionHash) {
        // 将新的映射添加到队列中
        setMetadataQueue(prevQueue => {
          const newQueue = [...prevQueue, { transactionHash: transactionHash.toString(), metadata }];
          if (newQueue.length > 10) {
            newQueue.shift();
          }
          return newQueue;
        });
        setShouldUpload(true);
        handleAddItemToQueue({ transactionHash: transactionHash.toString(), metadata: metadata });
      }
      setModalIsOpen(false);
    } catch (error) {
      notification.remove(notificationId);
      console.error(error);
    }
  };

  const handleRoyaltyRateChange = (value: number) => {
    const numericValue = value;
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 10) {
      setRoyaltyRate(value); // 验证通过，更新状态
    } else {
      console.log('输入值必须在0到10之间'); // 验证不通过，可以在此处处理错误
    }
  };

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">我的 NFTs</span>
          </h1>
        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="text-xl p-0 m-0 font-semibold text-orange-500">铸造费用： {userMintFee ? weiToEther(userMintFee?.toString()) : ""} ETH</p>
        </div>
      </div>
      <div className="flex justify-center">
        {!isConnected || isConnecting ? (
          <RainbowKitCustomConnectButton />
        ) : (
          <>
            <button className="btn btn-secondary" onClick={() => setModalIsOpen(true)}>
              Create My NFT
            </button>
            <button className="btn btn-secondary" onClick={handleMintItem}>
              Mint NFT
            </button>
          </>
        )}
      </div>
      <MyHoldings />


      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className={"card card-compact bg-base-100 shadow-lg"}
        style={{
          content: {
            width: '800px',
            margin: 'auto',
            marginTop: '100px',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <h2 className="text-lg font-bold mb-4">Create Your NFT</h2>

        <InputBase
          name="name"
          value={name}
          onChange={(value) => setName(value)}
          placeholder="Name"
        ></InputBase>

        <br />

        <InputBase
          placeholder="Description"
          value={description}
          onChange={(value) => setDescription(value)}
          name="description"
        >
        </InputBase>


        <br />

        <button
          onClick={() => document.getElementById('file-upload')?.click()}
          className="btn btn-secondary btn-md px-8 tracking-wide"
        >
          📁 Upload File
        </button>
        <input
          id="file-upload"
          type="file"
          accept="image/*,.glb"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
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
            <div className="h-60 w-60">
              <ViweNFTFrame fileInput={imagePreview} />
            </div>
          </>
        )}

        {attributes.map((attr, index) => (
          <div key={index} className="flex flex-row justify-center mt-1 align-items-center"> {/* 改为 flex-row 并添加 align-items-center 以垂直居中 */}
            <button
              type="button"
              onClick={() => handleRemoveAttribute(index)}
              className="btn btn-secondary btn-md px-2"
              style={{
                width: '10%',
                // flex: 'auto', // 可能不需要，因为已经设置了宽度
                // marginLeft: 'auto', // 可能不需要，因为现在是并排布局
                marginRight: '1%', // 添加右边距以分隔元素
              }}
            >
              -
            </button>
            <div
              style={{
                width: '40%',
                // flex: 'auto', // 可能不需要，因为已经设置了宽度
                marginRight: '1%', // 添加右边距以分隔元素
              }}
            >
              <InputBase
                placeholder="Trait Type"
                value={attr.trait_type}
                onChange={(value) => handleAttributeTraitTypeChange(index, value)}
              />
            </div>

            <div
              style={{
                width: '40%',
                // flex: 'auto', // 可能不需要，因为已经设置了宽度
                marginRight: '1%', // 添加右边距以分隔元素
              }}
            >
              <InputBase
                placeholder="Value"
                value={attr.value}
                onChange={(value) => handleAttributeValueChange(index, value)}
              />
            </div>

            <button
              type="button"
              onClick={handleAddAttribute}
              className="btn btn-secondary btn-md px-2"
              style={{
                width: '10%',
                // flex: 'auto', // 可能不需要，因为已经设置了宽度
                // marginLeft: 'auto', // 可能不需要，因为现在是并排布局
              }}
            >
              +
            </button>
            {/* <br/> 可能不再需要，因为现在是水平布局 */}
          </div>
        ))}
        <br />
        版权比例（0% - 10%）：
        <InputBase
          placeholder="RoyaltyRate"
          value={royaltyRate}
          onChange={(value) => handleRoyaltyRateChange(value)}
        />
        <br />
        <button onClick={handleCreateMyNFT} className="btn btn-primary mb-2">
          Upload & Mint
        </button>
        <br />
        <button onClick={() => setModalIsOpen(false)} className="btn btn-secondary">
          Close
        </button>

        {/* Display metadata as a code block */}
        <pre>
          <code>{JSON.stringify({ name, description, attributes }, null, 2)}</code>
        </pre>
      </Modal>

    </>
  );
};

export default MyNFTs;
