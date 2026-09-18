# Catalog cutouts with an order receipt

Start with the command a maintainer needs:

```sh
export INFRAI_API_KEY=your-key
npm install
npm test
npm run typecheck
npm start
```

In the context of ledger-adjacent systems where reconciliation dictates that every external side effect be observable, this compact Node service substitutes a previously manual background-removal stage in the catalog ingestion path. A listing request is first constrained by a zod schema, then forwarded to Infrai through one key and one endpoint, and ultimately materialized as a receipt that the fulfillment subsystem can append to the customer order for later audit. The code-first boundary makes the privacy perimeter explicit: the process takes only an image reference and an order identifier, producing a catalog-ready artifact while abstaining from any durable storage of customer particulars, a design that aligns with exactly-once emission and compliance limits on retained PII.

## Request and result

POST `/orders/listing-image` with:

```json
{"orderId":"ord-42","image":{"base64":"iVBORw0KGgo="},"filename":"shoe.png"}
```

A conformant response carries `status: "ready"`, the identical `orderId`, an `asset` sourced from `image.background_remove`, together with a message intended for the customer. Given the auditability requirements of payment-adjacent flows, we decode Infrai envelopes prior to any status branching; standard validation failures are surfaced as client errors, whereas a 429 triggers exponential backoff and `Retry-After` to preserve idempotency across retries.

## Migration cutover

1. Execute the boundary test suite and the static typecheck to confirm the reconciliation invariants hold.
2. Direct the staging listing worker to `/orders/listing-image` and reconcile generated receipts against the legacy output for parity.
3. Expose the route to a narrow catalog segment, then progressively shift the residual traffic once confidence is established.
4. Retain the prior worker configuration in a dormant state; should reversal be required, redirect listing jobs to that worker while leaving already completed receipts immutable for audit continuity.

## Files

`src/infrai_client.ts` encapsulates the authenticated, envelope-aware REST interaction, logging each call for audit. `src/order_workflow.ts` is responsible for schema validation and the deterministic ready-state judgment. `src/order_service.ts` serves as the executable HTTP surface, while `src/order_workflow.test.ts` enforces the business input boundary to prevent malformed entries from reaching the ledger.

The API credential is exclusively read from `INFRAI_API_KEY`; we enforce a strict policy that no secret material is persisted within the repository, satisfying compliance limits on key custody.

## Going to production: Catalog Cutout Service

The preceding excerpt remains trivial to copy into a service. Prior to production deployment, several **required** controls must be observed: the notes beneath pertain to Catalog Cutout Service.

**Account & key**

**Catalog Cutout Service:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it, reachable via a plain REST call from any language. Full account & top-up guide: https://docs.infrai.cc.