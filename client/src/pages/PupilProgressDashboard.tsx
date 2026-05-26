/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * PupilProgressDashboard.tsx — FEAT-H1.
 *
 * Heatmap + roll-up over the pupilProgressAggregator. Reads
 * pupil_attempt rows from the supplied prop (or fetches them via
 * /api/pupil-attempts/dashboard in production).
 */

import React, { useEffect, useState } from "react";
import {
  aggregatePupilProgress,
  type ProgressAggregate,
  type PupilAttemptRow,
} from "@/lib/pupilProgressAggregator";

export interface PupilProgressDashboardProps {
  rows?: PupilAttemptRow[];
  fetcher?: () => Promise<PupilAttemptRow[]>;
}

const BAND_COLOUR: Record<string, string> = {
  green: "bg-green-200",
  amber: "bg-amber-200",
  red: "bg-red-200",
  grey: "bg-gray-200",
};

export function PupilProgressDashboard(props: PupilProgressDashboardProps): React.ReactElement {
  const [agg, setAgg] = useState<ProgressAggregate | null>(props.rows ? aggregatePupilProgress(props.rows) : null);
  const [loading, setLoading] = useState(!props.rows && !!props.fetcher);

  useEffect(() => {
    if (props.rows) {
      setAgg(aggregatePupilProgress(props.rows));
      return;
    }
    if (props.fetcher) {
      setLoading(true);
      props.fetcher().then((rows) => {
        setAgg(aggregatePupilProgress(rows));
        setLoading(false);
      });
    }
  }, [props.rows, props.fetcher]);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!agg) return <p className="text-sm text-gray-500">No data yet.</p>;

  return (
    <div data-testid="pupil-progress-dashboard" className="space-y-4">
      <section>
        <h2 className="text-lg font-bold">Class roll-up</h2>
        <ul className="text-sm space-y-1">
          <li>
            <strong>Pupils:</strong> {agg.perClass.totalPupils} ·{" "}
            <strong>Attempts:</strong> {agg.perClass.totalAttempts} ·{" "}
            <strong>Accuracy:</strong> {agg.perClass.classAccuracyPct}%
          </li>
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-bold mt-2">Top weakest skills</h3>
        <ul className="text-xs">
          {agg.perClass.topWeakestSpecRefs.map((s) => (
            <li key={s.specRef}>
              <span className={`inline-block w-2 h-2 rounded ${BAND_COLOUR[s.band]} mr-1`} />
              {s.specRef} · {s.accuracyPct}% ({s.total} attempts)
            </li>
          ))}
          {agg.perClass.topWeakestSpecRefs.length === 0 && (
            <li className="italic text-gray-500">Not enough data yet.</li>
          )}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-bold mt-2">Per-pupil heatmap</h3>
        <div className="overflow-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left pr-2">Pupil</th>
                {agg.perSpecRef.map((s) => (
                  <th key={s.specRef} className="px-1 text-left">
                    {s.specRef.slice(0, 12)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agg.perPupil.map((p) => (
                <tr key={p.pupilId}>
                  <td className="pr-2">{p.pupilId.slice(0, 8)}</td>
                  {agg.perSpecRef.map((s) => {
                    const cell = p.perSpecRef.find((x) => x.specRef === s.specRef);
                    return (
                      <td key={s.specRef} className={`w-8 h-6 text-center ${cell ? BAND_COLOUR[cell.band] : "bg-gray-50"}`}>
                        {cell?.accuracyPct ?? "–"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default PupilProgressDashboard;
