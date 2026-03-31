import { NextRequest, NextResponse } from "next/server";
import { flightShop } from "@/lib/sabre/air";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

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

    if (origin === destination) {
      return NextResponse.json(
        { error: "origin and destination must be different" },
        { status: 400 }
      );
    }

    const result = await flightShop({
      origin: origin as string,
      destination: destination as string,
      departureDate: departureDate as string,
      returnDate: returnDate as string | undefined,
      passengers: passengers as { passengerTypeCode: string; count?: number }[] | undefined,
      cabin: cabin as "Economy" | "Business" | "First" | undefined,
      maxOffers: maxOffers as number,
      returnOfferAttributes: ["Baggage", "Flexibility"],
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/sabre/flights/shop]", err);
    return NextResponse.json(
      { error: "Unable to search flights" },
      { status: 500 }
    );
  }
}
