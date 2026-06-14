import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRaces, createRace, startRace, finishRace, updateRace, createPost, updatePost, deletePost } from "../../api/races";
import { getUsers, getGlobalUsers, createUser, updateUser, deleteUser, createInvite, assignPost, unassignPost } from "../../api/users";
import { AppShell } from "../../components/common/AppShell";
import { Pill } from "../../components/common/Pill";
import { KpiCard } from "../../components/common/KpiCard";
import { useAuth } from "../../contexts/AuthContext";
import type { InviteRead, UserRole, RaceStatus, Post, User } from "../../types";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_PILL: Record<RaceStatus, { tone: "success" | "neutral" | "brand" | "warning"; label: string }> = {
  draft:    { tone: "brand",    label: "Черновик"  },
  active:   { tone: "success",  label: "● В эфире" },
  finished: { tone: "neutral",  label: "Завершена" },
  archived: { tone: "neutral",  label: "Архив"     },
};

const ROLE_META: Record<string, { color: string; letter: string; label: string }> = {
  marshal:   { color: "text-brand-500 bg-brand-50 dark:bg-brand-900/30",   letter: "М", label: "Маршал"     },
  judge:     { color: "text-warning bg-warning-bg",                        letter: "С", label: "Судья"      },
  secretary: { color: "text-success bg-success-bg",                        letter: "К", label: "Секретарь"  },
  admin:     { color: "text-text-2 bg-surface-2",                          letter: "А", label: "Организатор"},
};

// Fixed SVG positions for up to 8 posts (viewBox 0 0 260 200)
const MAP_POSITIONS: [number, number][] = [
  [30, 100], [80, 38], [145, 30], [215, 48],
  [240, 130], [195, 165], [110, 168], [50, 155],
];

// ─── Small utility components ─────────────────────────────────────────────────

function PlusIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}

