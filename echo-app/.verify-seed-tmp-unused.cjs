const XLSX = require("xlsx");

const wb = XLSX.readFile("/sessions/hopeful-determined-davinci/mnt/outputs/seed-network-data.xlsx");
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
console.log("row count:", rows.length);
console.log("sample row:", rows[0]);
console.log("sample row 2:", rows[1]);

// quick sanity on ranges without pulling in the TS compiler
let badLat = 0, badLng = 0, badTs = 0, connTypes = new Set(), minSig = Infinity, maxSig = -Infinity;
for (const r of rows) {
  if (r.latitude < -90 || r.latitude > 90) badLat++;
  if (r.longitude < -180 || r.longitude > 180) badLng++;
  if (Number.isNaN(Date.parse(r.timestamp))) badTs++;
  connTypes.add(r.connection_type);
  minSig = Math.min(minSig, r.signal_strength);
  maxSig = Math.max(maxSig, r.signal_strength);
}
console.log({ badLat, badLng, badTs, connTypes: [...connTypes], minSig, maxSig });

const dates = rows.map(r => new Date(r.timestamp).getTime());
console.log("oldest:", new Date(Math.min(...dates)).toISOString());
console.log("newest:", new Date(Math.max(...dates)).toISOString());
