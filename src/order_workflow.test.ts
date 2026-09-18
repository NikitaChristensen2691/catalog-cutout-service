import assert from "node:assert/strict";
import { listingRequest } from "./order_workflow.js";

const parsed = listingRequest.safeParse({ orderId: "ord-42", image: { base64: "iVBORw0KGgo=" }, filename: "shoe.png" });
assert.equal(parsed.success, true);
assert.equal(listingRequest.safeParse({ orderId: "", image: "x", filename: "x" }).success, false);
console.log("listing request boundary: valid input accepted, empty order rejected");
