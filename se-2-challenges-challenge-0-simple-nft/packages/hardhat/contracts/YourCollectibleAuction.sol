// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { AutomationCompatibleInterface } from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./YourCollectible.sol";

contract YourCollectibleAuction is
	AutomationCompatibleInterface,
	IERC721Receiver,
	Ownable
{
	struct Auction {
		address seller;
		uint256 tokenId;
		uint256 startPrice;
		uint256 highestBid;
		address highestBidder;
		uint256 endTime;
		uint256 minIncrement;
		bool isActive;
	}

	uint256 public auctionCount;
	mapping(uint256 => Auction) public auctions;
	uint256[] public activeAuctions;
	YourCollectible public nftContract;

	event AuctionCreated(
		uint256 indexed auctionId,
		uint256 tokenId,
		address seller,
		uint256 startPrice,
		uint256 minIncrement,
		uint256 endTime
	);
	event BidPlaced(
		uint256 indexed auctionId,
		address bidder,
		uint256 amount,
		uint256 ackTime
	);
	event AuctionEnded(
		uint256 indexed auctionId,
		address winner,
		uint256 winningBid
	);

	constructor(address _nftContract) {
		nftContract = YourCollectible(_nftContract);
	}

	function getAuction(
		uint256 auctionId
	) external view returns (Auction memory) {
		return auctions[auctionId];
	}

	function createAuction(
		uint256 tokenId,
		uint256 startPrice,
		uint256 minIncrement,
		uint256 duration
	) external payable {
		require(msg.value >= nftContract.listingFee(),"Listing fee not met");
		require(
			nftContract.ownerOf(tokenId) == msg.sender,
			"You are not the owner of this NFT"
		);
		require(
			nftContract.getApproved(tokenId) == address(this) ||
				nftContract.isApprovedForAll(msg.sender, address(this)),
			"Auction contract not approved"
		);
		require(minIncrement > 0, "Minimum increment must be greater than 0");
		require(duration > 0, "Duration must be greater than 0");

		IERC721(nftContract).safeTransferFrom(
			msg.sender,
			address(this),
			tokenId
		);

		auctions[auctionCount] = Auction({
			seller: msg.sender,
			tokenId: tokenId,
			startPrice: startPrice,
			highestBid: 0,
			highestBidder: address(0),
			endTime: block.timestamp + duration,
			minIncrement: minIncrement,
			isActive: true
		});

		activeAuctions.push(auctionCount);

		emit AuctionCreated(
			auctionCount,
			tokenId,
			msg.sender,
			startPrice,
			minIncrement,
			block.timestamp + duration
		);

		auctionCount += 1;
	}

	function placeBid(uint256 auctionId, uint256 ackTime) external payable {
		Auction storage auction = auctions[auctionId];
		require(auction.isActive, "Auction is not active");
		require(ackTime < auction.endTime, "Auction has ended");
		require(
			msg.sender != auction.seller,
			"Seller cannot bid on their own auction"
		);
		require(
			msg.value >= auction.startPrice,
			"Bid must be at least the start price"
		);
		require(
			msg.value >= auction.highestBid + auction.minIncrement,
			"Bid increment too low"
		);

		if (auction.highestBidder != address(0)) {
			payable(auction.highestBidder).transfer(auction.highestBid);
		}

		auction.highestBid = msg.value;
		auction.highestBidder = msg.sender;

		emit BidPlaced(auctionId, msg.sender, msg.value, ackTime);
	}

	function endAuction(uint256 auctionId) public {
		Auction storage auction = auctions[auctionId];
		require(auction.isActive, "Auction is not active");
		require(
			block.timestamp >= auction.endTime,
			"Auction has not ended yet"
		);

		auction.isActive = false;

		_removeAuctionFromActive(auctionId);

		if (auction.highestBidder != address(0)) {
			IERC721(nftContract).safeTransferFrom(
				address(this),
				auction.highestBidder,
				auction.tokenId
			);

			payable(auction.seller).transfer(auction.highestBid);
			emit AuctionEnded(
				auctionId,
				auction.highestBidder,
				auction.highestBid
			);
		} else {
			IERC721(nftContract).safeTransferFrom(
				address(this),
				auction.seller,
				auction.tokenId
			);
			emit AuctionEnded(auctionId, address(0), 0);
		}
	}

	function checkUpkeep(
		bytes calldata
	)
		external
		view
		override
		returns (bool upkeepNeeded, bytes memory performData)
	{
		uint256 count = 0;

		for (uint256 i = 0; i < activeAuctions.length; i++) {
			uint256 auctionId = activeAuctions[i];
			if (
				auctions[auctionId].isActive &&
				block.timestamp >= auctions[auctionId].endTime
			) {
				count++;
			}
		}

		if (count > 0) {
			uint256[] memory auctionsToEnd = new uint256[](count);
			uint256 index = 0;

			for (uint256 i = 0; i < activeAuctions.length; i++) {
				uint256 auctionId = activeAuctions[i];
				if (
					auctions[auctionId].isActive &&
					block.timestamp >= auctions[auctionId].endTime
				) {
					auctionsToEnd[index] = auctionId;
					index++;
				}
			}

			return (true, abi.encode(auctionsToEnd, count));
		}

		return (false, "");
	}

	function performUpkeep(bytes calldata performData) external override {
		(uint256[] memory auctionsToEnd, uint256 count) = abi.decode(
			performData,
			(uint256[], uint256)
		);

		for (uint256 i = 0; i < count; i++) {
			uint256 auctionId = auctionsToEnd[i];
			if (
				auctions[auctionId].isActive &&
				block.timestamp >= auctions[auctionId].endTime
			) {
				endAuction(auctionId);
			}
		}
	}

	function _removeAuctionFromActive(uint256 auctionId) internal {
		for (uint256 i = 0; i < activeAuctions.length; i++) {
			if (activeAuctions[i] == auctionId) {
				activeAuctions[i] = activeAuctions[activeAuctions.length - 1];
				activeAuctions.pop();
				break;
			}
		}
	}


	function withdraw() external onlyOwner {
		uint256 balanceToWithdraw = address(this).balance;
		require(balanceToWithdraw > 0, "No balance to withdraw");


		payable(owner()).transfer(balanceToWithdraw);
	}

	function getContractBalance() external view returns (uint256) {
		return address(this).balance;
	}

	function onERC721Received(
		address /*operator*/,
		address /*from*/,
		uint256 /*tokenId*/,
		bytes calldata /*data*/
	) external pure override returns (bytes4) {
		return this.onERC721Received.selector;
	}
}
