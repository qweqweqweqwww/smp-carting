/* global React */

// ────────────────────────────────────────────────────────────────
// Components library — buttons, inputs, badges, cards, audio,
// statuses, navigation, role pills.
// ────────────────────────────────────────────────────────────────

function CCard({ title, eyebrow, span = 1, children, padding = 20 }) {
  return (
    <div style={{
      gridColumn: `span ${span}`,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="smp-eyebrow">{eyebrow}</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// Reusable button atom
function SmpBtn({ children, variant = 'primary', size = 'md', icon, full = false }) {
  const base = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    letterSpacing: '-0.005em',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all .15s',
    width: full ? '100%' : 'auto',
  };
  const sizes = {
    sm: { padding: '6px 10px', fontSize: 12, height: 30, borderRadius: 'var(--r-sm)' },
    md: { padding: '9px 16px', fontSize: 13.5, height: 38, borderRadius: 'var(--r-md)' },
    lg: { padding: '14px 22px', fontSize: 15, height: 50, borderRadius: 'var(--r-md)' },
  };
  const variants = {
    primary: {
      background: 'var(--brand-500)',
      color: '#fff',
      boxShadow: 'var(--shadow-brand)',
    },
    secondary: {
      background: 'var(--surface)',
      color: 'var(--text)',
      boxShadow: 'inset 0 0 0 1px var(--border-strong)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-2)',
    },
    danger: {
      background: 'var(--c-emergency)',
      color: '#fff',
    },
    success: {
      background: 'var(--c-success)',
      color: '#fff',
    },
    warning: {
      background: 'var(--c-warning)',
      color: '#fff',
    },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant] }}>
      {icon}
      {children}
    </button>
  );
}

// Status pill
function SmpPill({ children, tone = 'neutral', mono = false }) {
  const tones = {
    neutral: { color: 'var(--text-2)', bg: 'var(--surface-2)', bd: 'var(--border)' },
    brand:   { color: 'var(--brand-600)', bg: 'color-mix(in srgb, var(--brand-500) 10%, transparent)', bd: 'color-mix(in srgb, var(--brand-500) 25%, transparent)' },
    success: { color: 'var(--c-success)', bg: 'var(--c-success-bg)', bd: 'color-mix(in srgb, var(--c-success) 25%, transparent)' },
    warning: { color: 'var(--c-warning)', bg: 'var(--c-warning-bg)', bd: 'color-mix(in srgb, var(--c-warning) 25%, transparent)' },
    danger:  { color: 'var(--c-emergency)', bg: 'var(--c-emergency-bg)', bd: 'color-mix(in srgb, var(--c-emergency) 25%, transparent)' },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px',
      fontSize: 11.5, fontWeight: 600,
      color: t.color,
      background: t.bg,
      border: `1px solid ${t.bd}`,
      borderRadius: 999,
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      letterSpacing: mono ? 0 : '-0.005em',
    }}>{children}</span>
  );
}

// Icons (sparingly used)
const I = {
  mic: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10v2a7 7 0 0 0 14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  ),
  play: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8L6 20z"/></svg>,
  check: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  flag: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22V4h11l1 2h5v10h-7l-1-2H6v8"/>
    </svg>
  ),
  download: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  plus: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};
window.SmpIcons = I;

// Waveform mock (used in many places)
function SmpWave({ bars = 32, color, animated = false, height = 28, gap = 2, w = 3 }) {
  const seed = [0.4,0.7,0.5,0.85,0.6,0.3,0.7,0.5,0.9,0.4,0.55,0.75,0.45,0.6,0.3,0.85,0.5,0.7,0.4,0.6,0.85,0.55,0.4,0.7,0.5,0.3,0.6,0.85,0.45,0.55,0.7,0.4];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, height }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = seed[i % seed.length] * height;
        return (
          <div key={i} style={{
            width: w, height: h,
            background: color || 'currentColor',
            borderRadius: 999,
            animation: animated ? `smp-pulse ${1 + (i % 4) * 0.2}s ease-in-out infinite` : undefined,
          }}/>
        );
      })}
    </div>
  );
}
window.SmpWave = SmpWave;

