/* global React, SmpBtn, SmpPill, SmpWave, SmpIcons */

// Marshal Record page — iPhone-format
// V1: refined of the existing layout
// V2: bottom-sheet rework with waveform + post compass

const I = window.SmpIcons;

// Shared header (status strip + race meta)
function MarshalHeader({ name = 'М. Иванов', post = 'М-03', race = 'Москва · Этап 3', emergency }) {
  return (
    <div style={{
      padding: '14px 18px 16px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            color: 'var(--brand-500)',
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
          }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            SMP Race Control
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="smp-dot smp-pulse" style={{ color: 'var(--c-success)', width: 7, height: 7 }}/>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>В&nbsp;эфире</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="smp-label">МАРШАЛ · ПОСТ {post}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em', marginTop: 2 }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{race}</div>
        </div>
        {emergency && <SmpPill tone="danger">EMERGENCY</SmpPill>}
      </div>
    </div>
  );
}

// — VARIANT 1 — Refined existing flow ───────────────────────────
function MarshalV1({ state = 'idle', dark = false, emergency = false }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text)',
    }}>
      <MarshalHeader emergency={emergency}/>

      {/* Emergency toggle */}
      <div style={{ padding: '14px 18px 0' }}>
        <button style={{
          width: '100%',
          padding: '11px',
          background: emergency ? 'var(--c-emergency)' : 'transparent',
          color: emergency ? '#fff' : 'var(--c-emergency)',
          border: `1.5px solid ${emergency ? 'transparent' : 'color-mix(in srgb, var(--c-emergency) 35%, transparent)'}`,
          borderRadius: 'var(--r-md)',
          fontWeight: 700, fontSize: 12, letterSpacing: '0.08em',
          textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <span className="smp-dot" style={{ color: emergency ? '#fff' : 'var(--c-emergency)', width: 7, height: 7 }}/>
          {emergency ? 'Аварийный режим включён' : 'Аварийный режим'}
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {state === 'idle' && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Удерживайте, чтобы записать</span>
              <div style={{ position: 'relative' }}>
                {/* outer halo */}
                <div style={{
                  position: 'absolute', inset: -22, borderRadius: '50%',
                  background: 'radial-gradient(circle, color-mix(in srgb, var(--brand-500) 18%, transparent) 0%, transparent 70%)',
                }}/>
                <button style={{
                  width: 200, height: 200, borderRadius: '50%',
                  background: 'var(--brand-500)',
                  border: 'none',
                  boxShadow: 'var(--shadow-brand)',
                  color: '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                  cursor: 'pointer', position: 'relative',
                }}>
                  {I.mic(36)}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Push&nbsp;to&nbsp;talk
                  </span>
                </button>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                fontSize: 11, color: 'var(--text-3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="smp-mono smp-tnum" style={{ fontWeight: 600, color: 'var(--text-2)' }}>03</span>
                  <span>отправлено</span>
                </div>
                <span style={{ width: 1, height: 12, background: 'var(--border)' }}/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="smp-mono smp-tnum" style={{ fontWeight: 600, color: 'var(--text-2)' }}>14:32</span>
                  <span>сейчас</span>
                </div>
              </div>
            </div>
          </>
        )}

        {state === 'recording' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="smp-dot smp-pulse" style={{ color: 'var(--c-emergency)', width: 10, height: 10 }}/>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-emergency)', letterSpacing: '-0.005em' }}>
                Идёт запись
              </span>
              <span className="smp-mono smp-tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>0:04</span>
            </div>
            <div style={{ color: 'var(--c-emergency)' }}>
              <SmpWave bars={20} height={48} w={4} gap={3} animated/>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -10, borderRadius: '50%',
                border: '2px solid color-mix(in srgb, var(--c-emergency) 35%, transparent)',
                animation: 'smp-pulse 1.4s ease-in-out infinite',
              }}/>
              <button style={{
                width: 200, height: 200, borderRadius: '50%',
                background: 'var(--c-emergency)',
                border: 'none', color: '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                position: 'relative',
              }}>
                {I.mic(36)}
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Отпустите
                </span>
              </button>
            </div>
          </div>
        )}

        {state === 'confirming' && (
          <ConfirmPanel/>
        )}
      </div>
    </div>
  );
}

