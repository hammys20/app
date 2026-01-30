import { headers } from "next/headers";
import Stripe from "stripe";
import { NextResponse } from "next/server";

// ✅ Must match your installed Stripe types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = (await headers()).get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET" },
        { status: 500 }
      );
    }

    const event = stripe.webhooks.constructEvent(body, sig, secret);

    // ✅ TODO: handle events you care about (safe default for now)
    switch (event.type) {
      case "checkout.session.completed":
        // const session = event.data.object as Stripe.Checkout.Session;
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err?.message ?? err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
