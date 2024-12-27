import { ethers } from 'ethers';
import { Client } from '@elastic/elasticsearch';
import fs from 'fs'; 


const esClient = new Client({
  node: 'http://localhost:9200',
  auth: {
      apiKey: 'bnhBQUFwUUJYSWZWUzNReGRtU2s6aGt0TWV0ekRRX3FyeC1mSVFoTXZ6Zw==', // 将此处替换为你的 API 密钥
  }
});

// 配置以太坊和合约信息
const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/1mxmxfYIPsIwfcWJhMqhH-imGBYYjgFQ'); // 替换为你的 Infura 或节点地址
const contractAddressABI = {
  BlindBox: {
    address: "0x7d817aa97b19b08C784F2A1d1f211c33fDE077B1",
    abi: [
      {
        inputs: [
          {
            internalType: "uint256",
            name: "subscriptionId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "_blindBoxListFee",
            type: "uint256",
          },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "have",
            type: "address",
          },
          {
            internalType: "address",
            name: "want",
            type: "address",
          },
        ],
        name: "OnlyCoordinatorCanFulfill",
        type: "error",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "have",
            type: "address",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "address",
            name: "coordinator",
            type: "address",
          },
        ],
        name: "OnlyOwnerOrCoordinator",
        type: "error",
      },
      {
        inputs: [],
        name: "ZeroAddress",
        type: "error",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "boxId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "nftContract",
            type: "address",
          },
        ],
        name: "BoxCreated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "requestId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "boxId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "nftId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "buyer",
            type: "address",
          },
        ],
        name: "BoxPurchased",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "requestId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "boxId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "roller",
            type: "address",
          },
        ],
        name: "BoxPurchasedRequest",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "boxId",
            type: "uint256",
          },
        ],
        name: "BoxRemoved",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "vrfCoordinator",
            type: "address",
          },
        ],
        name: "CoordinatorSet",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "boxId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256[]",
            name: "nftIds",
            type: "uint256[]",
          },
        ],
        name: "NFTAdded",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "boxId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "nftId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "to",
            type: "address",
          },
        ],
        name: "NFTWithdrawn",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
        ],
        name: "OwnershipTransferRequested",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
        ],
        name: "OwnershipTransferred",
        type: "event",
      },
      {
        inputs: [],
        name: "acceptOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "boxId",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "nftIds",
            type: "uint256[]",
          },
        ],
        name: "addNFTs",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "blindBoxListFee",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "boxCounter",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "boxes",
        outputs: [
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "nftContract",
            type: "address",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "callbackGasLimit",
        outputs: [
          {
            internalType: "uint32",
            name: "",
            type: "uint32",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "nftContract",
            type: "address",
          },
          {
            internalType: "uint256[]",
            name: "nftIds",
            type: "uint256[]",
          },
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
        ],
        name: "createBox",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "getContractBalance",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "getRequestId",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "numWords",
        outputs: [
          {
            internalType: "uint32",
            name: "",
            type: "uint32",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "",
            type: "bytes",
          },
        ],
        name: "onERC721Received",
        outputs: [
          {
            internalType: "bytes4",
            name: "",
            type: "bytes4",
          },
        ],
        stateMutability: "pure",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "boxId",
            type: "uint256",
          },
        ],
        name: "purchaseBox",
        outputs: [
          {
            internalType: "uint256",
            name: "requestId",
            type: "uint256",
          },
        ],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "requestId",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "randomWords",
            type: "uint256[]",
          },
        ],
        name: "rawFulfillRandomWords",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "boxId",
            type: "uint256",
          },
        ],
        name: "removeBox",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "requestConfirmations",
        outputs: [
          {
            internalType: "uint16",
            name: "",
            type: "uint16",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "s_keyHash",
        outputs: [
          {
            internalType: "bytes32",
            name: "",
            type: "bytes32",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "s_subscriptionId",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "s_vrfCoordinator",
        outputs: [
          {
            internalType: "contract IVRFCoordinatorV2Plus",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "_vrfCoordinator",
            type: "address",
          },
        ],
        name: "setCoordinator",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "vrfCoordinator",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    inheritedFunctions: {
      acceptOwnership:
        "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol",
      owner:
        "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol",
      rawFulfillRandomWords:
        "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol",
      s_vrfCoordinator:
        "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol",
      setCoordinator:
        "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol",
      transferOwnership:
        "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol",
      onERC721Received:
        "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol",
    },
  },
  YourCollectible: {
    address: "0x30ecbdB14Dc042E4e68aA5181de4f5B317b23eB7",
    abi: [
      {
        inputs: [
          {
            internalType: "uint256",
            name: "_listFee",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "_userMintFee",
            type: "uint256",
          },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "recipient",
            type: "address",
          },
        ],
        name: "Airdrop",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "approved",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Approval",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "operator",
            type: "address",
          },
          {
            indexed: false,
            internalType: "bool",
            name: "approved",
            type: "bool",
          },
        ],
        name: "ApprovalForAll",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "_fromTokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "_toTokenId",
            type: "uint256",
          },
        ],
        name: "BatchMetadataUpdate",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "seller",
            type: "address",
          },
        ],
        name: "Listed",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "_tokenId",
            type: "uint256",
          },
        ],
        name: "MetadataUpdate",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: false,
            internalType: "string",
            name: "tokenURI",
            type: "string",
          },
          {
            indexed: false,
            internalType: "uint96",
            name: "royaltyRate",
            type: "uint96",
          },
          {
            indexed: false,
            internalType: "enum YourCollectible.Rarity",
            name: "rarity",
            type: "uint8",
          },
        ],
        name: "NFTMinted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "previousOwner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "newOwner",
            type: "address",
          },
        ],
        name: "OwnershipTransferred",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "seller",
            type: "address",
          },
          {
            indexed: false,
            internalType: "address",
            name: "buyer",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "royaltyAmount",
            type: "uint256",
          },
        ],
        name: "Purchased",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
      {
        inputs: [
          {
            internalType: "address[]",
            name: "recipients",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "tokenIds",
            type: "uint256[]",
          },
        ],
        name: "airdrop",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "approve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256[]",
            name: "tokenIds",
            type: "uint256[]",
          },
        ],
        name: "batchApprove",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "string[]",
            name: "uris",
            type: "string[]",
          },
          {
            internalType: "uint96[]",
            name: "royaltyRates",
            type: "uint96[]",
          },
        ],
        name: "batchMintItems",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "delistNFT",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "getApproved",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getContractBalance",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "getRarity",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "getRoyaltyRate",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
        ],
        name: "isApprovedForAll",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
        ],
        name: "listNFT",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "listingFee",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "listings",
        outputs: [
          {
            internalType: "address",
            name: "seller",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "listingFee",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isList",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "string",
            name: "uri",
            type: "string",
          },
          {
            internalType: "uint96",
            name: "royaltyRate",
            type: "uint96",
          },
        ],
        name: "mintItem",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "name",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "",
            type: "bytes",
          },
        ],
        name: "onERC721Received",
        outputs: [
          {
            internalType: "bytes4",
            name: "",
            type: "bytes4",
          },
        ],
        stateMutability: "pure",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "ownerOf",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "purchaseNFT",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "salePrice",
            type: "uint256",
          },
        ],
        name: "royaltyInfo",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
          {
            internalType: "bool",
            name: "approved",
            type: "bool",
          },
        ],
        name: "setApprovalForAll",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "bytes4",
            name: "interfaceId",
            type: "bytes4",
          },
        ],
        name: "supportsInterface",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "symbol",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "index",
            type: "uint256",
          },
        ],
        name: "tokenByIndex",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "tokenIdCounter",
        outputs: [
          {
            internalType: "uint256",
            name: "_value",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "index",
            type: "uint256",
          },
        ],
        name: "tokenOfOwnerByIndex",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "tokenRarity",
        outputs: [
          {
            internalType: "enum YourCollectible.Rarity",
            name: "",
            type: "uint8",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "tokenURI",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "totalBalance",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "totalSupply",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "transferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "newOwner",
            type: "address",
          },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
        ],
        name: "updateNFTPrice",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "userMintFee",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    inheritedFunctions: {
      approve:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      balanceOf:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      getApproved:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      isApprovedForAll:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      name: "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      ownerOf:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      safeTransferFrom:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      setApprovalForAll:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      supportsInterface:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      symbol:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      tokenURI:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      transferFrom:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      tokenByIndex:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol",
      tokenOfOwnerByIndex:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol",
      totalSupply:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol",
      onERC721Received:
        "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol",
      royaltyInfo:
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol",
      owner: "@openzeppelin/contracts/access/Ownable.sol",
      renounceOwnership: "@openzeppelin/contracts/access/Ownable.sol",
      transferOwnership: "@openzeppelin/contracts/access/Ownable.sol",
    },
  },
  YourCollectibleAuction: {
    address: "0x096b75483D274c952855Deb9668d95A3dc74c3a5",
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "_nftContract",
            type: "address",
          },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "seller",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "startPrice",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "minIncrement",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
        ],
        name: "AuctionCreated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "winner",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "winningBid",
            type: "uint256",
          },
        ],
        name: "AuctionEnded",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "ackTime",
            type: "uint256",
          },
        ],
        name: "BidPlaced",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "previousOwner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "newOwner",
            type: "address",
          },
        ],
        name: "OwnershipTransferred",
        type: "event",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "activeAuctions",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "auctionCount",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "auctions",
        outputs: [
          {
            internalType: "address",
            name: "seller",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "startPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "highestBid",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "highestBidder",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minIncrement",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "",
            type: "bytes",
          },
        ],
        name: "checkUpkeep",
        outputs: [
          {
            internalType: "bool",
            name: "upkeepNeeded",
            type: "bool",
          },
          {
            internalType: "bytes",
            name: "performData",
            type: "bytes",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "startPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minIncrement",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256",
          },
        ],
        name: "createAuction",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "endAuction",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "getAuction",
        outputs: [
          {
            components: [
              {
                internalType: "address",
                name: "seller",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "startPrice",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "highestBid",
                type: "uint256",
              },
              {
                internalType: "address",
                name: "highestBidder",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "endTime",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minIncrement",
                type: "uint256",
              },
              {
                internalType: "bool",
                name: "isActive",
                type: "bool",
              },
            ],
            internalType: "struct YourCollectibleAuction.Auction",
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getContractBalance",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "nftContract",
        outputs: [
          {
            internalType: "contract YourCollectible",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "",
            type: "bytes",
          },
        ],
        name: "onERC721Received",
        outputs: [
          {
            internalType: "bytes4",
            name: "",
            type: "bytes4",
          },
        ],
        stateMutability: "pure",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "performData",
            type: "bytes",
          },
        ],
        name: "performUpkeep",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ackTime",
            type: "uint256",
          },
        ],
        name: "placeBid",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "newOwner",
            type: "address",
          },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    inheritedFunctions: {
      checkUpkeep:
        "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol",
      performUpkeep:
        "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol",
      onERC721Received:
        "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol",
      owner: "@openzeppelin/contracts/access/Ownable.sol",
      renounceOwnership: "@openzeppelin/contracts/access/Ownable.sol",
      transferOwnership: "@openzeppelin/contracts/access/Ownable.sol",
    },
  },
}

