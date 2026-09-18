import { z } from "zod";
import { removeBackground } from "./infrai_client.js";

export const listingRequest = z.object({
  orderId: z.string().min(1),
  image: z.object({ base64: z.string().min(1) }),
  filename: z.string().min(1),
});
export type ListingRequest = z.infer<typeof listingRequest>;
export type ListingReceipt = { orderId: string; status: "ready"; asset: unknown; customerMessage: string };

export async function fulfillListing(input: unknown): Promise<ListingReceipt> {
  const request = listingRequest.parse(input);
  const asset = await removeBackground(request.image as { base64: string }, "png");
  return { orderId: request.orderId, status: "ready", asset, customerMessage: `Order ${request.orderId} image is ready for catalog review.` };
}
