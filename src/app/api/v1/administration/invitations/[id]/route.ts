import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { AdministrationService } from "@/domain/administration/services/AdministrationService";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const service = new AdministrationService(ctx);
    
    const result = await service.revokeInvitation(id);

    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