const blindbox = contractAddressABI.BlindBox;
const nft = contractAddressABI.YourCollectible;
const nftAuction = contractAddressABI.YourCollectibleAuction;

// 创建合约实例
const blindBoxcontract = new ethers.Contract(blindbox.address, blindbox.abi, provider);
const nftcontract = new ethers.Contract(nft.address, nft.abi, provider);
const nftAuctioncontract = new ethers.Contract(nftAuction.address, nftAuction.abi, provider);


// 索引名称
const indexName = 'contract_events';

// 创建索引的映射（Mapping）
async function createIndex() {
  const mapping = {
    "mappings": {
      "properties": {
        "contract_address": { "type": "keyword" },
        "transaction_hash": { "type": "keyword" },
        "block_number": { "type": "long" },
        "caller_address": { "type": "keyword" },
        "gas_used": { "type": "long" },
        "gas_price": { "type": "long" },
        "event_name": { "type": "keyword" },
        "timestamp": { "type": "date" },
      }
    }
  };

  try {
    await esClient.indices.create({ index: indexName, body: mapping });
    console.log(`✅ 索引 ${indexName} 已创建`);
  } catch (error) {
    if (error.meta.body.error.type !== 'resource_already_exists_exception') {
      console.error(`创建索引失败: ${error}`);
    }
  }
}

