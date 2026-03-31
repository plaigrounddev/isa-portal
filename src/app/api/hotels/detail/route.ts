import { NextRequest, NextResponse } from "next/server";
import { getHotelDetail } from "@/lib/liteapi/hotels";

export async function GET(req: NextRequest) {
  try {
    const hotelId = req.nextUrl.searchParams.get("hotelId");
    if (!hotelId) {
      return NextResponse.json({ error: "hotelId is required" }, { status: 400 });
    }

    const result = await getHotelDetail(hotelId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/hotels/detail]", err);
    return NextResponse.json({ error: "Unable to fetch hotel details" }, { status: 500 });
  }
}
