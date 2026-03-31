import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/farenexus/search";

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
      tripType,
      travelClass,
      pos,
    } = body as Record<string, string | undefined>;

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

    const baseParams = {
      origin,
      destination,
      departureDate,
      passengers: passengers as unknown as { type: "ADT" | "CNN" | "INF"; quantity: number }[] | undefined,
      travelClass: travelClass as "ECO" | "PEY" | "BUS" | "FIR" | undefined,
      pos: pos as string | undefined,
    };

    const searchParams =
      tripType === "RT" && returnDate
        ? { ...baseParams, tripType: "RT" as const, returnDate: returnDate as string }
        : tripType === "MC"
          ? { ...baseParams, tripType: "MC" as const, returnDate: returnDate as string | undefined }
          : { ...baseParams, tripType: "OW" as const };

    const result = await searchFlights(searchParams);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/farenexus/search]", err);
    return NextResponse.json(
      { error: "Unable to search flights" },
      { status: 500 }
    );
  }
}
