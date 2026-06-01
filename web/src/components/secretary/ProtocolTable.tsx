import { Pill } from "../common/Pill";
import { VIOLATION_RU, DECISION_RU } from "../../utils/labels";
import type { ProtocolEntry } from "../../types";

interface Props {
  entries: ProtocolEntry[];
}

function DecisionPill({ type }: { type: string }) {
  const m = DECISION_RU[type] ?? { tone: "neutral" as const, label: type };
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

export function ProtocolTable({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface py-16 text-center text-[13px] text-text-3">
        Решений пока нет. Ожидание инцидентов…
      </div>
    );
  }

  const cols = ["#", "Время", "Пилоты", "Нарушение", "Решение", "Штраф", "Пост", "Маршал", "Судья"];

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="min-w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {cols.map((h) => (
              <th
                key={h}
                className="px-3.5 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-text-3 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...entries].reverse().map((entry, idx) => (
            <tr
              key={entry.id}
              className={`border-b border-divider last:border-0 ${idx === 0 ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}
            >
              <td className="px-3.5 py-2.5 font-mono tnum font-semibold text-text-3">
                {String(entry.sequence_number).padStart(3, "0")}
              </td>
              <td className="px-3.5 py-2.5 font-mono tnum text-text-2 whitespace-nowrap">
                {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </td>
              <td className="px-3.5 py-2.5 font-mono text-[14px] font-bold text-text">
                {entry.pilot_numbers}
              </td>
              <td className="px-3.5 py-2.5 max-w-[260px]">
                {entry.transcript_raw ? (
                  <div>
                    <div className="text-[12.5px] font-medium text-text leading-snug">{entry.transcript_raw}</div>
                    {entry.violation_type && (
                      <div className="mt-0.5 text-[10.5px] text-text-3">
                        {VIOLATION_RU[entry.violation_type] ?? entry.violation_type}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[12.5px] font-medium text-text">
                    {VIOLATION_RU[entry.violation_type] ?? entry.violation_type}
                  </span>
                )}
              </td>
              <td className="px-3.5 py-2.5">
                <DecisionPill type={entry.decision_type} />
              </td>
              <td className="px-3.5 py-2.5 font-mono text-[12px] font-semibold text-text-2 max-w-[160px]">
                {entry.penalty_detail || <span className="text-text-mute">—</span>}
              </td>
              <td className="px-3.5 py-2.5 font-mono font-semibold text-text-2">{entry.post_label}</td>
              <td className="px-3.5 py-2.5 text-text-2">{entry.marshal_name}</td>
              <td className="px-3.5 py-2.5 text-text-2">{entry.judge_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
