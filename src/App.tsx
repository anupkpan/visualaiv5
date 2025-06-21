import React, { useEffect, useRef, useState } from 'react';
import './index.css';

type Slider = {
  label: string;
  type: 'slider';
  min: number;
  max: number;
  step?: number;
  default?: number;
  unit?: string;
};
type Options = {
  label: string;
  type: 'options';
  options: string[];
  default?: number;
};
type Control = Slider | Options;

const suggestionsSeed = [
  'how to cook chicken biryani',
  'how to play football',
  'design a sci-fi city',
  'generate an avatar from description',
  'draw a cozy reading nook'
];

/* ---------- helpers ---------- */
async function postJSON<T>(
  url: string,
  payload: Record<string, unknown>
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok || !res.headers.get('content-type')?.includes('application/json'))
    throw new Error(await res.text());
  return res.json();
}
const toBullets = (txt: string) =>
  txt
    .replace(/\r\n|\r/g, '\n')
    .split(/\n+/)
    .filter(Boolean)
    .map(s => s.trim().replace(/^[\d\-•\*]+\s*/, ''))
    .map((line, i) => <li key={i}>{line}</li>);

export default function App() {
  /* ----- state ----- */
  const [prompt, setPrompt] = useState('');
  const [autos, setAutos] = useState<string[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [vals, setVals] = useState<{ label: string; value: string | number }[]>(
    []
  );
  const [final, setFinal] = useState('');
  const [loading, setLoading] = useState<'none' | 'ctrls' | 'final'>('none');
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('vap-theme') as 'dark' | 'light') || 'dark'
  );

  const promptBox = useRef<HTMLTextAreaElement>(null);
  const suggWrap = useRef<HTMLDivElement>(null);

  /* ----- theme apply ----- */
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('vap-theme', theme);
  }, [theme]);

  /* ----- click-outside to close suggestions ----- */
  useEffect(() => {
    const cb = (e: MouseEvent) => {
      if (
        suggWrap.current &&
        !suggWrap.current.contains(e.target as Node) &&
        !promptBox.current?.contains(e.target as Node)
      )
        setAutos([]);
    };
    document.addEventListener('mousedown', cb);
    return () => document.removeEventListener('mousedown', cb);
  }, []);

  /* ----- handlers ----- */
  const onPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const txt = e.target.value;
    setPrompt(txt);
    if (txt.length >= 3) {
      const low = txt.toLowerCase();
      setAutos(suggestionsSeed.filter(s => s.includes(low)));
    } else setAutos([]);
  };

  const generateControls = async () => {
    if (!prompt.trim()) return;
    setLoading('ctrls');
    try {
      const { controls: ctrls } = await postJSON<{ controls: Control[] }>(
        '/api/nlp-parser',
        { prompt }
      );
      setControls(ctrls);
      setVals(
        ctrls.map(c =>
          c.type === 'slider'
            ? {
                label: c.label,
                value: (c as Slider).default ?? (c as Slider).min
              }
            : {
                label: c.label,
                value: (c as Options).options[(c as Options).default ?? 0]
              }
        )
      );
      setFinal('');
    } catch (err: any) {
      alert('Could not generate sliders\n' + err.message);
    } finally {
      setLoading('none');
    }
  };

  const generateFinal = async () => {
    setLoading('final');
    try {
      const json = await postJSON<any>('/api/generate-final', {
        prompt,
        selections: vals
      });
      setFinal(json.finalPrompt ?? json.output ?? '');
    } catch (err: any) {
      alert('Failed to compose final prompt\n' + err.message);
    } finally {
      setLoading('none');
    }
  };

  /* ----- view ----- */
  return (
    <div className="outer">
      <button
        className="theme-toggle"
        title="Toggle theme"
        onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      >
        {theme === 'dark' ? '🌞' : '🌙'}
      </button>

      {/* branding */}
      <div className="branding">
        <img
          className="logo"
          src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
          alt="logo"
        />
        <h1>Visual AI Pro V5</h1>
        <p className="tagline">Bringing AI to Life Visually</p>
      </div>

      {/* prompt box */}
      <div className="prompt-wrap" ref={suggWrap}>
        <textarea
          ref={promptBox}
          placeholder="Enter your prompt…"
          value={prompt}
          onChange={onPromptChange}
        />
        {!!autos.length && (
          <div className="suggestions">
            {autos.map(s => (
              <div
                key={s}
                onClick={() => {
                  setPrompt(s);
                  setAutos([]);
                  promptBox.current?.focus();
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={generateControls} disabled={loading !== 'none'}>
        {loading === 'ctrls' ? 'Thinking…' : 'Generate Sliders'}
      </button>

      {/* controls grid (keeps shape even empty) */}
      <div className="controls-grid">
        {controls.length === 0 && (
          <div className="placeholder">
            Awaiting sliders/options…<br />
            Enter a prompt above and click “Generate Sliders”
          </div>
        )}

        <div className="sliders">
          {controls
            .map((c, idx) => ({ c, idx }))
            .filter(x => x.c.type === 'slider')
            .map(({ c, idx }) => {
              const s = c as Slider;
              return (
                <div className="control-row" key={s.label}>
                  <label>{s.label}</label>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step ?? 1}
                    value={Number(vals[idx]?.value)}
                    onChange={e =>
                      setVals(v =>
                        v.map((vv, i) =>
                          i === idx ? { ...vv, value: Number(e.target.value) } : vv
                        )
                      )
                    }
                  />
                  <span>
                    {vals[idx]?.value} {s.unit ?? ''}
                  </span>
                </div>
              );
            })}
        </div>

        <div className="options">
          {controls
            .map((c, idx) => ({ c, idx }))
            .filter(x => x.c.type === 'options')
            .map(({ c, idx }) => {
              const o = c as Options;
              return (
                <div className="control-row" key={o.label}>
                  <label>{o.label}</label>
                  <div className="option-buttons">
                    {o.options.map(opt => {
                      const active = vals[idx]?.value === opt;
                      return (
                        <button
                          key={opt}
                          className={active ? 'active' : ''}
                          onClick={() =>
                            setVals(v =>
                              v.map((vv, i) =>
                                i === idx ? { ...vv, value: opt } : vv
                              )
                            )
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {!!controls.length && (
        <button
          style={{ marginTop: 32 }}
          disabled={loading !== 'none'}
          onClick={generateFinal}
        >
          {loading === 'final' ? 'Composing…' : 'Generate Final Prompt'}
        </button>
      )}

      {final && (
        <div className="preview">
          <h3>Final Prompt</h3>
          <ul>{toBullets(final)}</ul>

          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(final)}
          >
            Copy
          </button>

          <div className="feedback">
            <button title="Like">👍</button>
            <button title="Dislike">👎</button>
          </div>
        </div>
      )}
    </div>
  );
}
