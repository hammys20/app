import { headers } from "next/headers";
import Stripe from "stripe";
import { gql } from "@/lib/appsync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature")!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const itemId = session.metadata.itemId;

    await gql(
      `
      mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {
        updateInventoryItem(input: $input) {
          id
        }
      }
      `,
      {
        input: {
          id: itemId,
          status: "sold",
        },
      }
    );
  }

  return new Response("ok");
}
