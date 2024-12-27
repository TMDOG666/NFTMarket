"use client";

import type { NextPage } from "next";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { InputBase } from "~~/components/scaffold-eth"; // 根据实际情况导入 InputBase
import { useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { uploadMetadataToIPFS, uploadFilesToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { ViweNFTFrame } from "~~/components/myframe";
import { GraphqlServer } from "~~/utils/graphql-server/GraphqlServer";


const BatchMintPage: NextPage = () => {
    const { writeContractAsync: yourCollectibleWriteContractAsync } = useScaffoldWriteContract("YourCollectible");

    const { address: connectedAddress } = useAccount();
    const [files, setFiles] = useState<File[]>([]); // 存储文件
    const [formData, setFormData] = useState<any[]>([]); // 存储表单数据
    const [currentPage, setCurrentPage] = useState(0); // 当前页
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState([""]);

    const [shouldUpload, setShouldUpload] = useState<boolean>(false);

    const { data: transferEvents } = useScaffoldEventHistory({
        contractName: "YourCollectible",
        eventName: "NFTMinted",
        fromBlock: 0n, // 起始区块高度，可根据需要调整
        enabled: shouldUpload,
    });
    const { addNFTCollectible } = GraphqlServer();

    const [metadataQueue, setMetadataQueue] = useState<{ transactionHash: string, metadataMapping: { metadata: any, metadataUrl: string }[] }[]>([])

    // 文件上传逻辑
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const uploadedFiles = Array.from(e.target.files);
            setFiles(uploadedFiles);

            // 为每个文件生成初始的表单数据
            const newFormData = uploadedFiles.map(() => ({
                name: "",
                description: "",
                attributes: [{ trait_type: "", value: "" }],
                royaltyRate: 0,
                image: null,
            }));
            setFormData(newFormData);

            // 使用 FileReader 读取文件并生成预览
            const newPreviews: string[] = [];
            uploadedFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    console.log(reader.result);
                    newPreviews.push(reader.result as string); // 将预览数据存入数组
                    if (newPreviews.length === uploadedFiles.length) {
                        setImagePreviews(newPreviews); // 所有文件预览读取完成后更新状态
                    }
                };
                reader.readAsDataURL(file); // 读取文件为 base64 字符串
            });
        }
    };


    // 表单数据变化逻辑
    const handleFormDataChange = (index: number, field: string, value: any) => {
        const updatedData = [...formData];
        updatedData[index][field] = value;
        setFormData(updatedData);
    };

    // 属性添加和修改逻辑
    const handleAttributeChange = (index: number, attributeIndex: number, field: string, value: any) => {
        const updatedData = [...formData];
        updatedData[index].attributes[attributeIndex][field] = value;
        setFormData(updatedData);
    };

    const handleAddAttribute = (index: number) => {
        const updatedData = [...formData];
        updatedData[index].attributes.push({ trait_type: "", value: "" });
        setFormData(updatedData);
    };

    const handleRemoveAttribute = (index: number, attributeIndex: number) => {
        const updatedData = [...formData];
        updatedData[index].attributes.splice(attributeIndex, 1);
        setFormData(updatedData);
    };

    // NFT 批量铸造逻辑
    const handleMintNFTs = async () => {
        setIsLoading(true);

        try {
            const notificationId = notification.loading("Uploading to IPFS");

            // 上传文件到 IPFS
            const uploadedFiles = await uploadFilesToIPFS(files);

            // 生成 Metadata 并上传
            const metadataList = formData.map((data, index) => ({
                description: data.description || "No description",
                image: uploadedFiles[index],
                name: data.name || `NFT ${index + 1}`,
                attributes: data.attributes || [],
            }));

            const { metadataUrls, metadataMapping } = await uploadMetadataToIPFS(metadataList);

            notification.remove(notificationId);
            notification.success("Metadata uploaded to IPFS");

            const royaltyRates = formData.map((data) => {
                const rate = parseFloat(data.royaltyRate) || 0;
                if (rate < 0 || rate > 20) throw new Error("Royalty rate must be between 0% and 20%");
                return BigInt(Math.floor(rate * 100));
            });

            // 智能合约批量铸造
            const transactionHash = await yourCollectibleWriteContractAsync({
                functionName: "batchMintItems",
                args: [connectedAddress, metadataUrls, royaltyRates],
            });


            console.log("Transaction hash: ", transactionHash);

            console.log("Metadata Mapping: ", metadataMapping);

            if (transactionHash) {
                setMetadataQueue(prevQueue => {
                    const newQueue = [...prevQueue, { transactionHash: transactionHash.toString(), metadataMapping: metadataMapping }];
                    if (newQueue.length > 10) {  // 限制队列长度为10，超出时删除最旧的元素
                        newQueue.shift();
                    }
                    return newQueue;
                });
                setShouldUpload(true);
                handleAddItemToQueue({ transactionHash: transactionHash.toString(), metadataMapping: metadataMapping });
            }



            notification.success("NFTs successfully minted!");
        } catch (error) {
            console.error("Error minting NFTs:", error);
            notification.error("Error minting NFTs.");
        } finally {
            setIsLoading(false);
        }
    };

    // 更新队列数据并存储到 localStorage
    const updateMetadataQueue = (newQueue: any[]) => {
        setMetadataQueue(newQueue);
        // 将队列数据保存到 localStorage
        localStorage.setItem('batchMintMetadataQueue', JSON.stringify(newQueue));
    };

    const removeMetadataQueue = () => {
        localStorage.removeItem('batchMintMetadataQueue');
    };

    const handleAddItemToQueue = (newItem: any) => {
        const updatedQueue = [...metadataQueue, newItem];
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
        const savedQueue = localStorage.getItem('metadataQueue');
        console.log("Saved Queue:", savedQueue);
        if (savedQueue) {
            setMetadataQueue(JSON.parse(savedQueue));
            setShouldUpload(true);
        }
        if (transferEvents && transferEvents.length > 0) {

            metadataQueue.forEach(async (item, index) => {
                try {
                    const filteredEvents = transferEvents.filter(event => event.log.transactionHash === item.transactionHash);
                    console.log("Filtered Events:", filteredEvents);
                    item.metadataMapping.forEach(async (metadata: any) => {
                        const event = filteredEvents.find(event => event.log.args.tokenURI === metadata.metadataUrl);
                        if (!event) return;
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
                            metadata: metadata.metadata
                        });

                        console.log("NFT uploaded successfully");
                    });
                    // 上传成功后，删除已处理的队列项
                    setMetadataQueue(prevQueue => prevQueue.filter((_, i) => i !== index));
                    removeMetadataQueue();
                    window.location.reload();
                    notification.success("NFTs successfully minted!");
                } catch (e) {
                    // 处理错误
                    console.error("Error processing event for transactionHash:", item.transactionHash, e);
                    // 可以选择在这里进行一些补救操作，例如将失败的项重新放回队列或记录日志等
                }
            });
        }
    }, [transferEvents]);

    const handlePageChange = (direction: string) => {
        if (direction === "next" && currentPage < Math.floor(files.length / 3)) {
            setCurrentPage((prevPage) => prevPage + 1);
        } else if (direction === "prev" && currentPage > 0) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h2 className="text-2xl font-bold mb-4">Batch Mint NFTs</h2>

            {/* 文件上传按钮 */}
            <button onClick={() => document.getElementById("file-upload")?.click()} className="btn btn-secondary btn-md px-8 tracking-wide">
                📁 Upload Files
            </button>
            <input
                id="file-upload"
                type="file"
                accept="image/*,.glb"
                multiple
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* 文件表单渲染 */}
            {files.length > 0 && (
                <div>
                    {formData.slice(currentPage * 3, currentPage * 3 + 3).map((data, index) => {
                        const formIndex = currentPage * 3 + index;
                        return (
                            <div key={formIndex} className="card card-compact bg-base-100 shadow-xl mt-4">
                                <div className="card-body">
                                    <h3 className="card-title">NFT #{formIndex + 1}</h3>
                                    <div className="h-60 w-60">
                                        <ViweNFTFrame fileInput={imagePreviews[formIndex]} />
                                    </div>
                                    <InputBase
                                        name="name"
                                        value={data.name}
                                        onChange={(value) => handleFormDataChange(formIndex, "name", value)}
                                        placeholder="Name"
                                    />

                                    <InputBase
                                        name="description"
                                        value={data.description}
                                        onChange={(value) => handleFormDataChange(formIndex, "description", value)}
                                        placeholder="Description"
                                    />

                                    {data.attributes.map((attr: any, attributeIndex: any) => (
                                        <div key={attributeIndex} className="flex items-center mt-1">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAttribute(formIndex, attributeIndex)}
                                                className="btn btn-secondary btn-md px-2"
                                            >
                                                -
                                            </button>
                                            <InputBase
                                                value={attr.trait_type}
                                                onChange={(value) => handleAttributeChange(formIndex, attributeIndex, "trait_type", value)}
                                                placeholder="Trait Type"
                                            />
                                            <InputBase
                                                value={attr.value}
                                                onChange={(value) => handleAttributeChange(formIndex, attributeIndex, "value", value)}
                                                placeholder="Value"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddAttribute(formIndex)}
                                                className="btn btn-secondary btn-md px-2"
                                            >
                                                +
                                            </button>
                                        </div>
                                    ))}

                                    <InputBase
                                        name="royaltyRate"
                                        value={data.royaltyRate}
                                        onChange={(value) => handleFormDataChange(formIndex, "royaltyRate", value)}
                                        placeholder="Royalty Rate(0%-20%)"
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {/* 分页 */}

                    <div className="flex justify-between mt-4">
                        <button onClick={() => handlePageChange("prev")} className="btn btn-secondary" disabled={currentPage === 0}>
                            Previous
                        </button>
                        <button onClick={() => handlePageChange("next")} className="btn btn-secondary" disabled={currentPage >= Math.floor(files.length / 3)}>
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* 批量铸造按钮 */}
            <button onClick={handleMintNFTs} className="btn btn-primary mt-4" disabled={isLoading}>
                {isLoading ? "Minting..." : "Mint NFTs"}
            </button>
        </div>
    );
};

export default BatchMintPage;
