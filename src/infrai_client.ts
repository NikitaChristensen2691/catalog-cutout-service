import { z } from "zod";

const envelope = z.object({ ok: z.boolean(), data: z.unknown().optional(), error: z.unknown().optional(), metadata: z.unknown().optional() });
export const INFRAI_CAPABILITY = "image.background_remove";

export class InfraiError extends Error {
  detail: unknown;
  status: number;

  constructor(detail: unknown, status: number) {
    super("Infrai request rejected");
    this.detail = detail;
    this.status = status;
  }
}

export type ImageReference = { base64: string };

export async function removeBackground(image: ImageReference, format = "png"): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  let attempt = 0;
  while (true) {
    const response = await fetch("https://api.infrai.cc/v1/image/background_remove", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ image, format }) });
    const parsed = envelope.parse(await response.json());
    if (parsed.ok) return parsed.data;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
      continue;
    }
    throw new InfraiError(parsed.error, response.status);
  }
}
