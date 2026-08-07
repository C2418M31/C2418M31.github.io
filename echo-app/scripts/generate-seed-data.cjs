/**
 * Generates a synthetic crowdsource dataset for local demo/testing of
 * time-based features (freshness badges, time decay, trend/anomaly
 * detection) and admin-boundary coverage (province/city/barangay
 * choropleth), which both need realistic volume and spread that the
 * bundled seed sample doesn't have.
 *
 * Output is a real .xlsx matching the existing upload schema exactly
 * (canonical column names, no aliasing needed) so it goes through the
 * same validated ingestion path as any other upload — nothing here
 * bypasses lib/data/schema.ts or lib/data/excel-import.ts.
 *
 * Places are split into LUZON_PLACES and OTHER_PLACES (Visayas + Mindanao)
 * so Luzon's density can be weighted independently — see main() below.
 * Coordinates are approximate town-center locations from general
 * knowledge, not surveyed points; quality tags are illustrative groupings
 * (island/remote/mountainous areas skew "problem", larger urban centers
 * skew "good"), not a real assessment of any actual carrier's coverage.
 *
 * Run: node scripts/generate-seed-data.cjs [outputPath]
 */

const XLSX = require("xlsx");
const path = require("path");

const LUZON_PLACES = [
  // NCR (all 17 LGUs)
  ["Manila City", 14.5995, 120.9842, "good"],
  ["Quezon City", 14.676, 121.0437, "good"],
  ["Makati City", 14.5547, 121.0244, "good"],
  ["Pasig City", 14.5764, 121.0851, "good"],
  ["Taguig City", 14.5176, 121.0509, "good"],
  ["Caloocan City", 14.6507, 120.9829, "medium"],
  ["Mandaluyong City", 14.5794, 121.0359, "good"],
  ["Marikina City", 14.6507, 121.1029, "good"],
  ["Pasay City", 14.5378, 121.0014, "good"],
  ["Paranaque City", 14.4793, 121.0198, "good"],
  ["Las Pinas City", 14.4499, 120.9829, "medium"],
  ["Muntinlupa City", 14.4081, 121.0415, "good"],
  ["Malabon City", 14.6681, 120.9569, "medium"],
  ["Navotas City", 14.6667, 120.9422, "medium"],
  ["Valenzuela City", 14.7, 120.983, "medium"],
  ["San Juan City", 14.6019, 121.0355, "good"],
  ["Pateros", 14.5445, 121.0687, "medium"],

  // CAR
  ["Baguio City", 16.4023, 120.596, "medium"],
  ["La Trinidad", 16.4552, 120.5885, "medium"],
  ["Lagawe", 16.7998, 121.1214, "problem"],
  ["Tabuk City", 17.4189, 121.4443, "medium"],
  ["Kabugao", 18.0167, 121.1833, "problem"],
  ["Bontoc", 17.0907, 120.9762, "problem"],
  ["Banaue", 16.9167, 121.0583, "problem"],

  // Region I - Ilocos
  ["Dagupan City", 16.0433, 120.3333, "medium"],
  ["Laoag City", 18.1978, 120.5936, "medium"],
  ["Vigan City", 17.5747, 120.3869, "medium"],
  ["San Fernando City (La Union)", 16.6159, 120.3209, "medium"],
  ["Lingayen", 16.0206, 120.2323, "medium"],
  ["Batac City", 18.0575, 120.5661, "medium"],
  ["Candon City", 17.1953, 120.4514, "medium"],
  ["Alaminos City (Pangasinan)", 16.155, 119.9784, "medium"],
  ["San Carlos City (Pangasinan)", 15.9286, 120.2828, "medium"],
  ["Urdaneta City", 15.9761, 120.5703, "good"],

  // Region II - Cagayan Valley
  ["Tuguegarao City", 17.6132, 121.7269, "problem"],
  ["Ilagan City", 17.1489, 121.8894, "medium"],
  ["Bayombong", 16.4833, 121.15, "medium"],
  ["Cabarroguis", 16.5, 121.55, "problem"],
  ["Basco", 20.4487, 121.9702, "problem"],
  ["Cauayan City", 16.935, 121.7719, "medium"],
  ["Santiago City", 16.6983, 121.5486, "good"],

  // Region III - Central Luzon
  ["Angeles City", 15.145, 120.593, "medium"],
  ["San Fernando City (Pampanga)", 15.029, 120.6897, "good"],
  ["Olongapo City", 14.8294, 120.2828, "medium"],
  ["Iba", 15.3299, 119.9784, "medium"],
  ["Tarlac City", 15.4802, 120.5979, "good"],
  ["Malolos City", 14.8433, 120.8114, "good"],
  ["Palayan City", 15.5407, 121.0794, "medium"],
  ["Cabanatuan City", 15.4869, 120.9675, "good"],
  ["Balanga City", 14.6761, 120.5361, "medium"],
  ["Baler", 15.7592, 121.5629, "problem"],
  ["Mabalacat City", 15.2222, 120.5736, "good"],
  ["San Jose del Monte City", 14.8139, 121.0453, "good"],
  ["Meycauayan City", 14.7365, 120.9589, "medium"],
  ["Baliuag", 14.9569, 120.8994, "medium"],
  ["Gapan City", 15.3053, 120.9472, "medium"],
  ["San Jose City (Nueva Ecija)", 15.7864, 120.9864, "medium"],
  ["Munoz Science City", 15.7167, 120.9167, "medium"],
  ["Concepcion (Tarlac)", 15.3167, 120.6417, "medium"],
  ["Subic", 14.8783, 120.2333, "medium"],

  // Region IV-A - CALABARZON
  ["Batangas City", 13.7565, 121.0583, "medium"],
  ["Antipolo City", 14.5878, 121.176, "medium"],
  ["Lucena City", 13.9373, 121.6173, "medium"],
  ["Santa Cruz (Laguna)", 14.2833, 121.4167, "medium"],
  ["Calamba City", 14.2117, 121.1653, "good"],
  ["Trece Martires City", 14.2823, 120.8674, "good"],
  ["Imus City", 14.4297, 120.9367, "good"],
  ["Bacoor City", 14.4597, 120.8969, "good"],
  ["Dasmarinas City", 14.3294, 120.9367, "good"],
  ["General Trias City", 14.3864, 120.8811, "good"],
  ["Tagaytay City", 14.1153, 120.9622, "good"],
  ["Cavite City", 14.4833, 120.9, "medium"],
  ["San Pablo City", 14.0683, 121.3256, "medium"],
  ["Binan City", 14.3422, 121.085, "good"],
  ["Santa Rosa City", 14.3122, 121.1114, "good"],
  ["Los Banos", 14.1693, 121.2417, "medium"],
  ["Cabuyao City", 14.2726, 121.1247, "good"],
  ["Lipa City", 13.9411, 121.1622, "good"],
  ["Tanauan City (Batangas)", 14.0864, 121.1497, "good"],
  ["Santo Tomas (Batangas)", 14.1078, 121.1408, "medium"],
  ["Cainta", 14.5786, 121.1222, "good"],
  ["Taytay (Rizal)", 14.5572, 121.1322, "good"],
  ["Binangonan", 14.4667, 121.1936, "medium"],
  ["Angono", 14.5261, 121.1531, "medium"],
  ["Tayabas City", 14.0281, 121.5928, "medium"],
  ["Candelaria (Quezon)", 13.9333, 121.4231, "medium"],

  // Region IV-B - MIMAROPA
  ["Puerto Princesa City", 9.7392, 118.7353, "problem"],
  ["Boac", 13.4457, 121.8412, "problem"],
  ["Mamburao", 13.2247, 120.5967, "problem"],
  ["Calapan City", 13.4115, 121.1803, "medium"],
  ["Romblon", 12.5778, 122.2695, "problem"],
  ["Sablayan", 12.8367, 120.7667, "problem"],
  ["Gasan", 13.3283, 121.8628, "problem"],
  ["Odiongan", 12.4033, 122.0011, "problem"],
  ["Coron", 11.9951, 120.2019, "problem"],
  ["El Nido", 11.1949, 119.4079, "problem"],

  // Region V - Bicol
  ["Naga City", 13.6218, 123.1948, "medium"],
  ["Legazpi City", 13.1391, 123.7438, "medium"],
  ["Sorsogon City", 12.9739, 124.0067, "medium"],
  ["Daet", 14.1122, 122.9557, "medium"],
  ["Pili", 13.5725, 123.2833, "medium"],
  ["Virac", 13.5833, 124.2333, "problem"],
  ["Masbate City", 12.3711, 123.6175, "problem"],
  ["Labo", 14.1442, 122.8306, "medium"],
  ["Iriga City", 13.4197, 123.4136, "medium"],
  ["Tabaco City", 13.3572, 123.7328, "medium"],
  ["Ligao City", 13.2333, 123.5333, "medium"],
  ["Bulan", 12.67, 123.8756, "medium"],
  ["Milagros", 12.3919, 123.4886, "problem"],
  ["Bato (Camarines Sur)", 13.3583, 123.3717, "medium"],
];

