/* global React, SmpBtn, SmpPill, SmpIcons, AppShell */

const I = window.SmpIcons;

const TEAM = [
  { role: 'marshal',   name: 'М. Иванов',     post: 'M-03', status: 'online',  invited: true },
  { role: 'marshal',   name: 'И. Соколов',    post: 'M-01', status: 'online',  invited: true },
  { role: 'marshal',   name: 'Е. Карпов',     post: 'M-05', status: 'online',  invited: true },
  { role: 'marshal',   name: 'Д. Семёнов',    post: 'M-02', status: 'pending', invited: true },
  { role: 'marshal',   name: 'О. Громова',    post: 'M-04', status: 'online',  invited: true },
  { role: 'judge',     name: 'А. Петров',     post: '—',    status: 'online',  invited: false },
  { role: 'secretary', name: 'Н. Орлова',     post: '—',    status: 'online',  invited: false },
];

const ROLE_META = {
  marshal:   { label: 'Маршал',     color: 'var(--brand-500)' },
  judge:     { label: 'Судья',      color: 'var(--c-warning)' },
  secretary: { label: 'Секретарь',  color: 'var(--c-success)' },
};

function StatusDot({ status }) {
  if (status === 'online') return <SmpPill tone="success">● Онлайн</SmpPill>;
  if (status === 'pending') return <SmpPill tone="warning">Не зашёл</SmpPill>;
  return <SmpPill tone="neutral">Оффлайн</SmpPill>;
}

