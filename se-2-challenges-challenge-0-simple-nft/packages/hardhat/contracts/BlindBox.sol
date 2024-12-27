// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";


contract BlindBox is VRFConsumerBaseV2Plus, IERC721Receiver {
	struct Box {
		uint256 price; 
		uint256[] nftIds; 
		address nftContract; 
		bool isActive; 
	}

    uint256 public s_subscriptionId;
    address public vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
    bytes32 public s_keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 public callbackGasLimit = 200000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    constructor(uint256 subscriptionId , uint256 _blindBoxListFee) VRFConsumerBaseV2Plus(vrfCoordinator) {
		blindBoxListFee = _blindBoxListFee;
        s_subscriptionId = subscriptionId;
    }

	uint256 public blindBoxListFee; 

	uint256 public boxCounter; 
	mapping(uint256 => Box) public boxes; 

	mapping(address => uint256) private userRequestId;
    
    mapping(uint256 => address) private s_rollers;

    mapping(uint256 => uint256) private s_boxIds;

	event BoxCreated(uint256 indexed boxId, uint256 price, address nftContract);
	event BoxRemoved(uint256 indexed boxId);
	event NFTAdded(uint256 indexed boxId, uint256[] nftIds);
	event NFTWithdrawn(uint256 indexed boxId, uint256 nftId, address to);
	event BoxPurchased(uint256 requestId, uint256 indexed boxId, uint256 nftId, address buyer);
    event BoxPurchasedRequest(uint256 indexed requestId, uint256 boxId, address indexed roller);

	// 上架盲盒
	function createBox(
		address nftContract,
		uint256[] calldata nftIds,
		uint256 price
	) external onlyOwner payable{
		require(nftContract != address(0), "Invalid NFT contract");
		require(nftIds.length > 0, "No NFTs provided");

		if (msg.sender != owner()){
			require(msg.value >= blindBoxListFee, "Insufficient fee");
		}

	
		boxCounter++;
		uint256 boxId = boxCounter;

		Box storage box = boxes[boxId];
		box.price = price;
		box.nftContract = nftContract;
		box.isActive = true;


		for (uint256 i = 0; i < nftIds.length; i++) {
			uint256 nftId = nftIds[i];


			require(
				IERC721(nftContract).getApproved(nftId) == address(this) ||
					IERC721(nftContract).isApprovedForAll(
						msg.sender,
						address(this)
					),
				"NFT not approved for transfer"
			);


			IERC721(nftContract).safeTransferFrom(
				msg.sender,
				address(this),
				nftId
			);
			box.nftIds.push(nftId);
		}

		emit BoxCreated(boxId, price, nftContract);
	}


	function addNFTs(
		uint256 boxId,
		uint256[] calldata nftIds
	) external onlyOwner {
		Box storage box = boxes[boxId];
		require(box.isActive, "Box is not active");
		require(nftIds.length > 0, "No NFTs provided");

		for (uint256 i = 0; i < nftIds.length; i++) {
			IERC721(box.nftContract).safeTransferFrom(
				msg.sender,
				address(this),
				nftIds[i]
			);
			box.nftIds.push(nftIds[i]);
		}

		emit NFTAdded(boxId, nftIds);
	}


	function removeBox(uint256 boxId) external onlyOwner {
		Box storage box = boxes[boxId];
		require(box.isActive, "Box is not active");


		for (uint256 i = 0; i < box.nftIds.length; i++) {
			uint256 nftId = box.nftIds[i];
			IERC721(box.nftContract).safeTransferFrom(
				address(this),
				msg.sender,
				nftId
			);
		}

		box.isActive = false;

		emit BoxRemoved(boxId);
	}


	function purchaseBox(uint256 boxId) external payable returns (uint256 requestId) {
	    Box storage box = boxes[boxId];
	    require(box.isActive, "Box is not active");
	    require(box.nftIds.length > 0, "Box is empty");
	    require(msg.value >= box.price, "Insufficient payment");


	    requestId = s_vrfCoordinator.requestRandomWords(
	        VRFV2PlusClient.RandomWordsRequest({
	            keyHash: s_keyHash,
	            subId: s_subscriptionId,
	            requestConfirmations: requestConfirmations,
	            callbackGasLimit: callbackGasLimit,
	            numWords: numWords,
	            extraArgs: VRFV2PlusClient._argsToBytes(
	                // Set nativePayment to true to pay for VRF requests with Sepolia ETH instead of LINK
	                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
	            )
	        })
	    );


	    s_rollers[requestId] = msg.sender;
	    s_boxIds[requestId] = boxId;
		userRequestId[msg.sender] = requestId;

	    emit BoxPurchasedRequest(requestId, boxId, msg.sender);
	}


	function fulfillRandomWords(
	    uint256 requestId,
	    uint256[] calldata randomWords
	) internal override {

	    address buyer = s_rollers[requestId];
	    uint256 boxId = s_boxIds[requestId];

	    Box storage box = boxes[boxId];


	    uint256 randomIndex = randomWords[0] % box.nftIds.length;
	    uint256 nftId = box.nftIds[randomIndex];


	    IERC721(box.nftContract).safeTransferFrom(
	        address(this),
	        buyer,
	        nftId
	    );


	    box.nftIds[randomIndex] = box.nftIds[box.nftIds.length - 1];
	    box.nftIds.pop();

	    emit BoxPurchased(requestId, boxId, nftId, buyer);
	}


	function getRequestId(address user) external view returns (uint256) {
		return userRequestId[user];
	}


	function onERC721Received(
		address /*operator*/,
		address /*from*/,
		uint256 /*tokenId*/,
		bytes calldata /*data*/
	) external pure override returns (bytes4) {
		return this.onERC721Received.selector;
	}


	function withdraw() external onlyOwner {
		uint256 balanceToWithdraw = address(this).balance;
		require(balanceToWithdraw > 0, "No balance to withdraw");


		payable(owner()).transfer(balanceToWithdraw);
	}


	function getContractBalance() external view returns (uint256) {
		return address(this).balance;
	}
}