const OTHER_PLACES = [
  // Visayas
  ["Cebu City", 10.3157, 123.8854, "good"],
  ["Mandaue City", 10.3237, 123.9227, "medium"],
  ["Lapu-Lapu City", 10.3103, 123.9494, "medium"],
  ["Iloilo City", 10.7202, 122.5621, "medium"],
  ["Bacolod City", 10.6765, 122.9509, "medium"],
  ["Tacloban City", 11.2543, 125.0, "problem"],
  ["Tagbilaran City", 9.6474, 123.8536, "medium"],
  ["Dumaguete City", 9.3103, 123.3082, "medium"],
  ["Ormoc City", 11.0064, 124.6075, "problem"],
  ["Kalibo", 11.7, 122.3667, "medium"],
  ["San Jose de Buenavista", 10.7472, 121.9333, "medium"],
  ["Roxas City", 11.585, 122.7511, "medium"],
  ["Jordan (Guimaras)", 10.5453, 122.5822, "medium"],
  ["Siquijor", 9.2, 123.5167, "problem"],
  ["Maasin City", 10.1319, 124.845, "medium"],
  ["Naval (Biliran)", 11.5667, 124.4, "problem"],
  ["Catbalogan City", 11.775, 124.8858, "medium"],
  ["Borongan City", 11.6083, 125.4319, "problem"],
  ["Catarman", 12.4931, 124.6353, "problem"],

  // Mindanao
  ["Davao City", 7.1907, 125.4553, "good"],
  ["Zamboanga City", 6.9214, 122.079, "problem"],
  ["Cagayan de Oro City", 8.4542, 124.6319, "medium"],
  ["General Santos City", 6.1164, 125.1716, "medium"],
  ["Cotabato City", 7.2231, 124.2452, "problem"],
  ["Butuan City", 8.9475, 125.5406, "medium"],
  ["Surigao City", 9.7906, 125.4917, "problem"],
  ["Dipolog City", 8.5883, 123.3416, "problem"],
  ["Marawi City", 8.0, 124.2894, "problem"],
  ["Koronadal City", 6.5, 124.8467, "medium"],
  ["Tandag City", 9.0785, 126.1986, "problem"],
  ["Pagadian City", 7.8257, 123.4372, "medium"],
  ["Ipil", 7.7833, 122.5833, "medium"],
  ["Oroquieta City", 8.4856, 123.8058, "medium"],
  ["Tubod (Lanao del Norte)", 8.0667, 123.8, "medium"],
  ["Malaybalay City", 8.15, 125.1278, "medium"],
  ["Mambajao (Camiguin)", 9.25, 124.7167, "problem"],
  ["Tagum City", 7.4478, 125.8078, "good"],
  ["Digos City", 6.75, 125.3564, "medium"],
  ["Malita", 6.4167, 125.6, "problem"],
  ["Mati City", 6.9556, 126.2183, "medium"],
  ["Nabunturan", 7.6167, 125.9667, "medium"],
  ["Kidapawan City", 7.0086, 125.0894, "medium"],
  ["Isulan", 6.6333, 124.6, "medium"],
  ["Alabel", 6.1039, 125.2853, "medium"],
  ["Isabela City (Basilan)", 6.7083, 121.9711, "problem"],
  ["Jolo", 6.05, 121.0, "problem"],
  ["Bongao", 5.0333, 119.7667, "problem"],
  ["Bayugan City", 8.7167, 125.75, "medium"],
  ["San Jose (Dinagat Islands)", 10.1281, 125.5794, "problem"],
];

