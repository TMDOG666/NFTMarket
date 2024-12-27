import axios from "axios";

const path = process.env.NEXT_PUBLIC_GRAPHQL_SERVER_HOST || "http://localhost:4000";

// 创建一个通用的 GraphQL 请求函数
export const fetchGraphQL = async (query: string, variables: Record<string, any> = {}) => {
  console.log(process.env.NEXT_PUBLIC_GRAPHQL_SERVER_HOST)
  try {
    const response = await axios.post(path, {
      query,
      variables,
    });
    if (response.data.errors) {
      console.error("GraphQL 错误:", response.data.errors);
      throw new Error("GraphQL error occurred");
    }
    return response.data.data;
  } catch (error) {
    console.error("网络请求错误:", error);
    throw error;
  }
};