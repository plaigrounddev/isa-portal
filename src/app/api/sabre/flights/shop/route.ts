import { NextRequest, NextResponse } from "next/server";
import { flightShop } from "@/lib/sabre/air";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabin,
      maxOffers = 20,
    } = body;

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: "origin, destination, and departureDate are required" },
        { status: 400 }
      );
    }

    const result = await flightShop({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabin,
      maxOffers,
      returnOfferAttributes: ["Baggage", "Flexibility"],
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/sabre/flights/shop]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
