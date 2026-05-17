/* global React, SmpBtn, SmpPill, SmpWave, SmpIcons */

// Judge Dashboard — tablet
// V1: refined grid (current shape)
// V2: focus mode — one big card centered, queue side rail
// + emergency banner variation

const I = window.SmpIcons;

const VIOLATIONS_RU = {
  collision: 'Столкновение',
  track_limits: 'Срез',
  false_start: 'Фальстарт',
  unsafe_driving: 'Опасное вождение',
  blocking: 'Блокировка',
  other: 'Другое',
};

const POSTS = ['М-01', 'М-02', 'М-03', 'М-04', 'М-05'];

// Common app shell for web views (used by Judge, Secretary, Organizer)
function AppShell({ role = 'Судья', name = 'А. Петров', children, title, subtitle, headerExtra }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100%', height: '100%',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Topbar */}
      <header style={{
        height: 60, flexShrink: 0,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 'var(--r-sm)',
              background: 'var(--brand-500)',
              color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
            }}>SMP</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                Race Control
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: -1 }}>
                Этап 3 · Москва · ADM Raceway
              </div>
            </div>
          </div>
          {headerExtra}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: 'var(--c-success-bg)', color: 'var(--c-success)', fontSize: 11, fontWeight: 600, border: '1px solid color-mix(in srgb, var(--c-success) 22%, transparent)' }}>
            <span className="smp-dot" style={{ width: 6, height: 6 }}/>
            <span className="smp-mono smp-tnum">01:24:08</span>
          </div>
          <span style={{ width: 1, height: 22, background: 'var(--border)' }}/>
          <SmpPill tone="warning">{role}</SmpPill>
          <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>{name}</span>
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
window.AppShell = AppShell;

