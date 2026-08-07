import { readFile } from "node:fs/promises";
import { parseWorkbookBuffer, ingestNetworkReadings } from "./lib/data/excel-import";

async function main() {
  const path = process.argv[2];
  const buf = await readFile(path);
  const raw = parseWorkbookBuffer(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  console.log("raw rows parsed from sheet:", raw.length);

  const { collection, errors } = ingestNetworkReadings(raw);
  console.log("valid features:", collection.features.length);
  console.log("errors:", errors.length);
  console.log("first 10 errors:", errors.slice(0, 10));

  // Rough size check on what would get written to .data/network-data.json
  const json = JSON.stringify(collection);
  console.log("serialized size (bytes):", json.length, `(~${(json.length / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
