import { NextRequest, NextResponse } from "next/server";
import { ingestNetworkReadings, parseWorkbookBuffer } from "@/lib/data/excel-import";
import { setCurrentNetworkData } from "@/lib/data/store";

// Uses node:fs (via lib/data/store) so this can't run on the edge runtime.
export const runtime = "nodejs";

/**
 * Accepts a multipart/form-data upload with a "file" field (.xlsx/.xls).
 * Always parses and validates; only persists the result when called with
 * ?commit=true, so the admin upload page can show a preview (valid rows
 * vs. row-level errors) before the operator commits the dataset.
 */
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded. Expected a 'file' field." },
      { status: 400 },
    );
  }

  let rawRows: Record<string, unknown>[];
  try {
    const buffer = await file.arrayBuffer();
    rawRows = parseWorkbookBuffer(buffer);
  } catch (err) {
    console.error("[/api/data/upload] parse error", err);
    return NextResponse.json(
      { error: "Could not read this file as a spreadsheet." },
      { status: 400 },
    );
  }

  if (rawRows.length === 0) {
    return NextResponse.json({ error: "The spreadsheet has no data rows." }, { status: 400 });
  }

  const { collection, errors } = ingestNetworkReadings(rawRows);
  const commit = req.nextUrl.searchParams.get("commit") === "true";

  if (commit) {
    if (collection.features.length === 0) {
      return NextResponse.json(
        { error: "No valid rows to commit.", validCount: 0, totalRows: rawRows.length, errors },
        { status: 400 },
      );
    }
    await setCurrentNetworkData(collection);
  }

  return NextResponse.json({
    committed: commit,
    validCount: collection.features.length,
    totalRows: rawRows.length,
    // Cap the error list in the response so a very messy file doesn't
    // blow up the payload; the admin page shows this as a preview, not
    // an exhaustive audit.
    errors: errors.slice(0, 50),
  });
}
