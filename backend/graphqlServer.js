import { ApolloServer} from "apollo-server";
import dotenv from "dotenv";

import { resolvers } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { checkAuctionStatus } from "./utils/ceon.js";

// 环境变量配置
dotenv.config();

// 启动定时任务，每分钟执行一次检查
setInterval(checkAuctionStatus, 10000);

// 7. 创建 Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// 8. 启动服务器
server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
