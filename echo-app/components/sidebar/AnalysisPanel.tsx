import Spinner from "@/components/ui/Spinner";
import QualityBadge from "@/components/ui/QualityBadge";
import type { Selection } from "@/lib/geo/types";
import type { AnalyzeResult } from "@/lib/ai/types";

interface AnalysisPanelProps {
  selection: Selection | null;
  loading: boolean;
  result: AnalyzeResult | null;
  error: string | null;
}

export default function AnalysisPanel({
  selection,
  loading,
  result,
  error,
}: AnalysisPanelProps) {
  return (
    <div className="mb-6 rounded-lg bg-gray-700 p-4 transition-all duration-300">
      <h2 className="mb-3 border-b border-gray-600 pb-2 text-lg font-semibold">
        Network Analysis
      </h2>

      {!selection && !loading && (
        <div className="py-8 text-center text-gray-400">
          <p>Click a user dot or an area on the map to begin AI analysis.</p>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-gray-400">
          <Spinner />
          <p className="mt-4">Analyzing with AI...</p>
        </div>
      )}

      {error && !loading && <p className="text-sm text-red-400">{error}</p>}

      {selection && result && !loading && (
        <div className="space-y-4">
          <Field
            label="Location"
            value={selection.kind === "user" ? selection.properties.location_name : selection.locationName}
          />
          <Field
            label="Coordinates"
            value={`${selection.coordinates[1].toFixed(5)}, ${selection.coordinates[0].toFixed(5)}`}
          />

          {selection.kind === "user" ? (
            <div className="space-y-4">
              <Field label="User ID" value={selection.properties.mobile_number ?? "Unknown"} />
              <Field label="Connection Type" value={selection.properties.connection_type} />
              <Field label="Signal Strength" value={`${selection.properties.signal_strength} dBm`} />
              <div>
                <h3 className="font-semibold text-gray-200">Predicted Network Quality:</h3>
                <QualityBadge quality={result.quality} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Users in 10km Radius" value={String(selection.userCount)} />
              <div>
                <h3 className="font-semibold text-gray-200">Average Network Quality:</h3>
                <QualityBadge quality={result.quality} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-200">Connection Mix:</h3>
                <ul className="mt-1 list-inside list-disc space-y-1 text-gray-300">
                  {Object.entries(selection.connectionMix).map(([type, count]) => (
                    <li key={type}>
                      {count} on {type}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-200">AI Summary:</h3>
            <p className="mt-1 rounded-md bg-gray-800 p-3 text-gray-300">{result.summary}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-200">Recommended Action:</h3>
            <p className="mt-1 rounded-md bg-gray-800 p-3 text-gray-300">{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <h3 className="font-semibold text-gray-200">
      {label}: <span className="font-normal text-blue-300">{value}</span>
    </h3>
  );
}
