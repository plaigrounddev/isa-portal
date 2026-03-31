import { NextRequest, NextResponse } from "next/server";
import { getHotelReviews } from "@/lib/liteapi/hotels";

export async function GET(req: NextRequest) {
  try {
    const hotelId = req.nextUrl.searchParams.get("hotelId");
    if (!hotelId) {
      return NextResponse.json({ error: "hotelId is required" }, { status: 400 });
    }

    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 10));
    const result = await getHotelReviews(hotelId, limit);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/hotels/reviews]", err);
    return NextResponse.json({ error: "Unable to fetch hotel reviews" }, { status: 500 });
  }
}