// 插入事件数据到 Elasticsearch
async function insertEventToES(event, receipt) {
  const txHash = event.log.transactionHash;
  const blockNumber = parseFloat(event.log.blockNumber.toString());
  const callerAddress = receipt.from;  // 假设第一个参数是调用者地址
  const gasUsed = parseFloat(receipt.gasUsed.toString());
  const gasPrice = parseFloat(receipt.gasPrice.toString());
  const eventName = event.log.fragment.name;
  // 获取指定区块的详细信息
  const block = await provider.getBlock(blockNumber);
  const timestamp =new Date(block.timestamp*1000);   // 使用当前时间戳，或者根据区块信息查询

  const doc = {
    contract_address: event.address,
    transaction_hash: txHash,
    block_number: blockNumber,
    caller_address: callerAddress,
    gas_used: gasUsed,
    gas_price: gasPrice,
    event_name: eventName,
    timestamp: timestamp,
  };

  try {
    await esClient.index({
      index: indexName,
      body: doc,
    });
    console.log('✅ 事件已存储到 Elasticsearch');
  } catch (error) {
    console.error('存储事件时出错:', error);
  }
}

// 监听 BlindBox 合约的事件
blindBoxcontract.on('*', async (event) => {
  try {
    const txHash = event.log.transactionHash;
    const receipt = await provider.getTransactionReceipt(txHash);
    await insertEventToES(event, receipt);
  } catch (error) {
    console.error('处理 BlindBox 合约事件时出错:', error);
  }
});

// 监听 NFT 合约的事件
nftcontract.on('*', async (event) => {
  try {
    const txHash = event.log.transactionHash;
    const receipt = await provider.getTransactionReceipt(txHash);
    await insertEventToES(event, receipt);
  } catch (error) {
    console.error('处理 NFT 合约事件时出错:', error);
  }
});

// 监听 NFT Auction 合约的事件
nftAuctioncontract.on('*', async (event) => {
  try {
    const txHash = event.log.transactionHash;
    const receipt = await provider.getTransactionReceipt(txHash);
    await insertEventToES(event, receipt);
  } catch (error) {
    console.error('处理 NFT Auction 合约事件时出错:', error);
  }
});

// 启动监听并创建索引
(async () => {
  await createIndex();
  console.log('✅ 开始监听合约的事件');
})();

