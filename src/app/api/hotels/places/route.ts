import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/liteapi/hotels";

export async function GET(req: NextRequest) {
  try {
    const textQuery = req.nextUrl.searchParams.get("q");
    if (!textQuery || textQuery.length < 2) {
      return NextResponse.json({ error: "q (query) is required and must be at least 2 characters" }, { status: 400 });
    }

    const type = req.nextUrl.searchParams.get("type") || undefined;
    const result = await searchPlaces(textQuery, type);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/hotels/places]", err);
    return NextResponse.json({ error: "Unable to search places" }, { status: 500 });
  }
}
