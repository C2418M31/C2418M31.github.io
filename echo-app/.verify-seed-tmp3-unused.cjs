const XLSX = require("xlsx");
const wb = XLSX.readFile("/sessions/hopeful-determined-davinci/mnt/outputs/seed-network-data.xlsx");
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
console.log("row count:", rows.length);

let badLat = 0, badLng = 0, badTs = 0, missingReq = 0, dupMobile = 0;
const connTypes = new Set();
const places = new Set();
const mobiles = new Set();
let minSig = Infinity, maxSig = -Infinity;
for (const r of rows) {
  if (r.latitude == null || r.longitude == null || r.signal_strength == null || !r.connection_type) missingReq++;
  if (r.latitude < -90 || r.latitude > 90) badLat++;
  if (r.longitude < -180 || r.longitude > 180) badLng++;
  if (Number.isNaN(Date.parse(r.timestamp))) badTs++;
  if (mobiles.has(r.mobile_number)) dupMobile++;
  mobiles.add(r.mobile_number);
  connTypes.add(r.connection_type);
  places.add(r.location_name);
  minSig = Math.min(minSig, r.signal_strength);
  maxSig = Math.max(maxSig, r.signal_strength);
}
console.log({ badLat, badLng, badTs, missingReq, dupMobile, distinctPlaces: places.size, connTypes: [...connTypes], minSig, maxSig });

let outsidePH = 0;
for (const r of rows) {
  if (r.latitude < 4 || r.latitude > 21.5 || r.longitude < 114 || r.longitude > 127) outsidePH++;
}
console.log("points outside rough PH bbox:", outsidePH);
