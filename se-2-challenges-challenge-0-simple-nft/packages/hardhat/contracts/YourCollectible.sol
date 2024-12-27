// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract YourCollectible is
	ERC721,
	ERC721Enumerable,
	ERC721URIStorage,
	IERC721Receiver,
	ERC721Royalty,
	Ownable
{
	using Counters for Counters.Counter;

	Counters.Counter public tokenIdCounter;

	uint256 public listingFee;

	uint256 public userMintFee;

	mapping(uint256 => bool) private _firstPurchase;
	mapping(uint256 => uint96) private _royaltyRate;

	struct Listing {
		address seller;
		uint256 price;
		uint256 listingFee;
		bool isList;
	}

	uint256 balance = 0;

	mapping(uint256 => Listing) public listings;

	enum Rarity {
		white,
		green,
		blue,
		purple,
		gold,
		red
	}
	mapping(uint256 => Rarity) public tokenRarity;

	event Listed(uint256 indexed tokenId, uint256 price, address seller);

	event Purchased(
		uint256 indexed tokenId,
		address seller,
		address buyer,
		uint256 price,
		uint256 royaltyAmount
	);

	event NFTMinted(
		uint256 tokenId,
		address owner,
		string tokenURI,
		uint96 royaltyRate,
		Rarity rarity
	);

	event Airdrop(uint256 tokenId, address recipient);

	constructor(
		uint256 _listFee,
		uint256 _userMintFee
	) ERC721("YourCollectible", "YCB") {
		listingFee = _listFee;
		userMintFee = _userMintFee;
	}

	function _baseURI() internal pure override returns (string memory) {
		return "https://ipfs.io/ipfs/";
	}

	function _assignRarity(uint256 tokenId) internal returns (Rarity) {
		uint256 rand = uint256(
			keccak256(
				abi.encodePacked(block.timestamp, block.prevrandao, tokenId)
			)
		) % 100;

		if (rand < 35) {
			tokenRarity[tokenId] = Rarity.white;
		} else if (rand < 60) {
			tokenRarity[tokenId] = Rarity.green;
		} else if (rand < 80) {
			tokenRarity[tokenId] = Rarity.blue;
		} else if (rand < 90) {
			tokenRarity[tokenId] = Rarity.purple;
		} else if (rand < 97) {
			tokenRarity[tokenId] = Rarity.gold;
		} else {
			tokenRarity[tokenId] = Rarity.red;
		}

		return tokenRarity[tokenId];
	}


    function batchApprove(address to, uint256[] calldata tokenIds) external {
        require(to != address(0), "Cannot approve to zero address");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) == msg.sender, "Caller is not token owner");

            approve(to, tokenId);
        }
    }



	function batchMintItems(
		address to,
		string[] memory uris,
		uint96[] memory royaltyRates
	) public onlyOwner {
		require(
			uris.length == royaltyRates.length,
			"Mismatched uris and royaltyRates"
		);

		for (uint256 i = 0; i < uris.length; i++) {
			tokenIdCounter.increment();
			uint256 tokenId = tokenIdCounter.current();

			_safeMint(to, tokenId);
			_setTokenURI(tokenId, uris[i]);
			_setTokenRoyalty(tokenId, to, royaltyRates[i]);
			_royaltyRate[tokenId] = royaltyRates[i];
			_firstPurchase[tokenId] = true;

			Rarity rarity = _assignRarity(tokenId);

			emit NFTMinted(tokenId, to, uris[i], royaltyRates[i], rarity);
		}

		balance += uris.length;
	}

	function airdrop(
		address[] calldata recipients,
		uint256[] calldata tokenIds
	) external onlyOwner {
		require(recipients.length == tokenIds.length, "Mismatched inputs");

		for (uint256 i = 0; i < recipients.length; i++) {
			uint256 tokenId = tokenIds[i];
			address recipient = recipients[i];

			require(ownerOf(tokenId) == owner(), "Admin must own the token");

			_transfer(owner(), recipient, tokenId);


			listings[tokenId].isList = false;
			listings[tokenId].seller = recipient;

			emit Airdrop(tokenId, recipient);
		}
	}

	function listNFT(uint256 tokenId, uint256 price) external payable {
		require(msg.value >= listingFee, "Insufficient listing fee");

		require(
			IERC721(address(this)).getApproved(tokenId) == address(this) ||
				IERC721(address(this)).isApprovedForAll(
					msg.sender,
					address(this)
				),
			"Marketplace not approved"
		);

		IERC721(address(this)).safeTransferFrom(
			msg.sender,
			address(this),
			tokenId
		);

		if (listings[tokenId].seller != address(0)) {
			listings[tokenId].seller = msg.sender;
			listings[tokenId].price = price;
			listings[tokenId].listingFee = msg.value;
			listings[tokenId].isList = true;
		} else {
			listings[tokenId] = Listing({
				seller: msg.sender,
				price: price,
				listingFee: msg.value,
				isList: true
			});
		}

		emit Listed(tokenId, price, msg.sender);
	}

	function delistNFT(uint256 tokenId) external {
		require(msg.sender == listings[tokenId].seller, "Not authorized");
		listings[tokenId].isList = false;
		IERC721(address(this)).safeTransferFrom(
			address(this),
			msg.sender,
			tokenId
		);
	}

	function updateNFTPrice(uint256 tokenId, uint256 price) external {
		require(msg.sender == listings[tokenId].seller, "Not authorized");
		listings[tokenId].price = price;
	}

	function purchaseNFT(uint256 tokenId) external payable {
		Listing memory listing = listings[tokenId];
		require(listing.price > 0, "NFT not listed");
		require(msg.value >= listing.price, "Insufficient funds sent");

		if (_firstPurchase[tokenId]) {
			_firstPurchase[tokenId] = false;
			payable(listing.seller).transfer(msg.value);
			emit Purchased(tokenId, listing.seller, msg.sender, msg.value, 0);
		} else {
			uint256 salePrice = msg.value;
			(address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(
				tokenId,
				salePrice
			);
			require(
				msg.value >= royaltyAmount,
				"Insufficient payment for royalty"
			);

			payable(royaltyReceiver).transfer(royaltyAmount);

			payable(listing.seller).transfer(salePrice - royaltyAmount);
			emit Purchased(
				tokenId,
				listing.seller,
				msg.sender,
				msg.value,
				royaltyAmount
			);
		}

		IERC721(address(this)).safeTransferFrom(
			address(this),
			msg.sender,
			tokenId
		);

		listings[tokenId].isList = false;
		listings[tokenId].seller = msg.sender;
	}

	function mintItem(
		address to,
		string memory uri,
		uint96 royaltyRate
	) public payable {
		require(msg.value >= userMintFee, "Insufficient user mint fee");
		tokenIdCounter.increment();
		uint256 tokenId = tokenIdCounter.current();
		_safeMint(to, tokenId);
		_setTokenURI(tokenId, uri);
		_setTokenRoyalty(tokenId, to, royaltyRate);
		_royaltyRate[tokenId] = royaltyRate;
		_firstPurchase[tokenId] = true;
		balance++;
		Rarity rarity = _assignRarity(tokenId);
		emit NFTMinted(tokenId, to, uri, royaltyRate, rarity);
	}

	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId,
		uint256 quantity
	) internal override(ERC721, ERC721Enumerable) {
		super._beforeTokenTransfer(from, to, tokenId, quantity);
	}

	function _burn(
		uint256 tokenId
	) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
		super._burn(tokenId);
	}

	function tokenURI(
		uint256 tokenId
	) public view override(ERC721, ERC721URIStorage) returns (string memory) {
		return super.tokenURI(tokenId);
	}

	function supportsInterface(
		bytes4 interfaceId
	)
		public
		view
		override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}

	function totalBalance() external view returns (uint256) {
		return balance;
	}

	function getRoyaltyRate(uint256 tokenId) external view returns (uint256) {
		return _royaltyRate[tokenId];
	}

	function getRarity(uint256 tokenId) external view returns (string memory) {
		Rarity rarity = tokenRarity[tokenId];
		if (rarity == Rarity.white) return "white";
		if (rarity == Rarity.green) return "green";
		if (rarity == Rarity.blue) return "blue";
		if (rarity == Rarity.purple) return "purple";
		if (rarity == Rarity.gold) return "gold";
		if (rarity == Rarity.red) return "red";
		return "Unknown";
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
