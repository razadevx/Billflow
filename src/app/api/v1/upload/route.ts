import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a safe, unique filename
    const ext = path.extname(file.name) || ".png";
    const filename = `${ctx.companyId}-${Date.now()}${ext}`;
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const filepath = path.join(uploadsDir, filename);
    try {
      await writeFile(filepath, buffer);
      const fileUrl = `/uploads/${filename}`;
      return NextResponse.json({ url: fileUrl }, { status: 200 });
    } catch (fsError) {
      console.warn("Filesystem upload failed, falling back to base64 Data URI:", fsError);
      const mimeType = file.type || "image/png";
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ url: dataUrl }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
