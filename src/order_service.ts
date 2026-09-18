import { createServer } from "node:http";
import { fulfillListing } from "./order_workflow.js";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/orders/listing-image") { res.writeHead(404).end(); return; }
  let body = "";
  for await (const chunk of req) body += chunk;
  try { const receipt = await fulfillListing(JSON.parse(body)); res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(receipt)); }
  catch (error) { res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "invalid request" })); }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("order service listening"));
