import { NextRequest, NextResponse } from "next/server";
import { searchHotelRates } from "@/lib/liteapi/hotels";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      cityName,
      countryCode = "US",
      checkin,
      checkout,
      adults = 2,
      children = [],
      rooms = 1,
      currency = "USD",
      guestNationality = "US",
      limit = 20,
    } = body;

    if (!cityName || !checkin || !checkout) {
      return NextResponse.json(
        { error: "cityName, checkin, and checkout are required" },
        { status: 400 }
      );
    }

    const result = await searchHotelRates({
      cityName,
      countryCode,
      checkin,
      checkout,
      adults,
      children,
      rooms,
      currency,
      guestNationality,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/hotels/search]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
