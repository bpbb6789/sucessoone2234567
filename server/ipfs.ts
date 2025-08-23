import { PinataSDK } from "pinata";

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
});

export async function uploadFileToIPFS(file: File): Promise<string> {
  try {
    const response = await pinata.upload.public.file(file);
    return response.cid;
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    throw new Error("Failed to upload file to IPFS");
  }
}

export async function uploadJSONToIPFS(metadata: any): Promise<string> {
  try {
    // Use the direct JSON upload method from v3 API
    const response = await pinata.upload.public.json(metadata);
    return response.cid;
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error);
    throw new Error("Failed to upload metadata to IPFS");
  }
}