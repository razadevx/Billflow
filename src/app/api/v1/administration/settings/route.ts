import { NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { AdministrationService } from "@/domain/administration/services/AdministrationService";

export async function GET(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const service = new AdministrationService(ctx);
    const result = await service.getCompanySettings();

    if (result.isSuccess()) {
      return NextResponse.json(result.value);
    }
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const service = new AdministrationService(ctx);
    
    const body = await request.json();
    const { key, value } = body;
    
    if (!key || typeof value !== 'string') {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await service.updateSetting(key, value);

    if (result.isSuccess()) {
      return NextResponse.json(result.value);
    }
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
