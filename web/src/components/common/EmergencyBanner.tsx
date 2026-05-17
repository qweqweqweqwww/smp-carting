interface Props {
  message: string;
  onDismiss: () => void;
}

export function EmergencyBanner({ message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between bg-emergency px-7 py-2.5 text-white"
    >
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-white smp-pulse" />
        <span className="text-[13px] font-bold tracking-wide uppercase">
          Авария · {message}
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="rounded-sm bg-white/20 px-3 py-1 text-[11px] font-bold hover:bg-white/30 transition-colors"
      >
        Закрыть
      </button>
    </div>
  );
}
