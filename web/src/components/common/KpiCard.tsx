type Tone = "neutral" | "warning" | "danger" | "success";

interface Props {
  label: string;
  value: string | number;
  tone?: Tone;
  sub?: string;
}

const VALUE_COLOR: Record<Tone, string> = {
  neutral: "text-text",
  warning: "text-warning",
  danger:  "text-emergency",
  success: "text-success",
};

export function KpiCard({ label, value, tone = "neutral", sub }: Props) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3.5">
      <div>
        <div className="label-caps">{label}</div>
        {sub && <div className="mt-1 text-[11px] text-text-3">{sub}</div>}
      </div>
      <div className={`font-mono tnum text-[28px] font-bold leading-none tracking-tight ${VALUE_COLOR[tone]}`}>
        {value}
      </div>
    </div>
  );
}