window.SmpBtn = SmpBtn;
window.SmpPill = SmpPill;

// ────────────────────────────────────────────────────────────────
// Components artboard
// ────────────────────────────────────────────────────────────────
function Components({ dark = false }) {
  const cls = dark ? 'theme-dark smp-root' : 'smp-root';
  return (
    <div className={cls} style={{
      width: 1240,
      padding: 40,
      background: 'var(--bg)',
      minHeight: 1700,
      boxSizing: 'border-box',
    }}>
      <div style={{ marginBottom: 32 }}>
        <span className="smp-eyebrow">Components · {dark ? 'Dark' : 'Light'}</span>
        <h1 style={{ margin: '6px 0 0', fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Библиотека компонентов
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 14 }}>
          Атомы и молекулы, из которых собраны экраны
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

        {/* Buttons */}
        <CCard span={7} eyebrow="01 · Actions" title="Кнопки">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <SmpBtn variant="primary" size="lg">Подтвердить и отправить</SmpBtn>
              <SmpBtn variant="primary" size="md">Создать гонку</SmpBtn>
              <SmpBtn variant="primary" size="sm">Старт</SmpBtn>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <SmpBtn variant="secondary" size="md">Повторить</SmpBtn>
              <SmpBtn variant="ghost" size="md">Отмена</SmpBtn>
              <SmpBtn variant="danger" size="md">Штраф</SmpBtn>
              <SmpBtn variant="warning" size="md">Предупреждение</SmpBtn>
              <SmpBtn variant="success" size="md" icon={I.check(14)}>Принято</SmpBtn>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <SmpBtn variant="primary" size="md" icon={I.plus(14)}>Добавить пост</SmpBtn>
              <SmpBtn variant="secondary" size="md" icon={I.download(14)}>Excel</SmpBtn>
              <SmpBtn variant="secondary" size="md" icon={I.download(14)}>PDF</SmpBtn>
            </div>
          </div>
        </CCard>

        {/* Status pills */}
        <CCard span={5} eyebrow="02 · Status" title="Пилюли и бейджи">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <SmpPill tone="success">● В эфире</SmpPill>
              <SmpPill tone="brand">Черновик</SmpPill>
              <SmpPill tone="warning">Ожидает решения</SmpPill>
              <SmpPill tone="danger">Авария</SmpPill>
              <SmpPill tone="neutral">Архив</SmpPill>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <SmpPill tone="brand" mono>POST · M-03</SmpPill>
              <SmpPill tone="neutral" mono>#042</SmpPill>
              <SmpPill tone="danger">EMERGENCY</SmpPill>
              <SmpPill tone="success">PENALTY +5s</SmpPill>
            </div>
          </div>
        </CCard>

        {/* Inputs */}
        <CCard span={6} eyebrow="03 · Forms" title="Поля ввода">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="smp-label" style={{ marginBottom: 6 }}>Номера пилотов</div>
              <input defaultValue="7, 23" style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px',
                fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
                color: 'var(--text)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                outline: 'none',
              }}/>
            </div>
            <div>
              <div className="smp-label" style={{ marginBottom: 6 }}>Тип нарушения</div>
              <div style={{
                padding: '10px 14px',
                fontSize: 14, color: 'var(--text)',
                background: 'var(--surface-2)',
                border: `1px solid var(--brand-500)`,
                borderRadius: 'var(--r-md)',
                boxShadow: '0 0 0 3px color-mix(in srgb, var(--brand-500) 18%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>Столкновение</span>
                <span style={{ color: 'var(--text-3)' }}>▾</span>
              </div>
            </div>
            <div>
              <div className="smp-label" style={{ marginBottom: 6 }}>Заметки</div>
              <div style={{
                padding: '10px 14px',
                fontSize: 13, color: 'var(--text-3)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                minHeight: 56,
              }}>
                Контакт на повороте 4, виноват пилот 23…
              </div>
            </div>
          </div>
        </CCard>

        {/* Audio player */}
        <CCard span={6} eyebrow="04 · Audio" title="Плеер инцидента">
          <div style={{
            padding: 14,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--brand-500)', color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', flexShrink: 0,
              }}>{I.play(14)}</button>
              <div style={{ flex: 1, color: 'var(--brand-500)' }}>
                <SmpWave bars={36} height={26} w={3} gap={2}/>
              </div>
              <div className="smp-mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>0:08</div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
              <span>Маршал · М. Иванов</span>
              <span className="smp-mono">M-03 · 14:32:08</span>
            </div>
          </div>
        </CCard>

        {/* Incident card preview */}
        <CCard span={6} eyebrow="05 · Cards" title="Карточка инцидента">
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--brand-500)',
            borderRadius: 'var(--r-md)',
            padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <SmpPill tone="brand" mono>#042</SmpPill>
                <SmpPill tone="neutral" mono>M-03</SmpPill>
              </div>
              <span className="smp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>14:32:08</span>
            </div>
            <div className="smp-label" style={{ marginBottom: 4 }}>ПИЛОТЫ</div>
            <div className="smp-mono smp-tnum" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 10 }}>
              07 · 23
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, marginBottom: 10 }}>
              Столкновение · Поворот 4
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <SmpBtn variant="danger" size="sm" full>Штраф</SmpBtn>
              <SmpBtn variant="warning" size="sm" full>Предупр.</SmpBtn>
              <SmpBtn variant="ghost" size="sm" full>Снять</SmpBtn>
            </div>
          </div>
        </CCard>

        {/* Role chips & headers */}
        <CCard span={6} eyebrow="06 · Roles" title="Роли и идентификация">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { r: 'Marshal',   ru: 'Маршал',     c: 'var(--brand-500)' },
              { r: 'Judge',     ru: 'Судья',      c: 'var(--c-warning)' },
              { r: 'Secretary', ru: 'Секретарь',  c: 'var(--c-success)' },
              { r: 'Organizer', ru: 'Организатор',c: '#8B5CF6' },
            ].map(role => (
              <div key={role.r} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 'var(--r-sm)',
                  background: `color-mix(in srgb, ${role.c} 14%, transparent)`,
                  color: role.c,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>{role.r[0]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{role.ru}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{role.r.toLowerCase()}</div>
                </div>
                <SmpPill tone="success">●</SmpPill>
              </div>
            ))}
          </div>
        </CCard>

        {/* Big number / KPI */}
        <CCard span={12} eyebrow="07 · Data display" title="Числа и метрики">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Инцидентов', v: '42', d: '+12 за час' },
              { l: 'Штрафов',    v: '07', d: '17% от инц.', t: 'danger' },
              { l: 'В очереди',  v: '03', d: 'ожидают судью', t: 'warning' },
              { l: 'Время гонки',v: '01:24:08', d: 'идёт', t: 'success', mono: true },
            ].map(m => (
              <div key={m.l} style={{
                padding: 18,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
              }}>
                <div className="smp-label">{m.l}</div>
                <div className="smp-mono smp-tnum" style={{
                  marginTop: 6,
                  fontSize: m.mono ? 30 : 38, fontWeight: 700,
                  color: m.t === 'danger' ? 'var(--c-emergency)' :
                         m.t === 'warning' ? 'var(--c-warning)' :
                         m.t === 'success' ? 'var(--c-success)' : 'var(--text)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}>{m.v}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>{m.d}</div>
              </div>
            ))}
          </div>
        </CCard>

      </div>
    </div>
  );
}

window.Components = Components;