function Organizer({ dark = false, showInvite = false }) {
  return (
    <AppShell role="Организатор" name="К. Волков">
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        height: '100%',
        minHeight: 0,
      }}>
        {/* Left rail: races */}
        <aside style={{
          background: 'var(--bg-elev)',
          borderRight: '1px solid var(--border)',
          padding: '22px 16px',
          overflow: 'auto',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="smp-eyebrow">Гонки</span>
            <button style={{
              width: 24, height: 24, borderRadius: 'var(--r-sm)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text-2)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>{I.plus(12)}</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'Этап 3 · Москва',     date: '14 мая 2026', s: 'active' },
              { name: 'Этап 2 · Казань',     date: '12 апр 2026', s: 'finished' },
              { name: 'Этап 1 · Сочи',       date: '21 мар 2026', s: 'finished' },
              { name: 'Тест · ADM',          date: 'черновик',    s: 'draft' },
            ].map((r, i) => (
              <button key={r.name} style={{
                textAlign: 'left',
                padding: '12px 14px',
                background: i === 0 ? 'var(--surface)' : 'transparent',
                border: `1px solid ${i === 0 ? 'var(--brand-500)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                boxShadow: i === 0 ? '0 0 0 3px color-mix(in srgb, var(--brand-500) 12%, transparent)' : 'none',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.005em' }}>{r.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="smp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{r.date}</span>
                  {r.s === 'active'   && <SmpPill tone="success">● В&nbsp;эфире</SmpPill>}
                  {r.s === 'finished' && <SmpPill tone="neutral">Завершена</SmpPill>}
                  {r.s === 'draft'    && <SmpPill tone="brand">Черновик</SmpPill>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <section style={{ padding: '24px 28px 32px', overflow: 'auto' }}>
          {/* Heading */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className="smp-eyebrow">Этап 3 · 14 мая</span>
                <SmpPill tone="success">● В&nbsp;эфире</SmpPill>
              </div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.015em' }}>
                Москва · ADM&nbsp;Raceway
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
                Старт в 14:00 · идёт 1:24:08 · 5 постов, 7 человек в&nbsp;команде
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SmpBtn variant="ghost" size="md">Настройки</SmpBtn>
              <SmpBtn variant="danger" size="md" icon={I.flag(14)}>Завершить</SmpBtn>
            </div>
          </div>

          {/* Live KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { l: 'Постов',     v: '5/5', t: 'success' },
              { l: 'Инцидентов', v: '42',  t: 'neutral' },
              { l: 'В очереди',  v: '04',  t: 'warning' },
              { l: 'Аварий',     v: '01',  t: 'danger'  },
            ].map(m => (
              <div key={m.l} style={{
                padding: '14px 18px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div className="smp-label">{m.l}</div>
                <div className="smp-mono smp-tnum" style={{
                  fontSize: 24, fontWeight: 700,
                  color: m.t === 'warning' ? 'var(--c-warning)' :
                         m.t === 'danger' ? 'var(--c-emergency)' :
                         m.t === 'success' ? 'var(--c-success)' : 'var(--text)',
                  letterSpacing: '-0.02em',
                }}>{m.v}</div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
            {/* Team section */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: 22,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <span className="smp-eyebrow">Команда</span>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>Маршалы и судьи</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <SmpBtn variant="secondary" size="sm" icon={I.plus(12)}>Маршал</SmpBtn>
                  <SmpBtn variant="secondary" size="sm" icon={I.plus(12)}>Судья</SmpBtn>
                  <SmpBtn variant="secondary" size="sm" icon={I.plus(12)}>Секретарь</SmpBtn>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TEAM.map(t => (
                  <div key={t.name} style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr 80px 110px auto',
                    alignItems: 'center', gap: 14,
                    padding: '10px 14px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                  }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 'var(--r-sm)',
                      background: `color-mix(in srgb, ${ROLE_META[t.role].color} 14%, transparent)`,
                      color: ROLE_META[t.role].color,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 13,
                    }}>{t.role[0].toUpperCase()}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ROLE_META[t.role].label}</div>
                    </div>
                    <span className="smp-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{t.post}</span>
                    <StatusDot status={t.status}/>
                    {t.role === 'marshal'
                      ? <SmpBtn variant="ghost" size="sm">QR-инвайт</SmpBtn>
                      : <SmpBtn variant="ghost" size="sm">Ссылка</SmpBtn>}
                  </div>
                ))}
              </div>
            </div>

            {/* Track map placeholder + activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                padding: 18,
              }}>
                <div style={{ marginBottom: 12 }}>
                  <span className="smp-eyebrow">Трасса</span>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Расстановка постов</div>
                </div>
                {/* simple SVG track outline + post markers */}
                <div style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: 14,
                }}>
                  <svg viewBox="0 0 260 200" style={{ width: '100%', height: 180 }}>
                    <path d="M30 100 C 30 40, 90 30, 130 50 C 160 65, 180 30, 220 50 C 250 65, 240 130, 200 150 C 160 170, 120 150, 90 165 C 60 175, 30 160, 30 100 Z"
                      fill="none" stroke="var(--border-strong)" strokeWidth="2.5"/>
                    {[
                      { x: 30,  y: 100, l: 'M-01' },
                      { x: 130, y: 50,  l: 'M-02' },
                      { x: 220, y: 50,  l: 'M-03' },
                      { x: 200, y: 150, l: 'M-04' },
                      { x: 60,  y: 165, l: 'M-05' },
                    ].map(p => (
                      <g key={p.l}>
                        <circle cx={p.x} cy={p.y} r="7" fill="var(--brand-500)"/>
                        <text x={p.x + 12} y={p.y + 4} fontFamily="JetBrains Mono"
                          fontSize="10" fontWeight="700" fill="var(--text-2)">{p.l}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                padding: 18,
              }}>
                <div style={{ marginBottom: 10 }}>
                  <span className="smp-eyebrow">Live</span>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Поток</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { t: '14:32', a: 'М. Иванов', e: 'Инцидент #042 · пилоты 07, 23' },
                    { t: '14:31', a: 'И. Соколов', e: 'Инцидент #041 · пилот 14' },
                    { t: '14:30', a: 'А. Петров',  e: 'Штраф #038 +5 сек' },
                    { t: '14:28', a: 'Д. Семёнов', e: 'Аварийный режим включён' },
                  ].map(r => (
                    <div key={r.t + r.e} style={{
                      display: 'flex', gap: 10,
                      paddingBottom: 8,
                      borderBottom: '1px solid var(--divider)',
                    }}>
                      <span className="smp-mono smp-tnum" style={{ fontSize: 10.5, color: 'var(--text-3)', flexShrink: 0, paddingTop: 1 }}>{r.t}</span>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.a}</span> · {r.e}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Invite modal overlay */}
      {showInvite && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(10, 14, 28, 0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>
          <div style={{
            width: 400,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: 28,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div>
              <span className="smp-eyebrow">Инвайт · Маршал М-03</span>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, letterSpacing: '-0.01em' }}>М.&nbsp;Иванов</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                Действует до 17 мая 14:00 · 72 часа
              </div>
            </div>

            {/* QR placeholder */}
            <div style={{
              padding: 18,
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 200 200" width="180" height="180">
                {Array.from({ length: 25 }).map((_, i) =>
                  Array.from({ length: 25 }).map((_, j) => {
                    const seed = (i * 31 + j * 7 + i * j) % 5;
                    return seed < 2 ? <rect key={i + '-' + j} x={j * 8} y={i * 8} width="7.5" height="7.5" fill="#0E1320"/> : null;
                  })
                )}
                {/* finder squares */}
                {[[0,0],[17,0],[0,17]].map(([x,y]) => (
                  <g key={x + '-' + y}>
                    <rect x={x*8} y={y*8} width="56" height="56" fill="#0E1320"/>
                    <rect x={x*8+8} y={y*8+8} width="40" height="40" fill="#fff"/>
                    <rect x={x*8+16} y={y*8+16} width="24" height="24" fill="#0E1320"/>
                  </g>
                ))}
              </svg>
            </div>

            <div style={{
              padding: '10px 12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-mono)', fontSize: 11.5,
              color: 'var(--text-2)',
              wordBreak: 'break-all',
            }}>
              http://192.168.1.100:5174/join/k7Hq2pNm8…
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <SmpBtn variant="secondary" size="md" full>Скопировать</SmpBtn>
              <SmpBtn variant="primary" size="md" full>Готово</SmpBtn>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
window.Organizer = Organizer;
