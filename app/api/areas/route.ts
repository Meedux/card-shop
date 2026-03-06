import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/areas
 *
 * Returns a distinct, sorted list of area values from the stores table.
 * Called once on page load to populate the area filter dropdown.
 */
export async function GET() {
  try {
    const rows = await prisma.$queryRaw<{ area: string }[]>`
      SELECT DISTINCT area
      FROM stores
      WHERE area IS NOT NULL AND area <> ''
      ORDER BY area ASC
    `;

    const areas = rows.map((r: { area: string }) => r.area);

    return NextResponse.json(areas);
  } catch (error) {
    console.error("[GET /api/areas]", error);
    return NextResponse.json(
      { error: "Failed to fetch areas" },
      { status: 500 }
    );
  }
}
