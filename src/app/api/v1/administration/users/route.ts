import { NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { AdministrationService } from "@/domain/administration/services/AdministrationService";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const service = new AdministrationService(ctx);
    const result = await service.listUsers();

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
    const { userId, role, name, email } = body;
    
    if (!userId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let result;
    if (role && Object.values(Role).includes(role)) {
      result = await service.updateUserRole(userId, role);
    } else {
      result = await service.updateUserDetails(userId, { name, email });
    }

    if (result.isSuccess()) {
      return NextResponse.json(result.value);
    }
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
