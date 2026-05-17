import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Pill } from "./Pill";
import type { RaceStatus } from "../../types";

const ROLE_META: Record<string, { label: string; tone: "warning" | "success" | "brand" | "neutral" }> = {
  admin:     { label: "Организатор", tone: "brand"    },
  judge:     { label: "Судья",       tone: "warning"  },
  secretary: { label: "Секретарь",   tone: "success"  },
  marshal:   { label: "Маршал",      tone: "neutral"  },
};

const RACE_STATUS_META: Record<RaceStatus, { label: string; live: boolean }> = {
  draft:    { label: "Не начата",  live: false },
  active:   { label: "В эфире",   live: true  },
  finished: { label: "Завершена", live: false },
  archived: { label: "Архив",     live: false },
};

interface Props {
  children: React.ReactNode;
  raceInfo?: { name: string; status: RaceStatus };
}

export function AppShell({ children, raceInfo }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleMeta = user ? (ROLE_META[user.role] ?? { label: user.role, tone: "neutral" as const }) : null;
  const statusMeta = raceInfo ? (RACE_STATUS_META[raceInfo.status] ?? { label: raceInfo.status, live: false }) : null;

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-surface px-7">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-sm bg-brand-500 font-mono text-[13px] font-black text-white tracking-tight">
              SMP
            </span>
            <div>
              <div className="text-[13px] font-bold leading-tight text-text tracking-tight">
                {raceInfo ? raceInfo.name : "Race Control"}
              </div>
              <div className="text-[10.5px] text-text-3 leading-none mt-0.5">
                SMP Carting
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {statusMeta ? (
            <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold
              ${statusMeta.live
                ? "bg-success-bg text-success border-success/25"
                : "bg-surface-2 text-text-2 border-border"
              }`}
            >
              {statusMeta.live && <span className="h-1.5 w-1.5 rounded-full bg-success smp-pulse" />}
              <span className="font-mono tnum">{statusMeta.label}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold
                            bg-surface-2 text-text-mute border-border">
              <span className="font-mono tnum">—</span>
            </div>
          )}
          <span className="h-5 w-px bg-border" />
          {roleMeta && <Pill tone={roleMeta.tone}>{roleMeta.label}</Pill>}
          {user && <span className="text-[12.5px] font-medium text-text-2">{user.name}</span>}
          <ThemeToggle />
          {user && (
            <button
              onClick={() => { logout(); navigate("/login", { replace: true }); }}
              className="text-[11.5px] font-medium text-text-3 hover:text-text transition-colors"
            >
              Выйти
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
