/* global React, SmpBtn, SmpPill, SmpIcons, AppShell */

const I = window.SmpIcons;

const PROTOCOL = [
  { n: 42, pilots: '07, 23', viol: 'Столкновение',     dec: 'penalty', det: '+5 сек',   post: 'M-03', marshal: 'М. Иванов',     judge: 'А. Петров', time: '14:32:51' },
  { n: 41, pilots: '14',     viol: 'Срез',             dec: 'warning', det: '',         post: 'M-01', marshal: 'И. Соколов',    judge: 'А. Петров', time: '14:32:02' },
  { n: 40, pilots: '03, 19', viol: 'Блокировка',       dec: 'dismiss', det: '',         post: 'M-05', marshal: 'Е. Карпов',     judge: 'А. Петров', time: '14:30:50' },
  { n: 39, pilots: '09',     viol: 'Опасное вождение', dec: 'penalty', det: 'Пит-лейн', post: 'M-02', marshal: 'Д. Семёнов',    judge: 'А. Петров', time: '14:29:14' },
  { n: 38, pilots: '11, 02', viol: 'Столкновение',     dec: 'warning', det: '',         post: 'M-04', marshal: 'О. Громова',    judge: 'А. Петров', time: '14:25:40' },
  { n: 37, pilots: '08',     viol: 'Фальстарт',        dec: 'penalty', det: '+3 сек',   post: 'M-01', marshal: 'И. Соколов',    judge: 'А. Петров', time: '14:21:08' },
  { n: 36, pilots: '21',     viol: 'Срез',             dec: 'dismiss', det: '',         post: 'M-05', marshal: 'Е. Карпов',     judge: 'А. Петров', time: '14:18:33' },
  { n: 35, pilots: '06, 15', viol: 'Опасное вождение', dec: 'penalty', det: '+10 сек',  post: 'M-03', marshal: 'М. Иванов',     judge: 'А. Петров', time: '14:14:22' },
  { n: 34, pilots: '04',     viol: 'Блокировка',       dec: 'warning', det: '',         post: 'M-02', marshal: 'Д. Семёнов',    judge: 'А. Петров', time: '14:11:55' },
];

function DecPill({ dec, det }) {
  const map = {
    penalty: { tone: 'danger', label: 'Штраф' },
    warning: { tone: 'warning', label: 'Предупр.' },
    dismiss: { tone: 'neutral', label: 'Снят' },
  };
  const m = map[dec];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <SmpPill tone={m.tone}>{m.label}</SmpPill>
      {det && <span className="smp-mono" style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}>{det}</span>}
    </div>
  );
}

function Secretary({ dark = false }) {
  return (
    <AppShell role="Секретарь" name="Н. Орлова">
      <div style={{ padding: '24px 28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <span className="smp-eyebrow">Протокол · Live</span>
            <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-0.015em' }}>
              Протокол гонки
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              42 записи · последнее решение 18&nbsp;сек&nbsp;назад
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SmpBtn variant="secondary" size="md" icon={I.download(14)}>Excel</SmpBtn>
            <SmpBtn variant="secondary" size="md" icon={I.download(14)}>PDF</SmpBtn>
            <SmpBtn variant="primary" size="md" icon={I.flag(14)}>Завершить гонку</SmpBtn>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 22 }}>
          {[
            { l: 'Записей',    v: '42', t: 'neutral' },
            { l: 'Штрафов',    v: '07', t: 'danger',  d: '17%' },
            { l: 'Предупр.',   v: '12', t: 'warning', d: '29%' },
            { l: 'Снято',      v: '23', t: 'success', d: '54%' },
            { l: 'Аварий',     v: '01', t: 'danger' },
          ].map(m => (
            <div key={m.l} style={{
              padding: '14px 18px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div className="smp-label">{m.l}</div>
                {m.d && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{m.d}</div>}
              </div>
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

        {/* Filters bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          marginBottom: 14,
        }}>
          <input placeholder="Поиск по номеру пилота, типу нарушения…" style={{
            flex: 1,
            padding: '6px 4px',
            border: 'none', outline: 'none',
            background: 'transparent', color: 'var(--text)',
            fontSize: 13.5, fontFamily: 'var(--font-sans)',
          }}/>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Все', 'Штраф', 'Предупр.', 'Снято'].map((f, i) => (
              <button key={f} style={{
                padding: '4px 11px',
                fontSize: 11.5, fontWeight: 600,
                background: i === 0 ? 'var(--surface-2)' : 'transparent',
                color: i === 0 ? 'var(--text)' : 'var(--text-3)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                cursor: 'pointer',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { h: '#',         w: 50 },
                  { h: 'Время',     w: 100 },
                  { h: 'Пилоты',    w: 100 },
                  { h: 'Нарушение', w: 220 },
                  { h: 'Решение',   w: 200 },
                  { h: 'Пост',      w: 70 },
                  { h: 'Маршал',    w: 150 },
                  { h: 'Судья',     w: 130 },
                ].map(c => (
                  <th key={c.h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    width: c.w,
                  }}>{c.h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROTOCOL.map((r, i) => (
                <tr key={r.n} style={{
                  borderBottom: i === PROTOCOL.length - 1 ? 'none' : '1px solid var(--divider)',
                }}>
                  <td style={{ padding: '11px 14px' }} className="smp-mono smp-tnum">
                    <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>{String(r.n).padStart(3, '0')}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }} className="smp-mono smp-tnum">
                    <span style={{ color: 'var(--text-2)' }}>{r.time}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }} className="smp-mono">
                    <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{r.pilots}</span>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--text)', fontWeight: 500 }}>{r.viol}</td>
                  <td style={{ padding: '11px 14px' }}><DecPill dec={r.dec} det={r.det}/></td>
                  <td style={{ padding: '11px 14px' }} className="smp-mono">
                    <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{r.post}</span>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-2)' }}>{r.marshal}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-2)' }}>{r.judge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
window.Secretary = Secretary;
