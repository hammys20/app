import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const { item } = await req.json();

  if (!item?.name || !item?.price) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [`${process.env.NEXT_PUBLIC_SITE_URL}${item.image}`] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/inventory`,
  });

  return NextResponse.json({ url: session.url });
}
