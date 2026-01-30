import Stripe from "stripe";
import { NextResponse } from "next/server";
import { generateClient } from "aws-amplify/data";

// ✅ Must match your installed stripe types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

// If you use Amplify Data in this route, keep this (TS-safe)
const client = generateClient({ authMode: "apiKey" }) as any;

type Item = {
  id: string;
  name: string;
  price?: number;
  description?: string;
  image?: string;
};

export async function POST(req: Request) {
  try {
    const { itemId } = await req.json();

    // Example: fetch item (adjust if your file already does this differently)
    const { data: item, errors } = await client.models.InventoryItem.get({
      id: itemId,
    });

    if (errors?.length || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round((item.price ?? 0) * 100),
            product_data: {
              name: item.name,
              description: item.description ?? "",
              images: item.image ? [item.image] : [],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