// Inline editable text field
function InlineEdit({
  value,
  onSave,
  className = "",
  inputClassName = "",
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className={`rounded border border-brand-400 bg-surface px-1.5 py-0.5 text-text outline-none ring-2 ring-brand-400/30 ${inputClassName}`}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Нажмите для редактирования"
      className={`cursor-text rounded px-0.5 hover:bg-surface-2 transition-colors ${className}`}
    >
      {value}
    </span>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ invite, userName, role, onClose, onRegenerate }: {
  invite: InviteRead;
  userName: string;
  role: string;
  onClose: () => void;
  onRegenerate: () => Promise<void>;
}) {
  const roleName = ROLE_META[role]?.label ?? role;
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(invite.invite_url);
    setCopied(true);
    setTimeout(onClose, 800);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=500,height=700");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR-инвайт — ${userName}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; text-align: center; }
        img { width: 220px; height: 220px; margin: 20px auto; display: block; }
        .name { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .role { font-size: 14px; color: #888; margin-bottom: 20px; }
        .url { font-size: 11px; font-family: monospace; word-break: break-all; color: #555; margin-top: 16px; border: 1px solid #ddd; padding: 8px; border-radius: 4px; }
        .hint { font-size: 12px; color: #aaa; margin-top: 12px; }
      </style></head><body>
      <div class="name">${userName}</div>
      <div class="role">${roleName}</div>
      <img src="${invite.qr_code_url}" alt="QR Code" />
      <div class="url">${invite.invite_url}</div>
      <div class="hint">Действует до: ${new Date(invite.expires_at).toLocaleString("ru-RU")}</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[420px] rounded-lg border border-border bg-surface p-7 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <div className="label-eyebrow mb-1">Инвайт · {roleName}</div>
          <div className="text-[20px] font-bold tracking-tight text-text">{userName}</div>
          <div className="mt-0.5 text-[12px] text-text-3">
            Действует до: {new Date(invite.expires_at).toLocaleString("ru-RU")}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center rounded-md border border-border bg-white p-4">
          <img src={invite.qr_code_url} alt="QR Code" className="h-44 w-44" />
        </div>

        <div className="mb-4 rounded-sm border border-border bg-surface-2 px-3 py-2.5 font-mono text-[11px] text-text-2 break-all select-all">
          {invite.invite_url}
        </div>

        <div className="mb-2 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-sm border border-border bg-surface px-3 py-2.5 text-[12px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
          >
            Печать QR
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 rounded-sm border border-border bg-surface px-3 py-2.5 text-[12px] font-semibold text-text-2 hover:bg-surface-2 disabled:opacity-50 transition-colors"
            title="Создать новую ссылку (старая перестанет работать)"
          >
            {regenerating ? "Обновление…" : "↻ Обновить"}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 rounded-sm border py-2.5 text-[12.5px] font-semibold transition-colors
              ${copied
                ? "border-success/30 bg-success-bg text-success"
                : "border-border bg-surface text-text-2 hover:bg-surface-2"}`}
          >
            {copied ? "Скопировано ✓" : "Скопировать ссылку"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-sm bg-brand-500 py-2.5 text-[12.5px] font-bold text-white hover:bg-brand-600 transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ title, body, danger, onConfirm, onCancel }: {
  title: string;
  body: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-[340px] rounded-lg border border-border bg-surface p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 text-[16px] font-bold text-text">{title}</div>
        <div className="mb-5 text-[13px] text-text-3">{body}</div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-sm border border-border py-2 text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors">
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-sm py-2 text-[13px] font-bold text-white transition-colors ${danger ? "bg-emergency hover:bg-red-600" : "bg-brand-500 hover:bg-brand-600"}`}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Track map ────────────────────────────────────────────────────────────────

function TrackMap({ posts, users, canAdd, onAddPost, onSelectPost }: {
  posts: Post[];
  users: User[];
  canAdd: boolean;
  onAddPost: (x: number, y: number) => void;
  onSelectPost: (postId: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!canAdd) return;
    const target = e.target as SVGElement;
    if (target.tagName === "circle" || target.tagName === "text") return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 260);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 200);
    onAddPost(x, y);
  }, [onAddPost, canAdd]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 260 200"
      className={`w-full ${canAdd ? "cursor-crosshair" : "cursor-default"}`}
      style={{ height: 180 }}
      onClick={handleClick}
    >
      {/* Track outline */}
      <path
        d="M30 100 C 30 40, 90 30, 130 50 C 160 65, 180 30, 220 50 C 250 65, 240 130, 200 150 C 160 170, 120 150, 90 165 C 60 175, 30 160, 30 100 Z"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="2.5"
      />

      {/* Posts */}
      {posts.map((post, idx) => {
        const pos = post.map_x != null && post.map_y != null
          ? [post.map_x, post.map_y]
          : MAP_POSITIONS[idx % MAP_POSITIONS.length];
        const [px, py] = pos;
        const assignedMarshal = users.find(u => u.assigned_post_id === post.id && u.role === "marshal");
        return (
          <g key={post.id} onClick={(e) => { e.stopPropagation(); onSelectPost(post.id); }} className="cursor-pointer">
            <circle cx={px} cy={py} r="8" fill="var(--c-brand-500, #2B87F7)" opacity={assignedMarshal ? 1 : 0.45} />
            <text x={px} y={py - 12} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700" fill="var(--text-2)">{post.label}</text>
            {assignedMarshal && (
              <text x={px} y={py + 20} textAnchor="middle" fontFamily="system-ui" fontSize="8" fill="var(--text-3)">{assignedMarshal.name.split(" ")[0]}</text>
            )}
          </g>
        );
      })}

      {/* Click hint when no posts */}
      {posts.length === 0 && (
        <text x="130" y="105" textAnchor="middle" fontFamily="system-ui" fontSize="11" fill="var(--text-mute)">
          {canAdd ? "Нажмите на трассу, чтобы добавить пост" : "Сначала добавьте маршала"}
        </text>
      )}
    </svg>
  );
}

// ─── Users page (judges & secretaries) ───────────────────────────────────────

function UsersPage({
  globalUsers,
  onAddUser,
  onDelete,
  onRename,
}: {
  globalUsers: User[];
  onAddUser: (role: UserRole) => void;
  onDelete: (id: number) => void;
  onRename: (id: number, name: string) => void;
}) {
  const judges = globalUsers.filter((u) => u.role === "judge");
  const secretaries = globalUsers.filter((u) => u.role === "secretary");

  const renderGroup = (title: string, role: UserRole, users: User[]) => (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="label-eyebrow">{title}</div>
        <button
          onClick={() => onAddUser(role)}
          className="flex items-center gap-1.5 rounded-sm border border-border bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-semibold text-text-2 hover:bg-surface hover:border-border-strong transition-colors"
        >
          <PlusIcon /> Добавить
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {users.map((u) => {
          const meta = ROLE_META[u.role] ?? ROLE_META.admin;
          return (
            <div
              key={u.id}
              className="group grid items-center gap-3 rounded-md border border-border bg-surface-2 px-3.5 py-2.5 transition-colors hover:border-border-strong"
              style={{ gridTemplateColumns: "36px 1fr auto auto" }}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-sm text-[13px] font-black ${meta.color}`}>
                {meta.letter}
              </span>
              <div className="min-w-0">
                <InlineEdit
                  value={u.name}
                  onSave={(v) => onRename(u.id, v)}
                  className="text-[13px] font-semibold text-text"
                  inputClassName="text-[13px] font-semibold w-[200px]"
                />
                <div className="text-[11px] text-text-3">{meta.label}</div>
              </div>
              <Pill tone={u.has_session ? "success" : "neutral"}>
                {u.has_session ? "● В сети" : "Нет связи"}
              </Pill>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onDelete(u.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-sm border border-border text-text-3 hover:border-emergency/40 hover:text-emergency hover:bg-emergency-bg transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="rounded-md border border-dashed border-border py-6 text-center text-[12px] text-text-3">
            Нет участников — добавьте первого
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[22px] font-bold tracking-tight text-text">Судьи и секретари</div>
        <p className="mt-1 text-[13px] text-text-3">Глобальные аккаунты — имеют доступ ко всем гонкам</p>
      </div>
      {renderGroup("Судьи", "judge", judges)}
      {renderGroup("Секретари", "secretary", secretaries)}
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────

export function OrganizerDashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [view, setView] = useState<"races" | "users">("races");
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [invite, setInvite] = useState<InviteRead | null>(null);
  const [inviteUser, setInviteUser] = useState<User | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<number | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [createPasswordFor, setCreatePasswordFor] = useState<{ role: UserRole } | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [printingAllQR, setPrintingAllQR] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: races = [] } = useQuery({ queryKey: ["races"], queryFn: getRaces });
  const { data: raceUsers = [] } = useQuery({
    queryKey: ["users", selectedRaceId],
    queryFn: () => getUsers(selectedRaceId!),
    enabled: !!selectedRaceId,
    refetchInterval: 10_000,
  });
  const { data: globalUsers = [] } = useQuery({
    queryKey: ["users-global"],
    queryFn: getGlobalUsers,
    refetchInterval: 15_000,
  });

  const selectedRace = races.find((r) => r.id === selectedRaceId);
  const posts = selectedRace?.posts ?? [];
  const marshals = raceUsers.filter((u) => u.role === "marshal");
  const confirmDeleteUser = [...raceUsers, ...globalUsers].find((u) => u.id === confirmDeleteUserId);
  const canAddPost = posts.length < marshals.length;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidateRaces = () => qc.invalidateQueries({ queryKey: ["races"] });
  const invalidateUsers = () => {
    qc.invalidateQueries({ queryKey: ["users", selectedRaceId] });
    qc.invalidateQueries({ queryKey: ["users-global"] });
  };

  const createRaceMut = useMutation({ mutationFn: createRace, onSuccess: invalidateRaces });
  const startRaceMut  = useMutation({ mutationFn: (id: number) => startRace(id), onSuccess: invalidateRaces });
  const finishRaceMut = useMutation({
    mutationFn: (id: number) => finishRace(id),
    onSuccess: () => { invalidateRaces(); setConfirmFinish(false); },
  });
  const updateRaceMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name?: string; venue?: string } }) => updateRace(id, body),
    onSuccess: invalidateRaces,
  });

  const createUserMut = useMutation({
    mutationFn: (body: Parameters<typeof createUser>[0]) => createUser(body),
    onSuccess: invalidateUsers,
  });
  const updateUserMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name?: string } }) => updateUser(id, body),
    onSuccess: invalidateUsers,
  });
  const deleteUserMut = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => { invalidateUsers(); setConfirmDeleteUserId(null); },
  });

  const createPostMut = useMutation({
    mutationFn: ({ label, x, y }: { label: string; x: number; y: number }) =>
      createPost(selectedRaceId!, { label, map_x: x, map_y: y }),
    onSuccess: invalidateRaces,
  });
  const updatePostMut = useMutation({
    mutationFn: ({ postId, body }: { postId: number; body: { label?: string; map_x?: number; map_y?: number } }) =>
      updatePost(selectedRaceId!, postId, body),
    onSuccess: invalidateRaces,
  });
  const deletePostMut = useMutation({
    mutationFn: (postId: number) => deletePost(selectedRaceId!, postId),
    onSuccess: () => { invalidateRaces(); setSelectedPostId(null); },
  });
  const assignPostMut = useMutation({
    mutationFn: ({ userId, postId }: { userId: number; postId: number }) => assignPost(userId, postId),
    onSuccess: invalidateUsers,
  });
  const unassignPostMut = useMutation({
    mutationFn: (userId: number) => unassignPost(userId),
    onSuccess: invalidateUsers,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateInvite = async (u: User) => {
    setInviteError(null);
    try {
      // Marshals use the separate marshal-app; everyone else uses this web app.
      const baseUrl = u.role === "marshal"
        ? (import.meta.env.VITE_MARSHAL_APP_URL ?? window.location.origin)
        : window.location.origin;
      const inv = await createInvite(u.id, baseUrl);
      setInvite(inv);
      setInviteUser(u);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setInviteError(detail ?? `Не удалось создать инвайт для ${u.name}.`);
    }
  };

  const handleRegenerateInvite = async () => {
    if (!inviteUser) return;
    const baseUrl = inviteUser.role === "marshal"
      ? (import.meta.env.VITE_MARSHAL_APP_URL ?? window.location.origin)
      : window.location.origin;
    const inv = await createInvite(inviteUser.id, baseUrl);
    setInvite(inv);
  };

  const handlePrintAllQR = async () => {
    if (marshals.length === 0 || printingAllQR || !selectedRace) return;
    setPrintingAllQR(true);
    try {
      const baseUrl = import.meta.env.VITE_MARSHAL_APP_URL ?? window.location.origin;
      const items = await Promise.all(
        marshals.map(async (m) => {
          const inv = await createInvite(m.id, baseUrl);
          return { user: m, invite: inv };
        })
      );

      const win = window.open("", "_blank", "width=840,height=960");
      if (!win) return;

      const qrItems = items
        .map(
          ({ user, invite }) => `
          <div class="card">
            <div class="name">${user.name}</div>
            <div class="role">Маршал</div>
            <img src="${invite.qr_code_url}" alt="QR" />
            <div class="url">${invite.invite_url}</div>
            <div class="hint">Действует до: ${new Date(invite.expires_at).toLocaleString("ru-RU")}</div>
          </div>`
        )
        .join("");

      win.document.write(`
        <html>
        <head>
          <title>QR-инвайты маршалов — ${selectedRace.name}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; background: #fff; }
            h2 { font-size: 18px; font-weight: 700; margin: 0 0 20px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .card {
              border: 1px solid #d4d4d4; border-radius: 10px; padding: 22px 18px;
              text-align: center; page-break-inside: avoid; break-inside: avoid;
            }
            .name { font-size: 17px; font-weight: 700; margin-bottom: 3px; }
            .role { font-size: 12px; color: #888; margin-bottom: 14px; }
            img { width: 190px; height: 190px; margin: 0 auto; display: block; }
            .url {
              font-size: 9.5px; font-family: monospace; word-break: break-all;
              color: #555; margin-top: 12px; border: 1px solid #e5e5e5;
              padding: 6px 8px; border-radius: 4px; text-align: left;
            }
            .hint { font-size: 11px; color: #aaa; margin-top: 8px; }
            @media print {
              body { padding: 0; }
              .card { page-break-inside: avoid; break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h2>QR-инвайты маршалов — ${selectedRace.name}</h2>
          <div class="grid">${qrItems}</div>
        </body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
    } finally {
      setPrintingAllQR(false);
    }
  };

  const handleAddPost = (x: number, y: number) => {
    if (!selectedRaceId) return;
    createPostMut.mutate({ label: `Пост ${posts.length + 1}`, x, y });
  };

  const handleAddUser = (role: UserRole) => {
    if (role === "judge" || role === "secretary") {
      setNewUserName("");
      setNewUserPassword("");
      setCreatePasswordFor({ role });
    } else {
      if (!selectedRaceId) return;
      createUserMut.mutate({ name: "Новый маршал", role, race_id: selectedRaceId });
    }
  };

  const handleCreateWithPassword = () => {
    if (!createPasswordFor) return;
    createUserMut.mutate({
      name: newUserName.trim() || `Новый (${createPasswordFor.role})`,
      role: createPasswordFor.role,
      // no race_id — judges/secretaries are global
      password: newUserPassword || undefined,
    });
    setCreatePasswordFor(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="flex h-[calc(100vh-60px)] min-h-0">

        {/* ── Left rail ─────────────────────────────────────────────────── */}
        <aside className="w-[220px] shrink-0 overflow-auto border-r border-border bg-bg-elev px-3 py-4">
          {/* Nav */}
          <div className="mb-4 flex gap-1">
            <button
              onClick={() => setView("users")}
              className={`flex-1 rounded-sm border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors
                ${view === "users"
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border bg-surface-2 text-text-2 hover:bg-surface hover:border-border-strong"}`}
            >
              Пользователи
            </button>
            <button
              onClick={() => setView("races")}
              className={`flex-1 rounded-sm border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors
                ${view === "races"
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border bg-surface-2 text-text-2 hover:bg-surface hover:border-border-strong"}`}
            >
              Гонки
            </button>
          </div>

          {view === "races" && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="label-eyebrow">Гонки</div>
                <button
                  onClick={() => createRaceMut.mutate({ name: "Новая гонка", venue: "Трасса", scheduled_at: new Date().toISOString() })}
                  className="flex h-6 w-6 items-center justify-center rounded-sm border border-border bg-surface-2 text-text-2 hover:bg-surface hover:border-border-strong transition-colors"
                  title="Создать гонку"
                >
                  <PlusIcon />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {races.map((race) => {
                  const sm = STATUS_PILL[race.status];
                  const isSelected = race.id === selectedRaceId;
                  return (
                    <button
                      key={race.id}
                      onClick={() => setSelectedRaceId(race.id)}
                      className={`flex flex-col gap-1.5 rounded-md border px-3.5 py-3 text-left transition-all
                        ${isSelected
                          ? "border-brand-500 bg-surface shadow-[0_0_0_3px_rgba(43,135,247,0.12)]"
                          : "border-border bg-transparent hover:bg-surface"}`}
                    >
                      <div className="text-[13px] font-bold leading-tight tracking-tight text-text">{race.name}</div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10.5px] text-text-3">{race.venue}</span>
                        <Pill tone={sm.tone}>{sm.label}</Pill>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <section className="flex-1 overflow-auto px-4 py-5">
          {view === "users" ? (
            <UsersPage
              globalUsers={globalUsers}
              onAddUser={handleAddUser}
              onDelete={(id) => setConfirmDeleteUserId(id)}
              onRename={(id, name) => updateUserMut.mutate({ id, body: { name } })}
            />
          ) : !selectedRace ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="text-[15px] font-semibold text-text-2">Выберите гонку</p>
                <p className="mt-1 text-[13px] text-text-3">или создайте новую в боковой панели</p>
              </div>
            </div>
          ) : (
            <>
              {/* Race header */}
              <div className="mb-5 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2.5">
                    <InlineEdit
                      value={selectedRace.venue}
                      onSave={(v) => updateRaceMut.mutate({ id: selectedRace.id, body: { venue: v } })}
                      className="label-eyebrow"
                    />
                    <Pill tone={STATUS_PILL[selectedRace.status].tone}>
                      {STATUS_PILL[selectedRace.status].label}
                    </Pill>
                  </div>
                  <InlineEdit
                    value={selectedRace.name}
                    onSave={(v) => updateRaceMut.mutate({ id: selectedRace.id, body: { name: v } })}
                    className="text-[26px] font-bold leading-tight tracking-tight text-text"
                    inputClassName="text-[22px] font-bold w-[340px]"
                  />
                  <p className="mt-1 text-[13px] text-text-3">
                    {posts.length} постов · {marshals.length} маршалов · {globalUsers.length} судей/секретарей
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {selectedRace.status === "draft" && (
                    <button
                      onClick={() => startRaceMut.mutate(selectedRace.id)}
                      className="rounded-sm bg-success px-4 py-2 text-[12px] font-bold text-white hover:opacity-90 transition-opacity"
                    >
                      Начать гонку
                    </button>
                  )}
                  {selectedRace.status === "active" && (
                    <button
                      onClick={() => setConfirmFinish(true)}
                      className="rounded-sm border border-emergency/30 px-4 py-2 text-[12px] font-bold text-emergency hover:bg-emergency-bg transition-colors"
                    >
                      Завершить гонку
                    </button>
                  )}
                  {currentUser?.role === "judge" && (
                    <button
                      onClick={() => navigate(`/races/${selectedRace.id}/judge`)}
                      className="rounded-sm bg-brand-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-brand-600 transition-colors"
                    >
                      Войти в гонку →
                    </button>
                  )}
                  {currentUser?.role === "secretary" && (
                    <button
                      onClick={() => navigate(`/races/${selectedRace.id}/secretary`)}
                      className="rounded-sm bg-brand-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-brand-600 transition-colors"
                    >
                      Войти в гонку →
                    </button>
                  )}
                </div>
              </div>

              {/* KPI strip */}
              <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <KpiCard label="Постов"   value={`${posts.length}`} tone="success" />
                <KpiCard label="Маршалов" value={marshals.length} />
                <KpiCard label="Судей"    value={globalUsers.filter(u => u.role === "judge").length} tone="warning" />
                <KpiCard label="Статус"   value={selectedRace.status === "active" ? "LIVE" : "—"} tone={selectedRace.status === "active" ? "success" : "neutral"} />
              </div>

              {/* Main layout */}
              <div className="flex flex-col gap-4">

                {/* Marshals section (race-specific) */}
                <div className="rounded-lg border border-border bg-surface p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="label-eyebrow">Маршалы гонки</div>
                    <div className="flex items-center gap-2">
                      {marshals.length > 0 && (
                        <button
                          onClick={handlePrintAllQR}
                          disabled={printingAllQR}
                          title="Открыть страницу печати QR-кодов всех маршалов"
                          className="flex items-center gap-1.5 rounded-sm border border-border bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-semibold text-text-2 hover:bg-surface hover:border-border-strong disabled:opacity-50 transition-colors"
                        >
                          {printingAllQR ? "Генерация…" : "QR · Все"}
                        </button>
                      )}
                      <button
                        onClick={() => handleAddUser("marshal")}
                        className="flex items-center gap-1.5 rounded-sm border border-border bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-semibold text-text-2 hover:bg-surface hover:border-border-strong transition-colors"
                      >
                        <PlusIcon /> Маршал
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {marshals.map((u) => {
                      const meta = ROLE_META[u.role] ?? ROLE_META.admin;
                      return (
                        <div
                          key={u.id}
                          className="group grid items-center gap-3 rounded-md border border-border bg-surface-2 px-3.5 py-2.5 transition-colors hover:border-border-strong"
                          style={{ gridTemplateColumns: "36px 1fr auto auto auto" }}
                        >
                          <span className={`flex h-8 w-8 items-center justify-center rounded-sm text-[13px] font-black ${meta.color}`}>
                            {meta.letter}
                          </span>
                          <div className="min-w-0">
                            <InlineEdit
                              value={u.name}
                              onSave={(v) => updateUserMut.mutate({ id: u.id, body: { name: v } })}
                              className="text-[13px] font-semibold text-text"
                              inputClassName="text-[13px] font-semibold w-[160px]"
                            />
                            <div className="text-[11px] text-text-3">{meta.label}</div>
                          </div>
                          <select
                            value={u.assigned_post_id ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (!v) unassignPostMut.mutate(u.id);
                              else assignPostMut.mutate({ userId: u.id, postId: Number(v) });
                            }}
                            className="rounded-sm border border-border bg-surface px-2 py-1 text-[11px] text-text-2 focus:outline-none focus:ring-1 focus:ring-brand-400"
                          >
                            <option value="">— пост</option>
                            {posts.map((p) => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </select>
                          <Pill tone={u.has_session ? "success" : "neutral"}>
                            {u.has_session ? "● В сети" : "Нет связи"}
                          </Pill>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleCreateInvite(u)}
                              className="rounded-sm border border-border px-2 py-1 text-[10.5px] font-semibold text-text-2 hover:bg-surface hover:border-border-strong transition-colors"
                              title="QR-инвайт"
                            >QR</button>
                            <button
                              onClick={() => setConfirmDeleteUserId(u.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-sm border border-border text-text-3 hover:border-emergency/40 hover:text-emergency hover:bg-emergency-bg transition-colors"
                            ><TrashIcon /></button>
                          </div>
                        </div>
                      );
                    })}
                    {marshals.length === 0 && (
                      <div className="rounded-md border border-dashed border-border py-6 text-center text-[12px] text-text-3">
                        Добавьте маршалов для этой гонки
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: track map + posts list side by side */}
                <div className="grid grid-cols-[200px_1fr] gap-4">
                  {/* Track map */}
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="label-eyebrow">Трасса</div>
                      {canAddPost
                        ? <span className="text-[10px] text-text-mute">нажмите для добавления поста</span>
                        : marshals.length === 0
                          ? <span className="text-[10px] text-warning">Сначала добавьте маршала</span>
                          : <span className="text-[10px] text-text-mute">все посты созданы</span>
                      }
                    </div>
                    <div className="rounded-md border border-border bg-surface-2 p-2">
                      <TrackMap
                        posts={posts}
                        users={raceUsers}
                        canAdd={canAddPost}
                        onAddPost={handleAddPost}
                        onSelectPost={setSelectedPostId}
                      />
                    </div>
                  </div>

                  {/* Posts list */}
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="label-eyebrow">
                          Посты {posts.length}/{marshals.length}
                        </div>
                        {!canAddPost && marshals.length > 0 && posts.length === 0 && (
                          <div className="text-[10px] text-text-mute mt-0.5">нет маршалов без поста</div>
                        )}
                      </div>
                      <button
                        disabled={!canAddPost}
                        onClick={() => createPostMut.mutate({ label: `Пост ${posts.length + 1}`, x: 130, y: 100 })}
                        className={`flex items-center gap-1 text-[11px] font-semibold transition-colors
                          ${canAddPost ? "text-brand-500 hover:text-brand-600" : "text-text-mute cursor-not-allowed"}`}
                      >
                        <PlusIcon size={10} /> Добавить
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {posts.map((post) => {
                        const assignedMarshal = raceUsers.find(u => u.assigned_post_id === post.id && u.role === "marshal");
                        const isSelected = post.id === selectedPostId;
                        return (
                          <div
                            key={post.id}
                            onClick={() => setSelectedPostId(isSelected ? null : post.id)}
                            className={`group flex items-center gap-2.5 rounded-md border px-3 py-2 cursor-pointer transition-colors
                              ${isSelected ? "border-brand-400 bg-brand-50/40" : "border-border bg-surface-2 hover:border-border-strong"}`}
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-brand-500/15 font-mono text-[10px] font-bold text-brand-500">
                              {posts.indexOf(post) + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <InlineEdit
                                value={post.label}
                                onSave={(v) => updatePostMut.mutate({ postId: post.id, body: { label: v } })}
                                className="text-[12px] font-semibold text-text"
                                inputClassName="text-[12px] font-semibold w-[120px]"
                              />
                              <div className="text-[10px] text-text-3 truncate">
                                {assignedMarshal ? assignedMarshal.name : "Не назначен"}
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deletePostMut.mutate(post.id); }}
                              className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded-sm text-text-3 hover:text-emergency hover:bg-emergency-bg transition-all"
                              title="Удалить пост"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        );
                      })}
                      {posts.length === 0 && (
                        <div className="text-center py-4 text-[11px] text-text-mute">
                          {marshals.length === 0
                            ? "Добавьте маршала, чтобы создать пост"
                            : "Нажмите на карту трассы или «Добавить»"
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {invite && inviteUser && (
        <InviteModal
          invite={invite}
          userName={inviteUser.name}
          role={inviteUser.role}
          onClose={() => { setInvite(null); setInviteUser(null); }}
          onRegenerate={handleRegenerateInvite}
        />
      )}

      {confirmFinish && selectedRace && (
        <ConfirmDialog
          title="Завершить гонку?"
          body={`«${selectedRace.name}» будет переведена в статус «Завершена». Действие нельзя отменить.`}
          danger
          onConfirm={() => finishRaceMut.mutate(selectedRace.id)}
          onCancel={() => setConfirmFinish(false)}
        />
      )}

      {confirmDeleteUserId != null && confirmDeleteUser && (
        <ConfirmDialog
          title="Удалить участника?"
          body={`${confirmDeleteUser.name} будет удалён из гонки вместе со всеми инвайтами.`}
          danger
          onConfirm={() => deleteUserMut.mutate(confirmDeleteUserId!)}
          onCancel={() => setConfirmDeleteUserId(null)}
        />
      )}

      {inviteError && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md border border-emergency/30 bg-emergency-bg px-4 py-3 text-[13px] text-emergency shadow-lg">
          {inviteError}
          <button onClick={() => setInviteError(null)} className="ml-3 font-bold opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {createPasswordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm" onClick={() => setCreatePasswordFor(null)}>
          <div className="w-[360px] rounded-lg border border-border bg-surface p-7 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <div className="label-eyebrow mb-1">Новый участник</div>
              <div className="text-[18px] font-bold tracking-tight text-text">
                {createPasswordFor.role === "judge" ? "Судья" : "Секретарь"}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="label-caps mb-1.5 block">Имя</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder={`Новый ${createPasswordFor.role === "judge" ? "судья" : "секретарь"}`}
                  className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-text placeholder:text-text-mute focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                />
              </div>
              <div>
                <label className="label-caps mb-1.5 block">Пароль</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Для входа через логин/пароль"
                  className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-text placeholder:text-text-mute focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                />
              </div>
              <div className="mt-1 flex gap-2">
                <button onClick={() => setCreatePasswordFor(null)} className="flex-1 rounded-sm border border-border py-2.5 text-[12.5px] font-semibold text-text-2 hover:bg-surface-2 transition-colors">
                  Отмена
                </button>
                <button onClick={handleCreateWithPassword} className="flex-1 rounded-sm bg-brand-500 py-2.5 text-[12.5px] font-bold text-white hover:bg-brand-600 transition-colors">
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
