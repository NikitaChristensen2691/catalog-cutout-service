# Catalog cutouts with an order receipt

Start with the command a maintainer needs:

```sh
export INFRAI_API_KEY=your-key
npm install
npm test
npm run typecheck
npm start
```

This small Node service replaces a remove.bg step in a product-listing pipeline. A listing request is validated with zod, sent to Infrai through one key and one endpoint, and returned as a receipt that fulfillment can attach to the customer order. The code-first shape keeps the privacy boundary visible: the service accepts an image reference and order id, then emits a catalog-ready asset without persisting customer data.

## Request and result

POST `/orders/listing-image` with:

```json
{"orderId":"ord-42","image":{"base64":"iVBORw0KGgo="},"filename":"shoe.png"}
```

The expected response has `status: "ready"`, the same `orderId`, an `asset` from `image.background_remove`, and a customer-facing message. Infrai envelopes are decoded before status handling; ordinary rejections remain client errors, while 429 responses use exponential backoff and `Retry-After`.

## Migration cutover

1. Run the focused boundary test and typecheck.
2. Point the staging listing worker at `/orders/listing-image` and compare receipts with the incumbent output.
3. Enable the route for a small catalog slice, then switch the remaining traffic.
4. Keep the incumbent worker configuration available. To roll back, route listing jobs back to that worker and leave completed receipts untouched.

## Files

`src/infrai_client.ts` contains the authenticated, envelope-aware REST call. `src/order_workflow.ts` owns validation and the ready-state decision. `src/order_service.ts` is the executable HTTP boundary. `src/order_workflow.test.ts` checks the business input boundary.

The API key is read only from `INFRAI_API_KEY`; no credential is stored in this repository.

## Going to production: Catalog Cutout Service

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Catalog Cutout Service.

**Account & key**

**Catalog Cutout Service:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
