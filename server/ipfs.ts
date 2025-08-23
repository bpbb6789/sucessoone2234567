import { PinataSDK } from "pinata";

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
});

export async function uploadFileToIPFS(file: File): Promise<string> {
  try {
    const response = await pinata.upload.file(file);
    return response.cid;
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    throw new Error("Failed to upload file to IPFS");
  }
}

export async function uploadJSONToIPFS(metadata: any): Promise<string> {
  try {
    // Convert JSON to File object for v3 API
    const jsonFile = new File(
      [JSON.stringify(metadata, null, 2)], 
      "metadata.json",
      { type: "application/json" }
    );
    
    const response = await pinata.upload.file(jsonFile);
    return response.cid;
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error);
    throw new Error("Failed to upload metadata to IPFS");
  }
}