function ConfirmPanel() {
  return (
    <div style={{
      width: '100%',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: 18,
      boxShadow: 'var(--shadow-md)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div>
        <div className="smp-label" style={{ marginBottom: 4 }}>ПОДТВЕРДИТЕ ИНЦИДЕНТ</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          Проверьте данные
        </div>
      </div>

      <div style={{
        padding: '10px 12px',
        background: 'var(--surface-2)',
        borderLeft: '3px solid var(--brand-500)',
        borderRadius: 6,
        fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5,
        fontStyle: 'italic',
      }}>
        «Седьмой и двадцать третий, контакт на четвёртом повороте»
      </div>

      <div>
        <div className="smp-label" style={{ marginBottom: 5 }}>НОМЕРА ПИЛОТОВ</div>
        <div style={{
          padding: '10px 14px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18,
          color: 'var(--text)',
          letterSpacing: '0.04em',
        }}>07, 23</div>
      </div>

      <div>
        <div className="smp-label" style={{ marginBottom: 5 }}>ТИП НАРУШЕНИЯ</div>
        <div style={{
          padding: '10px 14px',
          background: 'var(--surface-2)',
          border: '1px solid var(--brand-500)',
          borderRadius: 'var(--r-md)',
          fontSize: 13.5, color: 'var(--text)',
          boxShadow: '0 0 0 3px color-mix(in srgb, var(--brand-500) 16%, transparent)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Столкновение</span>
          <span style={{ color: 'var(--text-3)' }}>▾</span>
        </div>
      </div>

      <div>
        <div className="smp-label" style={{ marginBottom: 5 }}>МЕСТО</div>
        <div style={{
          padding: '10px 14px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          fontSize: 13.5, color: 'var(--text)',
        }}>Поворот 4</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <SmpBtn variant="secondary" size="lg" full>Перезаписать</SmpBtn>
        <SmpBtn variant="primary" size="lg" full icon={I.check(16)}>Отправить</SmpBtn>
      </div>
    </div>
  );
}

window.MarshalV1 = MarshalV1;

// — VARIANT 2 — Single column with bottom sheet, waveform-first ──
function MarshalV2({ state = 'recording', dark = false }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text)',
      position: 'relative',
    }}>
      {/* Compact header */}
      <div style={{
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 'var(--r-sm)',
            background: 'var(--brand-500)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}>M3</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.005em' }}>
              Пост М-03 · Поворот 4
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>М. Иванов · в эфире 42 мин</div>
          </div>
        </div>
        <button style={{
          width: 28, height: 28, borderRadius: 'var(--r-sm)',
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-3)',
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
        }}>⋯</button>
      </div>

      {/* Hero: race timer + queue */}
      <div style={{
        margin: '0 18px',
        padding: 16,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div className="smp-label">ВРЕМЯ ГОНКИ</div>
          <div className="smp-mono smp-tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', marginTop: 2 }}>
            00:42:08
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="smp-label">ОТПРАВЛЕНО</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
            <span className="smp-mono smp-tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--brand-500)' }}>03</span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>/&nbsp;инц.</span>
          </div>
        </div>
      </div>

      {/* Recording area */}
      <div style={{
        flex: 1,
        margin: '20px 18px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: state === 'confirming' ? 'flex-start' : 'center',
        gap: 24,
        paddingBottom: state === 'confirming' ? 0 : 24,
      }}>
        {state !== 'confirming' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {state === 'recording' ? (
                <>
                  <span className="smp-dot smp-pulse" style={{ color: 'var(--c-emergency)', width: 9, height: 9 }}/>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--c-emergency)' }}>Запись</span>
                  <span className="smp-mono smp-tnum" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)' }}>0:06</span>
                </>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Нажмите и держите</span>
              )}
            </div>

            {/* Waveform stage */}
            <div style={{
              width: '100%',
              padding: '20px 12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: state === 'recording' ? 'var(--c-emergency)' : 'var(--brand-500)',
            }}>
              <SmpWave bars={40} height={56} w={3} gap={2} animated={state === 'recording'}/>
            </div>

            {/* PTT */}
            <button style={{
              width: 168, height: 168, borderRadius: '50%',
              background: state === 'recording' ? 'var(--c-emergency)' : 'var(--brand-500)',
              border: 'none', color: '#fff',
              boxShadow: state === 'recording'
                ? '0 6px 24px color-mix(in srgb, var(--c-emergency) 45%, transparent)'
                : 'var(--shadow-brand)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', position: 'relative',
            }}>
              {state === 'recording' && (
                <span style={{
                  position: 'absolute', inset: -12, borderRadius: '50%',
                  border: '2px solid color-mix(in srgb, #fff 30%, transparent)',
                  animation: 'smp-pulse 1.2s ease-in-out infinite',
                }}/>
              )}
              {I.mic(38)}
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {state === 'recording' ? 'Отпустите' : 'Удерживайте'}
              </span>
            </button>

            {/* Emergency toggle inline */}
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid color-mix(in srgb, var(--c-emergency) 35%, transparent)',
              color: 'var(--c-emergency)',
              borderRadius: 999,
              fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>
              <span className="smp-dot" style={{ color: 'var(--c-emergency)', width: 6, height: 6 }}/>
              Аварийный режим
            </button>
          </>
        )}

        {state === 'confirming' && (
          <div style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: 18,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="smp-label">ИНЦИДЕНТ &nbsp;·&nbsp; ЧЕРНОВИК</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3, letterSpacing: '-0.01em' }}>
                  Проверьте перед отправкой
                </div>
              </div>
              <span className="smp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>0:06</span>
            </div>

            {/* Audio + transcript */}
            <div style={{
              padding: 12,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <button style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--brand-500)', color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', flexShrink: 0,
              }}>{I.play(12)}</button>
              <div style={{ flex: 1, color: 'var(--brand-500)' }}>
                <SmpWave bars={22} height={22} w={2.5} gap={2}/>
              </div>
            </div>

            <blockquote style={{
              margin: 0,
              fontSize: 12.5, color: 'var(--text-2)',
              fontStyle: 'italic', lineHeight: 1.5,
            }}>
              «Седьмой и двадцать третий, контакт на четвёртом повороте»
            </blockquote>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div className="smp-label" style={{ marginBottom: 4 }}>ПИЛОТЫ</div>
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--brand-500)',
                  borderRadius: 'var(--r-sm)',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
                }}>07, 23</div>
              </div>
              <div>
                <div className="smp-label" style={{ marginBottom: 4 }}>МЕСТО</div>
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                }}>Пов.&nbsp;4</div>
              </div>
            </div>

            <div>
              <div className="smp-label" style={{ marginBottom: 4 }}>НАРУШЕНИЕ</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Столкновение', 'Срез', 'Фальстарт', 'Блокировка', 'Опасно'].map((t, i) => (
                  <span key={t} style={{
                    padding: '6px 10px',
                    fontSize: 11.5, fontWeight: 600,
                    background: i === 0 ? 'var(--brand-500)' : 'var(--surface-2)',
                    color: i === 0 ? '#fff' : 'var(--text-2)',
                    border: `1px solid ${i === 0 ? 'transparent' : 'var(--border)'}`,
                    borderRadius: 999,
                  }}>{t}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <SmpBtn variant="secondary" size="lg" full>Перезаписать</SmpBtn>
              <SmpBtn variant="primary" size="lg" full icon={I.check(16)}>Отправить</SmpBtn>
            </div>
          </div>
        )}
      </div>

      {/* Bottom safe area */}
      <div style={{ height: 30 }}/>
    </div>
  );
}

window.MarshalV2 = MarshalV2;
