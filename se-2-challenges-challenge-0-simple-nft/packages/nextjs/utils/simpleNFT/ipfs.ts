import { create } from "kubo-rpc-client";

const PROJECT_ID = "2GajDLTC6y04qsYsoDRq9nGmWwK";
const PROJECT_SECRET = "48c62c6b3f82d2ecfa2cbe4c90f97037";
const PROJECT_ID_SECRECT = `${PROJECT_ID}:${PROJECT_SECRET}`;
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzOWY1MjFkYi0zYzU5LTQxYTctYWJjOS0zM2RlYjk3Yjg1N2QiLCJlbWFpbCI6IjE5ODEzNDcwOThAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImVkYTcxZDU4OTEzMWVkZDVlNDU0Iiwic2NvcGVkS2V5U2VjcmV0IjoiMzUyODVhNzJmZTIwYmU1ZTZlMDE1ZmU1OTVkMmM2YWI0OGMyNGZjZDNiNzY5ZGQ1Zjc2OWM4MWFmOTBiMzQ2NCIsImlhdCI6MTcxNzM3Nzc0M30.MKBiBCvhUKgcOtVkMRM2ROSkoKaq52k7WwqmKXCPwUs"

export const ipfsClient = create({
  host: "https://api.pinata.cloud/pinning/pinFileToIPFS",
  //port: 5001,
  protocol: "https",
  headers: {
    Authorization: `Basic ${JWT}`,
  },
});

export async function getNFTMetadataFromIPFS(ipfsHash: string) {
  for await (const file of ipfsClient.get(ipfsHash)) {
    // The file is of type unit8array so we need to convert it to string
    const content = new TextDecoder().decode(file);
    // Remove any leading/trailing whitespace
    const trimmedContent = content.trim();
    // Find the start and end index of the JSON object
    const startIndex = trimmedContent.indexOf("{");
    const endIndex = trimmedContent.lastIndexOf("}") + 1;
    // Extract the JSON object string
    const jsonObjectString = trimmedContent.slice(startIndex, endIndex);
    try {
      const jsonObject = JSON.parse(jsonObjectString);
      return jsonObject;
    } catch (error) {
      console.log("Error parsing JSON:", error);
      return undefined;
    }
  }
}
