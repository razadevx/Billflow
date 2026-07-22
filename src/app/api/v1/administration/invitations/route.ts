import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { AdministrationService } from "@/domain/administration/services/AdministrationService";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = new AdministrationService(ctx);
    const result = await service.listInvitations();

    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const service = new AdministrationService(ctx);
    
    if (!body.email || !body.role) {
      return NextResponse.json({ error: "email and role are required" }, { status: 400 });
    }

    const result = await service.createInvitation(body.email, body.role);

    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
