import Joi from "joi"; // 用于数据校验


// 6. 数据校验
const validateAuctionCollectible = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    tokenId: Joi.number().required(),
    uri: Joi.string().required(),
    owner: Joi.string().required(),
    seller: Joi.string().required(),
    startPrice: Joi.number().unsafe().optional(),  // 允许任意数字
    highestBid: Joi.number().unsafe().optional(),  // 允许任意数字
    highestBidder: Joi.string().optional(),
    endTime: Joi.number().unsafe().optional(),  // 允许任意数字
    isActive: Joi.boolean().required(),
    minIncrement: Joi.number().unsafe().optional(),  // 允许任意数字
    color: Joi.string().optional(),
    metadata: Joi.object().optional(),
  });
  const { error } = schema.validate(data);
  if (error) throw new Error(`Validation error: ${error.message}`);
};

const validateNFTCollectible = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    uri: Joi.string().required(),
    owner: Joi.string().required(),
    seller: Joi.string().required(),
    price: Joi.number().unsafe().optional(),
    isList: Joi.boolean().required(),
    royaltyRate: Joi.number().required(),
    color: Joi.string().optional(),
    metadata: Joi.object().optional(),
  });
  const { error } = schema.validate(data);
  if (error) throw new Error(`Validation error: ${error.message}`);
};

const validateNFTBlindBox = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    tokenIds: Joi.array().items(Joi.number()).required(),
    describes: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    seller: Joi.string().required(),
    isActive: Joi.boolean().required(),
    price: Joi.number().unsafe().optional(),
    //允许为空
    coverUrl: Joi.string().optional(),
  })
  const { error } = schema.validate(data);
  if (error) throw new Error(`Validation error: ${error.message}`);
}


export { validateAuctionCollectible, validateNFTCollectible, validateNFTBlindBox };