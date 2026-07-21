import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { AttachmentService } from "@/domain/workorder/attachment.service";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    
    // In a real app we'd parse FormData here.
    // For this prototype, we'll accept JSON with the fake file details.
    const body = await request.json();
    const { fileName, fileUrl, fileSize, mimeType } = body;
    
    if (!fileName || !fileUrl) {
      return NextResponse.json({ error: "fileName and fileUrl are required" }, { status: 400 });
    }

    const attachment = await AttachmentService.createAttachmentRecord(
      ctx,
      id,
      fileName,
      fileUrl,
      fileSize || 0,
      mimeType || 'application/octet-stream'
    );
    
    return NextResponse.json(attachment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
