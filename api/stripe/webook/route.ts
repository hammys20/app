import Stripe from "stripe";
import { NextResponse } from "next/server";
import { gql } from "@/lib/appsync";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

/* ---------- GraphQL ---------- */

const UPDATE_ITEM = /* GraphQL */ `
  mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {
    updateInventoryItem(input: $input) {
      id
      status
    }
  }
`;

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // ✅ Payment complete → SOLD
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const itemId = session.metadata?.itemId;

    if (itemId) {
      await gql(UPDATE_ITEM, {
        input: {
          id: itemId,
          status: "sold",
          soldAt: new Date().toISOString(),
          buyerEmail: session.customer_details?.email,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          lockExpiresAt: null,
          lockedBySessionId: null,
        },
      });
    }
  }

  // ⏱ Session expired → unlock
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const itemId = session.metadata?.itemId;

    if (itemId) {
      await gql(UPDATE_ITEM, {
        input: {
          id: itemId,
          status: "available",
          lockExpiresAt: null,
          lockedBySessionId: null,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
