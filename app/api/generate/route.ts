import { NextRequest, NextResponse } from "next/server";
import { validateTimesheetData } from "@/lib/validation";
import { generateCsv } from "@/lib/generate-csv";
import { generateXlsx } from "@/lib/generate-xlsx";
import { formatDateForFilename, getSundayFromMonday } from "@/lib/date-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = validateTimesheetData(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    const data = result.data!;
    const csv = generateCsv(data);
    const xlsxBuffer = await generateXlsx(data);

    const kebabName = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const sundayStr = getSundayFromMonday(data.dateWeekStarting);
    const dateStr = formatDateForFilename(sundayStr);
    const filenameBase = `timesheet-${kebabName}-${dateStr}`;

    return NextResponse.json({
      csv: {
        data: Buffer.from(csv).toString("base64"),
        filename: `${filenameBase}.csv`,
      },
      xlsx: {
        data: xlsxBuffer.toString("base64"),
        filename: `${filenameBase}.xlsx`,
      },
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { errors: [{ field: "_", message: "Failed to generate timesheet" }] },
      { status: 500 }
    );
  }
}
