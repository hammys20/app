import Stripe from "stripe";
import { NextResponse } from "next/server";
import { gql } from "@/lib/appsync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

/* ---------- GraphQL ---------- */

const GET_ITEM = /* GraphQL */ `
  query GetInventoryItem($id: ID!) {
    getInventoryItem(id: $id) {
      id
      name
      price
      image
      status
      lockExpiresAt
    }
  }
`;

const UPDATE_ITEM = /* GraphQL */ `
  mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {
    updateInventoryItem(input: $input) {
      id
      status
    }
  }
`;

export async function POST(req: Request) {
  const { itemId } = await req.json();

  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
  }

  // 1️⃣ Fetch item
  const data = await gql(GET_ITEM, { id: itemId });
  const item = data.getInventoryItem;

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const now = Date.now();
  const lockExpires = item.lockExpiresAt
    ? Date.parse(item.lockExpiresAt)
    : 0;

  if (item.status === "sold") {
    return NextResponse.json({ error: "Item sold" }, { status: 409 });
  }

  if (item.status === "reserved" && lockExpires > now) {
    return NextResponse.json({ error: "Item reserved" }, { status: 409 });
  }

  // 2️⃣ Create Stripe Checkout
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_creation: "if_required",

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [`${SITE_URL}${item.image}`] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      },
    ],

    metadata: { itemId },

    success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/inventory`,
  });

  // 3️⃣ Lock inventory (15 min)
  await gql(UPDATE_ITEM, {
    input: {
      id: itemId,
      status: "reserved",
      lockExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      lockedBySessionId: session.id,
      stripeSessionId: session.id,
    },
  });

  return NextResponse.json({ url: session.url });
}
