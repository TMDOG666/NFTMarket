import { ipfsClient } from "~~/utils/simpleNFT/ipfs";
import { PinataSDK } from "pinata";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ipfsClient.add(JSON.stringify(body));
    return Response.json(res);
  } catch (error) {
    console.log("Error adding to ipfs", error);
    return Response.json({ error: "Error adding to ipfs" });
  }
}
