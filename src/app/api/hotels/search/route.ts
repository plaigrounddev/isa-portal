import { NextRequest, NextResponse } from "next/server";
import { searchHotelRates } from "@/lib/liteapi/hotels";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

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
    } = body as Record<string, unknown>;

    if (!cityName || !checkin || !checkout) {
      return NextResponse.json(
        { error: "cityName, checkin, and checkout are required" },
        { status: 400 }
      );
    }

    const checkinDate = new Date(checkin as string);
    const checkoutDate = new Date(checkout as string);
    if (
      isNaN(checkinDate.getTime()) ||
      isNaN(checkoutDate.getTime()) ||
      checkoutDate <= checkinDate
    ) {
      return NextResponse.json(
        { error: "checkout must be after checkin and both must be valid dates" },
        { status: 400 }
      );
    }

    const adultsNum = Math.max(1, Math.min(Number(adults) || 2, 10));
    const roomsNum = Math.max(1, Math.min(Number(rooms) || 1, 10));
    const limitNum = Math.max(1, Math.min(Number(limit) || 20, 50));

    const result = await searchHotelRates({
      cityName: cityName as string,
      countryCode: (countryCode as string) || "US",
      checkin: checkin as string,
      checkout: checkout as string,
      adults: adultsNum,
      children: Array.isArray(children) ? children : [],
      rooms: roomsNum,
      currency: (currency as string) || "USD",
      guestNationality: (guestNationality as string) || "US",
      limit: limitNum,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/hotels/search]", err);
    return NextResponse.json(
      { error: "Unable to search hotels" },
      { status: 500 }
    );
  }
}
