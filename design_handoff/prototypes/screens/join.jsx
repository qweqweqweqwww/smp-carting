/* global React, SmpBtn, SmpPill */

// Join page — invite token redemption.
// One layout, two states (connecting and error).

function JoinPage({ dark = false, error = false }) {
  const cls = dark ? 'theme-dark smp-root' : 'smp-root';
  return (
    <div className={cls} style={{
      width: '100%', height: '100%',
      background: error ? 'var(--bg)' : 'var(--brand-600)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* subtle racing pattern lines (only on success/connecting) */}
      {!error && (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(115deg, transparent 0 28px, rgba(255,255,255,0.04) 28px 29px)',
            pointerEvents: 'none',
          }}/>
          <div style={{
            position: 'absolute', top: '-30%', right: '-30%',
            width: 540, height: 540, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}/>
        </>
      )}

      {/* Header brand mark */}
      <div style={{
        padding: '36px 28px 0',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 'var(--r-sm)',
            background: error ? 'var(--brand-500)' : 'rgba(255,255,255,0.18)',
            color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
            border: error ? 'none' : '1px solid rgba(255,255,255,0.25)',
          }}>SMP</span>
          <div>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: error ? 'var(--text)' : '#fff',
              letterSpacing: '-0.01em',
            }}>Race Control</div>
            <div style={{
              fontSize: 11, color: error ? 'var(--text-3)' : 'rgba(255,255,255,0.6)', marginTop: -1,
            }}>Picnic Karting · 2026</div>
          </div>
        </div>
      </div>

      {/* Centered content */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 28,
        position: 'relative', zIndex: 1,
      }}>
        {!error ? (
          <>
            {/* Loading visual */}
            <div style={{
              width: 110, height: 110,
              position: 'relative',
              marginBottom: 28,
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.18)',
              }}/>
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#fff',
                borderRightColor: 'rgba(255,255,255,0.6)',
                animation: 'smp-spin 1.4s linear infinite',
              }}/>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em',
              }}>M-03</div>
            </div>

            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', opacity: 0.7,
              }}>Маршал · Пост M-03</div>
              <h1 style={{
                margin: '8px 0 6px',
                fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em',
              }}>Подключаемся к&nbsp;гонке…</h1>
              <p style={{
                margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, maxWidth: 280,
              }}>
                Этап 3 · Москва · ADM Raceway. Установка приложения на главный экран.
              </p>
            </div>

            {/* Steps */}
            <div style={{
              marginTop: 32,
              width: '100%', maxWidth: 280,
              background: 'rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--r-md)',
              padding: 14,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {[
                { d: 'Проверка инвайт-токена',   s: 'done' },
                { d: 'Подключение к серверу',    s: 'doing' },
                { d: 'Загрузка профиля маршала', s: 'wait' },
              ].map(r => (
                <div key={r.d} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: r.s === 'done' ? '#fff' : 'transparent',
                    color: r.s === 'done' ? 'var(--brand-500)' : '#fff',
                    border: r.s === 'wait' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                    fontSize: 10, fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {r.s === 'done' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {r.s === 'doing' && (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#fff',
                        animation: 'smp-pulse 1.2s ease-in-out infinite',
                      }}/>
                    )}
                  </span>
                  <span style={{
                    fontSize: 12.5,
                    color: r.s === 'wait' ? 'rgba(255,255,255,0.5)' : '#fff',
                    fontWeight: r.s === 'doing' ? 600 : 500,
                  }}>{r.d}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: 28,
            maxWidth: 360, width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--r-md)',
              background: 'var(--c-emergency-bg)',
              color: 'var(--c-emergency)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid color-mix(in srgb, var(--c-emergency) 25%, transparent)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <div className="smp-eyebrow" style={{ color: 'var(--c-emergency)' }}>Ошибка входа</div>
            <h1 style={{ margin: '6px 0 8px', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)' }}>
              Ссылка недействительна
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Инвайт-токен истёк или уже был использован. Попросите организатора прислать новый.
            </p>

            <div style={{
              marginTop: 20,
              padding: '12px 14px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              fontSize: 12, color: 'var(--text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Код ошибки</span>
              <span className="smp-mono" style={{ color: 'var(--text-2)', fontWeight: 600 }}>INV_EXPIRED</span>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes smp-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

window.JoinPage = JoinPage;