const CONNECTION_WEIGHTS = [
  ["5G", 0.15],
  ["4G", 0.5],
  ["3G", 0.25],
  ["None", 0.1],
];

// dBm ranges roughly matching lib/geo/scoring.ts buckets
// (MIN_DBM -110, MAX_DBM -70, NO_CONNECTION_THRESHOLD_DBM -106):
//   >= -86  -> Good, -98..-86 -> Slow, -106..-98 -> No Connection (weak),
//   <= -106 or type "None" -> No Connection (forced).
const QUALITY_RANGES = {
  good: [-90, -68],
  medium: [-102, -80],
  problem: [-112, -92],
};

const DAYS_BACK = 90;
const RECENT_WINDOW_DAYS = 7;

function pick(weighted) {
  const r = Math.random();
  let acc = 0;
  for (const [value, weight] of weighted) {
    acc += weight;
    if (r <= acc) return value;
  }
  return weighted[weighted.length - 1][0];
}

function randInRange([min, max]) {
  return Math.round(min + Math.random() * (max - min));
}

function jitter(deg) {
  return (Math.random() - 0.5) * 2 * deg;
}

/**
 * Timestamps skew across the last 90 days. "problem" places additionally
 * get roughly a third of their points concentrated in the last 7 days
 * with a worse signal than their older history (buildSignal below), so
 * a week-over-week trend/anomaly check has a real, visible drop to catch
 * instead of flat noise.
 */
