type Tone = "success" | "warning" | "danger" | "neutral" | "brand";

interface Props {
  tone?: Tone;
  mono?: boolean;
  children: React.ReactNode;
}

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success-bg text-success border-success/25",
  warning: "bg-warning-bg text-warning border-warning/25",
  danger:  "bg-emergency-bg text-emergency border-emergency/25",
  neutral: "bg-surface-2 text-text-3 border-border",
  brand:   "bg-brand-50 text-brand-600 border-brand-200",
};

export function Pill({ tone = "neutral", mono, children }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap
        ${TONE_CLASSES[tone]} ${mono ? "font-mono" : ""}`}
    >
      {children}
    </span>
  );
}
