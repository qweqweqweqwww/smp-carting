/* global React */

// ────────────────────────────────────────────────────────────────
// Foundations artboard — colors, type, surfaces, status
// Designed to be ~1240 wide so it sits comfortably on canvas.
// ────────────────────────────────────────────────────────────────

function Swatch({ name, value, hex, sub, big = false, dark = false }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{
        height: big ? 96 : 64,
        background: value,
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{name}</span>
        <span className="smp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{hex}</span>
      </div>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
    </div>
  );
}

function FoundationCard({ title, eyebrow, children, span = 1 }) {
  return (
    <div style={{
      gridColumn: `span ${span}`,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: 24,
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="smp-eyebrow">{eyebrow}</span>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Foundations({ dark = false }) {
  const cls = dark ? 'theme-dark smp-root' : 'smp-root';

  return (
    <div className={cls} style={{
      width: 1240,
      padding: 40,
      background: 'var(--bg)',
      minHeight: 1640,
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <span className="smp-eyebrow">Foundations · {dark ? 'Dark' : 'Light'}</span>
          <h1 style={{
            margin: '6px 0 0',
            fontSize: 36, fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}>
            SMP Race Control
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 14 }}>
            Дизайн-токены — цвет, типографика, пространство, поверхности
          </p>
        </div>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '6px 12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
        }}>
          <span className="smp-dot" style={{ color: 'var(--brand-500)' }}/>
          <span className="smp-label">v1.0 · 2026</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 20,
      }}>
        {/* Brand scale (full width) */}
        <FoundationCard span={12} eyebrow="01 · Accent" title="Brand · #2B87F7">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 10 }}>
            {[50,100,200,300,400,500,600,700,800,900].map(n => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{
                  height: 72,
                  background: `var(--brand-${n})`,
                  borderRadius: 'var(--r-sm)',
                  border: n <= 100 ? '1px solid var(--border)' : 'none',
                  position: 'relative',
                }}>
                  {n === 500 && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      fontSize: 9, fontWeight: 700, color: '#fff',
                      letterSpacing: '0.08em',
                    }}>BASE</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{n}</span>
                </div>
              </div>
            ))}
          </div>
        </FoundationCard>

        {/* Surfaces */}
        <FoundationCard span={6} eyebrow="02 · Surfaces" title="Поверхности">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <Swatch name="bg" hex="var" value="var(--bg)" sub="базовый фон"/>
            <Swatch name="bg-elev" hex="var" value="var(--bg-elev)" sub="приподнятая зона"/>
            <Swatch name="surface" hex="var" value="var(--surface)" sub="карточки"/>
            <Swatch name="surface-2" hex="var" value="var(--surface-2)" sub="вложенные блоки"/>
            <Swatch name="border" hex="var" value="var(--border)" sub="разделители"/>
            <Swatch name="border-strong" hex="var" value="var(--border-strong)" sub="контурные"/>
          </div>
        </FoundationCard>

        {/* Status */}
        <FoundationCard span={6} eyebrow="03 · Status" title="Сигнальные цвета">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Emergency', use: 'Аварийный инцидент, штраф', c: 'var(--c-emergency)', bg: 'var(--c-emergency-bg)' },
              { name: 'Warning',   use: 'Предупреждение, ожидание', c: 'var(--c-warning)',   bg: 'var(--c-warning-bg)' },
              { name: 'Success',   use: 'Принято, активная гонка',  c: 'var(--c-success)',   bg: 'var(--c-success-bg)' },
            ].map(s => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 14px',
                background: s.bg,
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
              }}>
                <span className="smp-dot" style={{ color: s.c, width: 10, height: 10 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{s.use}</div>
                </div>
                <span className="smp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>--c-{s.name.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </FoundationCard>

        {/* Typography */}
        <FoundationCard span={7} eyebrow="04 · Type" title="Inter · JetBrains Mono">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Display · 36/700',   fs: 36, fw: 800, t: 'Инцидент #042', ls: '-0.02em' },
              { label: 'H1 · 24/700',        fs: 24, fw: 700, t: 'Лента инцидентов', ls: '-0.015em' },
              { label: 'H2 · 18/600',        fs: 18, fw: 600, t: 'Команда гонки', ls: '-0.01em' },
              { label: 'Body · 15/500',      fs: 15, fw: 500, t: 'Пилот 7 заблокировал пилота 23 на повороте 4', ls: '-0.005em' },
              { label: 'Caption · 12/500',   fs: 12, fw: 500, t: 'Получено в 14:32:08', ls: '0' },
              { label: 'Label · 11/600 caps', fs: 11, fw: 600, t: 'ПОСТ · М-03', ls: '0.08em', upper: true },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <span className="smp-mono" style={{
                  width: 150, flexShrink: 0,
                  fontSize: 10.5, color: 'var(--text-3)',
                }}>{r.label}</span>
                <span style={{
                  fontSize: r.fs, fontWeight: r.fw, color: 'var(--text)',
                  letterSpacing: r.ls,
                  textTransform: r.upper ? 'uppercase' : 'none',
                }}>{r.t}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--divider)', margin: '4px 0' }}/>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span className="smp-mono" style={{ width: 150, flexShrink: 0, fontSize: 10.5, color: 'var(--text-3)' }}>
                Mono · 28/700
              </span>
              <span className="smp-mono smp-tnum" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
                #07 · #23 · 14:32:08
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              Mono — для номеров пилотов, ID инцидентов, тайминга. tabular-nums везде в табличных контекстах.
            </div>
          </div>
        </FoundationCard>

        {/* Radii + Spacing */}
        <FoundationCard span={5} eyebrow="05 · Geometry" title="Радиусы и шаг">
          <div>
            <div className="smp-label" style={{ marginBottom: 8 }}>Радиусы</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { n: 'xs', v: 4 },{ n: 'sm', v: 6 },{ n: 'md', v: 10 },{ n: 'lg', v: 14 },{ n: 'xl', v: 20 },
              ].map(r => (
                <div key={r.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  <div style={{
                    width: '100%', height: 56,
                    background: 'var(--brand-500)',
                    borderRadius: r.v,
                  }}/>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{r.n}</div>
                  <div className="smp-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{r.v}px</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="smp-label" style={{ marginBottom: 8 }}>Шаг (4-base)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              {[4,8,12,16,20,24,32,40,48].map(s => (
                <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: s, height: s,
                    background: 'var(--brand-500)',
                    opacity: 0.85,
                    borderRadius: 2,
                  }}/>
                  <span className="smp-mono" style={{ fontSize: 9.5, color: 'var(--text-3)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="smp-label" style={{ marginBottom: 8 }}>Тени</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { n: 'sm', v: 'var(--shadow-sm)' },
                { n: 'md', v: 'var(--shadow-md)' },
                { n: 'lg', v: 'var(--shadow-lg)' },
              ].map(s => (
                <div key={s.n} style={{
                  height: 56,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  boxShadow: s.v,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
                }}>{s.n}</div>
              ))}
            </div>
          </div>
        </FoundationCard>

        {/* Voice / brand expression */}
        <FoundationCard span={12} eyebrow="06 · Tone of voice" title="Голос интерфейса">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {[
              {
                t: 'Технично',
                d: 'Короткие фразы, маршальский протокол. «Пост М-03», «Инцидент #042», «Пилот 7».',
              },
              {
                t: 'Спокойно',
                d: 'Никаких восклицаний и эмодзи. Цвет несёт нагрузку — красный только для аварий.',
              },
              {
                t: 'Числа на месте',
                d: 'Цифры — JetBrains Mono с tabular-nums. Время и номера всегда выровнены.',
              },
            ].map(c => (
              <div key={c.t} style={{
                padding: 14,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: 'var(--brand-500)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 12 }}>/</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.t}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{c.d}</p>
              </div>
            ))}
          </div>
        </FoundationCard>
      </div>
    </div>
  );
}

window.Foundations = Foundations;