function buildTimestamp(quality) {
  const isRecentDegradation = quality === "problem" && Math.random() < 0.35;
  const daysAgo = isRecentDegradation
    ? Math.random() * RECENT_WINDOW_DAYS
    : RECENT_WINDOW_DAYS + Math.random() * (DAYS_BACK - RECENT_WINDOW_DAYS);
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return { iso: ts.toISOString(), isRecentDegradation };
}

function buildSignal(quality, isRecentDegradation) {
  const [min, max] = QUALITY_RANGES[quality];
  if (isRecentDegradation) {
    // Push toward the bottom of an already-bad range for the "recent
    // degradation" slice, so it reads as a real drop, not just noise.
    return randInRange([min, Math.round(min + (max - min) * 0.3)]);
  }
  return randInRange([min, max]);
}

/**
 * @param {Array} places one of LUZON_PLACES / OTHER_PLACES
 * @param {number} pointsPerPlace
 * @param {number} mobileSeqStart lets successive calls continue the
 *   sequence instead of restarting at the same numbers (two calls at the
 *   same starting value would produce duplicate mobile_number values).
 */
function generateRows(places, pointsPerPlace, mobileSeqStart) {
  const rows = [];
  let mobileSeq = mobileSeqStart;

  places.forEach(([name, lat, lng, quality]) => {
    for (let i = 0; i < pointsPerPlace; i++) {
      const connectionType = pick(CONNECTION_WEIGHTS);
      const { iso, isRecentDegradation } = buildTimestamp(quality);
      const signal =
        connectionType === "None" ? randInRange([-115, -106]) : buildSignal(quality, isRecentDegradation);

      rows.push({
        // Tighter than a naive city-wide spread since the place list
        // includes several small-island towns (Batanes, Camiguin,
        // Siquijor, Guimaras, Dinagat, Coron, El Nido) where a wider
        // jitter risked landing points offshore.
        latitude: Number((lat + jitter(0.045)).toFixed(6)),
        longitude: Number((lng + jitter(0.045)).toFixed(6)),
        signal_strength: signal,
        connection_type: connectionType,
        timestamp: iso,
        location_name: name,
        mobile_number: `09${String(mobileSeq++).slice(-9)}`,
        sim_slot: Math.random() < 0.5 ? 1 : 2,
      });
    }
  });

  return rows;
}

function main() {
  const outputPath = process.argv[2] || path.join(process.cwd(), "seed-network-data.xlsx");

  // Luzon gets more places (110 vs. the original 51) AND more points per
  // place (137 vs. 100) so it's weighted well above Visayas/Mindanao,
  // which are left at their original density. 110*137 + 49*100 = 19,970 —
  // deliberately not forced to exactly 20,000: hitting that number exactly
  // would have meant either padding with another ~30 much less-certain
  // small-town coordinates, or arbitrarily trimming legitimate NCR/
  // CALABARZON coverage to make the math divide evenly. Neither seemed
  // worth trading for a round number.
  const luzonRows = generateRows(LUZON_PLACES, 137, 9170000000);
  const otherRows = generateRows(OTHER_PLACES, 100, 9170000000 + luzonRows.length);
  const rows = [...luzonRows, ...otherRows];

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "latitude",
      "longitude",
      "signal_strength",
      "connection_type",
      "timestamp",
      "location_name",
      "mobile_number",
      "sim_slot",
    ],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "readings");
  XLSX.writeFile(workbook, outputPath);

  console.log(
    `Wrote ${rows.length} rows to ${outputPath} (${luzonRows.length} Luzon, ${otherRows.length} Visayas/Mindanao)`,
  );
}

main();
