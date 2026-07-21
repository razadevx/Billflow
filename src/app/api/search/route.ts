import { NextRequest, NextResponse } from "next/server";
import { GlobalSearchService } from "@/server/search/GlobalSearchService";
import { RequestContext } from "@/server/core/RequestContext";
import { getRequestContext } from "@/server/core/context";
import { errorResponse } from "@/server/api/response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ data: [] });
  }

  const context = await getRequestContext();
  if (!context) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const searchService = new GlobalSearchService(context);
  const result = await searchService.search(query);

  if (result.isSuccess()) {
    return NextResponse.json({ data: result.value });
  } else {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
}
