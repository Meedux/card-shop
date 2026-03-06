import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StoreWithLocation } from "@/lib/types";

/**
 * GET /api/stores
 *
 * Search stores by proximity (lat/lng + radius) or by area name.
 * DB-first: all filtering happens in PostGIS, no external API calls.
 *
 * Query params:
 *   lat    - latitude of search center
 *   lng    - longitude of search center
 *   radius - search radius in meters (default 5000)
 *   area   - filter by area name (used when no lat/lng)
 *   limit  - max results (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
    const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : null;
    const radius = Number(searchParams.get("radius")) || 5000;
    const area = searchParams.get("area");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    let stores: StoreWithLocation[];

    if (lat !== null && lng !== null) {
      // ── Proximity search using PostGIS ST_DWithin ──
      stores = await prisma.$queryRaw<StoreWithLocation[]>`
        SELECT
          s.id,
          s.name,
          s.address,
          s.business_hours,
          s.tags,
          s.languages,
          s.area,
          ST_Y(s.location::geometry)      AS lat,
          ST_X(s.location::geometry)      AS lng,
          ST_Distance(s.location, ST_MakePoint(${lng}, ${lat})::geography) AS distance_m,
          COALESCE(AVG(r.rating), NULL)   AS avg_rating,
          COUNT(r.id)::int                AS review_count
        FROM stores s
        LEFT JOIN reviews r ON r.store_id = s.id
        WHERE s.location IS NOT NULL
          AND ST_DWithin(
            s.location,
            ST_MakePoint(${lng}, ${lat})::geography,
            ${radius}
          )
        GROUP BY s.id
        ORDER BY distance_m ASC
        LIMIT ${limit}
      `;
    } else if (area) {
      // ── Area-based search (no coordinates needed) ──
      stores = await prisma.$queryRaw<StoreWithLocation[]>`
        SELECT
          s.id,
          s.name,
          s.address,
          s.business_hours,
          s.tags,
          s.languages,
          s.area,
          ST_Y(s.location::geometry)      AS lat,
          ST_X(s.location::geometry)      AS lng,
          NULL::float                     AS distance_m,
          COALESCE(AVG(r.rating), NULL)   AS avg_rating,
          COUNT(r.id)::int                AS review_count
        FROM stores s
        LEFT JOIN reviews r ON r.store_id = s.id
        WHERE s.location IS NOT NULL
          AND s.area = ${area}
        GROUP BY s.id
        ORDER BY s.name ASC
        LIMIT ${limit}
      `;
    } else {
      // ── Fallback: return recent stores (initial load) ──
      stores = await prisma.$queryRaw<StoreWithLocation[]>`
        SELECT
          s.id,
          s.name,
          s.address,
          s.business_hours,
          s.tags,
          s.languages,
          s.area,
          ST_Y(s.location::geometry)      AS lat,
          ST_X(s.location::geometry)      AS lng,
          NULL::float                     AS distance_m,
          COALESCE(AVG(r.rating), NULL)   AS avg_rating,
          COUNT(r.id)::int                AS review_count
        FROM stores s
        LEFT JOIN reviews r ON r.store_id = s.id
        WHERE s.location IS NOT NULL
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json(stores);
  } catch (error) {
    console.error("[GET /api/stores]", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}
