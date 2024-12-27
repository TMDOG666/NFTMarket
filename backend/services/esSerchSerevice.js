import client from '../elasticsearch/elasticsearch.js';

const searchNFTCollectibles = async ({ seller, priceRange, isList, color, metadataSearch, limit, offset }) => {
    const query = {
        index: 'nft_collectibles',
        body: {
            from: offset || 0,
            size: limit || 10,
            query: {
                bool: {
                    must: [
                        ...(seller ? [{ term: { seller } }] : []),
                        ...(priceRange ? [{ range: { price: { gte: priceRange[0], lte: priceRange[1] } } }] : []),
                        ...(isList !== undefined ? [{ term: { isList } }] : []),
                        ...(color ? [{ term: { color } }] : []),
                        ...(metadataSearch
                            ? [{
                                multi_match: {
                                    query: metadataSearch,
                                    fields: ['metadata.description', 'metadata.name'],
                                    fuzziness: 'AUTO',
                                },
                            }]
                            : []),
                    ],
                },
            },
        },
    };
    return client.search(query);
};

const searchAuctionCollectibles = async ({ seller, startPriceRange, isActive, color, metadataSearch, limit, offset }) => {
    const query = {
        index: 'auction_collectibles',
        body: {
            from: offset || 0,
            size: limit || 10,
            query: {
                bool: {
                    must: [
                        ...(seller ? [{ term: { seller } }] : []),
                        ...(startPriceRange ? [{ range: { startPrice: { gte: startPriceRange[0], lte: startPriceRange[1] } } }] : []),
                        ...(isActive !== undefined ? [{ term: { isActive } }] : []),
                        ...(color ? [{ term: { color } }] : []),
                        ...(metadataSearch
                            ? [{
                                multi_match: {
                                    query: metadataSearch,
                                    fields: ['metadata.description', 'metadata.name'],
                                    fuzziness: 'AUTO',
                                },
                            }]
                            : []),
                    ],
                },
            },
        },
    };
    return client.search(query);
};

const searchNFTBlindBoxes = async ({ seller, priceRange, isActive, describesSearch, tags, limit, offset }) => {
    const query = {
        index: 'nft_blind_boxes',
        body: {
            from: offset || 0,
            size: limit || 10,
            query: {
                bool: {
                    must: [
                        ...(seller ? [{ term: { seller } }] : []),
                        ...(priceRange ? [{ range: { price: { gte: priceRange[0], lte: priceRange[1] } } }] : []),
                        ...(isActive !== undefined ? [{ term: { isActive } }] : []),
                        ...(describesSearch ? [{ match: { describes: describesSearch } }] : []),
                        ...(tags ? [{ terms: { tags } }] : []),
                    ],
                },
            },
        },
    };
    return client.search(query);
};


export { searchNFTCollectibles, searchAuctionCollectibles, searchNFTBlindBoxes };