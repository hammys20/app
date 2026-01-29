import { NextResponse } from "next/server";
import Stripe from "stripe";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

export const runtime = "nodejs";

/**
 * IMPORTANT:
 * Configure Amplify at module load so generateClient has GraphQL config available.
 */
Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>({ authMode: "apiKey" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

type Item = {
  id: string;
  name: string;
  price?: number;
  status?: string;
  image?: string;
  description?: string;
};

export async function POST(req: Request) {
  try {
    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const res = await client.models.InventoryItem.get({ id: String(itemId) });
    const item = (res.data as unknown as Item) ?? null;

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const isAvailable = (item.status ?? "").trim().toLowerCase() === "available";
    if (!isAvailable) {
      return NextResponse.json({ error: "Item not available" }, { status: 400 });
    }

    if (typeof item.price !== "number" || item.price <= 0) {
      return NextResponse.json({ error: "Item has no price" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/item/${encodeURIComponent(item.id)}?canceled=1`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(item.price * 100),
            product_data: {
              name: item.name,
              description: item.description || undefined,
              // Keep images optional to avoid weirdness if URL is signed/expiring
              // images: ...
            },
          },
        },
      ],
      metadata: { itemId: item.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json({ error: e?.message || "Checkout failed" }, { status: 500 });
  }
}
