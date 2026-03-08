import { NextRequest, NextResponse } from "next/server";
import { sendTimesheetEmail } from "@/lib/send-email";

export async function POST(request: NextRequest) {
  try {
    const { email, name, weekEnding, csvBase64, xlsxBase64 } =
      await request.json();

    if (!email || !name || !weekEnding || !csvBase64 || !xlsxBase64) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const csvBuffer = Buffer.from(csvBase64, "base64");
    const xlsxBuffer = Buffer.from(xlsxBase64, "base64");

    await sendTimesheetEmail({
      to: email,
      name,
      weekEnding,
      csvBuffer,
      xlsxBuffer,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
