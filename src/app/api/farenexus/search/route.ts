import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/farenexus/search";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      tripType,
      travelClass,
      pos,
    } = body;

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: "origin, destination, and departureDate are required" },
        { status: 400 }
      );
    }

    const result = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      tripType,
      travelClass,
      pos,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/farenexus/search]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