// Incident grid card
function IncidentCard({ inc, big = false }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${inc.emergency ? 'var(--c-emergency)' : 'var(--brand-500)'}`,
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {inc.emergency && (
        <div style={{
          background: 'var(--c-emergency)',
          color: '#fff',
          padding: '4px 14px',
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>● Авария</span>
          <span className="smp-mono smp-tnum">{inc.elapsed}s</span>
        </div>
      )}
      <div style={{ padding: big ? 22 : 16, display: 'flex', flexDirection: 'column', gap: big ? 16 : 12 }}>
        {/* meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <SmpPill tone="brand" mono>#{inc.id}</SmpPill>
            <SmpPill tone="neutral" mono>{inc.post}</SmpPill>
          </div>
          <span className="smp-mono smp-tnum" style={{ fontSize: 11, color: 'var(--text-3)' }}>{inc.time}</span>
        </div>

        <div>
          <div className="smp-label" style={{ marginBottom: 3 }}>ПИЛОТЫ</div>
          <div className="smp-mono smp-tnum" style={{
            fontSize: big ? 52 : 32, fontWeight: 700, color: 'var(--text)',
            letterSpacing: '-0.02em', lineHeight: 1,
          }}>{inc.pilots}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: big ? 15 : 13, fontWeight: 600, color: 'var(--text)' }}>
            {VIOLATIONS_RU[inc.violation] || inc.violation}
          </span>
          {inc.location && <>
            <span style={{ color: 'var(--text-mute)' }}>·</span>
            <span style={{ fontSize: big ? 14 : 12.5, color: 'var(--text-3)' }}>{inc.location}</span>
          </>}
        </div>

        {inc.transcript && (
          <blockquote style={{
            margin: 0,
            padding: '8px 12px',
            background: 'var(--surface-2)',
            borderLeft: '2px solid var(--border-strong)',
            borderRadius: 4,
            fontSize: big ? 13 : 12, color: 'var(--text-2)',
            fontStyle: 'italic', lineHeight: 1.5,
          }}>«{inc.transcript}»</blockquote>
        )}

        {/* audio */}
        <div style={{
          padding: '8px 12px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button style={{
            width: big ? 36 : 30, height: big ? 36 : 30, borderRadius: '50%',
            background: 'var(--brand-500)', color: '#fff', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{I.play(big ? 13 : 11)}</button>
          <div style={{ flex: 1, color: 'var(--brand-500)' }}>
            <SmpWave bars={big ? 32 : 22} height={big ? 22 : 18} w={2.5} gap={2}/>
          </div>
          <span className="smp-mono smp-tnum" style={{ fontSize: 11, color: 'var(--text-3)' }}>0:{inc.duration || '08'}</span>
        </div>

        {/* penalty detail input (only big) */}
        {big && (
          <input placeholder="Детали штрафа (+5 сек, проезд через пит-лейн…)" style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 14px',
            fontSize: 13, color: 'var(--text)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            outline: 'none',
          }}/>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <SmpBtn variant="danger" size={big ? 'lg' : 'md'} full>Штраф</SmpBtn>
          <SmpBtn variant="warning" size={big ? 'lg' : 'md'} full>Предупр.</SmpBtn>
          <SmpBtn variant="secondary" size={big ? 'lg' : 'md'} full>Снять</SmpBtn>
        </div>
      </div>
    </div>
  );
}
window.IncidentCard = IncidentCard;

const SAMPLE_INCIDENTS = [
  { id: '042', post: 'M-03', pilots: '07 · 23', violation: 'collision', location: 'Поворот 4', time: '14:32:08', duration: '08', emergency: false,
    transcript: 'Седьмой и двадцать третий, контакт на четвёртом повороте, виноват двадцать третий' },
  { id: '041', post: 'M-01', pilots: '14',     violation: 'track_limits', location: 'Шикана 2', time: '14:31:44', duration: '05', emergency: false },
  { id: '040', post: 'M-05', pilots: '03 · 19', violation: 'blocking', location: 'Старт-финиш', time: '14:30:12', duration: '11', emergency: false,
    transcript: 'Третий блокировал девятнадцатого на старт-финише' },
  { id: '039', post: 'M-02', pilots: '09', violation: 'unsafe_driving', location: 'Поворот 7', time: '14:28:55', duration: '06', emergency: true, elapsed: '12',
    transcript: 'Девятый ехал по встречной после выезда с обочины' },
];

// — VARIANT 1 — Grid of cards ────────────────────────────────────
function JudgeV1({ dark = false }) {
  return (
    <AppShell role="Судья" name="А. Петров">
      <div style={{ padding: '24px 28px 32px' }}>
        {/* Heading row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <span className="smp-eyebrow">Live</span>
            <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-0.015em' }}>
              Очередь инцидентов
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              4 новых · среднее время реакции 18 сек
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SmpBtn variant="ghost" size="md">Все посты</SmpBtn>
            <SmpBtn variant="secondary" size="md">Фильтры</SmpBtn>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
          {[
            { l: 'В очереди', v: '04', t: 'warning' },
            { l: 'Решено',    v: '38', t: 'success' },
            { l: 'Штрафов',   v: '07', t: 'danger' },
            { l: 'Аварий',    v: '01', t: 'danger' },
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
                fontSize: 28, fontWeight: 700,
                color: m.t === 'warning' ? 'var(--c-warning)' :
                       m.t === 'danger' ? 'var(--c-emergency)' :
                       m.t === 'success' ? 'var(--c-success)' : 'var(--text)',
                letterSpacing: '-0.02em', lineHeight: 1,
              }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {SAMPLE_INCIDENTS.map(inc => <IncidentCard key={inc.id} inc={inc}/>)}
        </div>
      </div>
    </AppShell>
  );
}
window.JudgeV1 = JudgeV1;

// — VARIANT 2 — Focus mode: one big card + side queue ─────────────
function JudgeV2({ dark = false, emergency = false }) {
  return (
    <AppShell role="Судья" name="А. Петров">
      {/* Optional emergency strip */}
      {emergency && (
        <div style={{
          background: 'var(--c-emergency)',
          color: '#fff',
          padding: '10px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="smp-dot smp-pulse" style={{ width: 9, height: 9, background: '#fff', color: '#fff' }}/>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Авария на М-02 · пилот 9 · поворот 7
            </span>
          </div>
          <button style={{
            padding: '4px 12px', borderRadius: 'var(--r-sm)',
            background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>Закрыть</button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        height: '100%',
        minHeight: 0,
      }}>
        {/* Left rail — queue */}
        <aside style={{
          background: 'var(--bg-elev)',
          borderRight: '1px solid var(--border)',
          padding: '22px 18px',
          overflow: 'auto',
        }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="smp-eyebrow">Очередь</span>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, letterSpacing: '-0.01em' }}>4 инцидента</div>
            </div>
            <SmpPill tone="warning" mono>WAITING</SmpPill>
          </div>

          {/* Posts strip */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {POSTS.map((p, i) => (
              <button key={p} style={{
                padding: '5px 10px',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                background: i === 0 ? 'var(--brand-500)' : 'transparent',
                color: i === 0 ? '#fff' : 'var(--text-2)',
                border: `1px solid ${i === 0 ? 'transparent' : 'var(--border)'}`,
                borderRadius: 999,
                cursor: 'pointer',
              }}>{p}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SAMPLE_INCIDENTS.map((inc, i) => (
              <button key={inc.id} style={{
                textAlign: 'left',
                padding: '12px 14px',
                background: i === 0 ? 'var(--surface)' : 'transparent',
                border: `1px solid ${i === 0 ? 'var(--brand-500)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                boxShadow: i === 0 ? '0 0 0 3px color-mix(in srgb, var(--brand-500) 14%, transparent)' : 'none',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {inc.emergency && <span className="smp-dot" style={{ color: 'var(--c-emergency)', width: 7, height: 7 }}/>}
                    <span className="smp-mono" style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? 'var(--brand-500)' : 'var(--text-2)' }}>
                      #{inc.id}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{inc.post}</span>
                  </div>
                  <span className="smp-mono smp-tnum" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{inc.time.slice(0, 5)}</span>
                </div>
                <div className="smp-mono smp-tnum" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {inc.pilots}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {VIOLATIONS_RU[inc.violation]}
                </div>
              </button>
            ))}
          </div>

          {/* Recent decisions */}
          <div style={{ marginTop: 22 }}>
            <div className="smp-label" style={{ marginBottom: 8 }}>ПРИНЯТЫЕ · ЗА ПОСЛЕДНИЙ ЧАС</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { id: '038', d: 'penalty', detail: '+5 сек' },
                { id: '037', d: 'warning', detail: '' },
                { id: '036', d: 'dismiss', detail: '' },
              ].map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 4px',
                  fontSize: 11.5,
                }}>
                  <span className="smp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)', width: 32 }}>#{r.id}</span>
                  {r.d === 'penalty' && <SmpPill tone="danger">Штраф{r.detail && ` ${r.detail}`}</SmpPill>}
                  {r.d === 'warning' && <SmpPill tone="warning">Предупр.</SmpPill>}
                  {r.d === 'dismiss' && <SmpPill tone="neutral">Снят</SmpPill>}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main — focus card */}
        <section style={{
          padding: '32px 40px',
          overflow: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <span className="smp-eyebrow">Активный инцидент</span>
              <h1 style={{ margin: '4px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Инцидент #042
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
                Получено 14:32:08 · 18 сек назад · пост М-03, маршал М.&nbsp;Иванов
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SmpBtn variant="ghost" size="md">↑ Предыдущий</SmpBtn>
              <SmpBtn variant="ghost" size="md">Следующий ↓</SmpBtn>
            </div>
          </div>

          <IncidentCard inc={SAMPLE_INCIDENTS[0]} big/>
        </section>
      </div>
    </AppShell>
  );
}
window.JudgeV2 = JudgeV2;
