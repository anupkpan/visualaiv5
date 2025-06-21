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

/* ---------- HELPERS ---------- */
async function postJSON<T = any>(
  url: string,
  payload: Record<string, unknown>
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    throw new Error(await res.text());
  }
  return res.json();
}

const bullets = (txt: string) =>
  txt
    .replace(/\r\n|\r/g, '\n') // normalise
    .split(/\n+/)
    .filter(Boolean)
    .map(line => line.trim().replace(/^[\d\-•\*]+\s*/, '')) // strip existing markers
    .map((line, i) => <li key={i}>{line}</li>);

export default function App() {
  /* ---- state ---- */
  const [prompt, setPrompt] = useState('');
  const [autos, setAutos] = useState<string[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [vals, setVals] = useState<{ label: string; value: number | string }[]>(
    []
  );
  const [final, setFinal] = useState('');
  const [loading, setLoading] = useState<'none' | 'ctrls' | 'final'>('none');
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('vap-theme') as 'dark' | 'light') || 'dark'
  );

  const promptBox = useRef<HTMLTextAreaElement>(null);
  const suggWrap = useRef<HTMLDivElement>(null);

  /* ---- theme apply ---- */
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('vap-theme', theme);
  }, [theme]);

  /* ---- autosuggest dismiss on outside click ---- */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (
        suggWrap.current &&
        !suggWrap.current.contains(e.target as Node) &&
        !promptBox.current?.contains(e.target as Node)
      )
        setAutos([]);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* ---- handlers ---- */
  const onPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPrompt(val);

    // naive suggest
    if (val.length >= 3) {
      const low = val.toLowerCase();
      setAutos(suggestionsSeed.filter(s => s.includes(low)));
    } else setAutos([]);
  };

  const genControls = async () => {
    if (!prompt.trim()) return;
    setLoading('ctrls');
    try {
      const { controls: ctrls } = await postJSON<{ controls: Control[] }>(
        '/api/nlp-parser',
        { prompt }
      );

      setControls(ctrls);
      setVals(
        ctrls.map(c => ({
          label: c.label,
          value:
            c.type === 'slider'
              ? (c as Slider).default ?? (c as Slider).min
              : (c as Options).options[(c as Options).default ?? 0]
        }))
      );
      setFinal('');
    } catch (err: any) {
      alert(`Could not generate sliders\n${err.message}`);
    } finally {
      setLoading('none');
    }
  };

  const genFinal = async () => {
    setLoading('final');
    try {
      const json = await postJSON<any>('/api/generate-final', {
        prompt,
        selections: vals
      });
      const text = json.finalPrompt ?? json.output ?? '';
      setFinal(text);
    } catch (err: any) {
      alert(`Failed to compose final prompt\n${err.message}`);
    } finally {
      setLoading('none');
    }
  };

  /* ---- view ---- */
  return (
    <div className="outer">
      <button
        className="theme-toggle"
        onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
        title="Toggle theme"
      >
        {theme === 'dark' ? '🌞' : '🌙'}
      </button>

      <div className="branding">
        <img
          src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
          alt="Logo"
          className="logo"
        />
        <h1>Visual AI Pro V5</h1>
        <p className="tagline">Bringing AI to Life Visually</p>
      </div>

      {/* prompt */}
      <div className="prompt-wrap" ref={suggWrap}>
        <textarea
          ref={promptBox}
          placeholder="Enter your prompt…"
          value={prompt}
          onChange={onPromptChange}
        />
        {autos.length > 0 && (
          <div className="suggestions">
            {autos.map(s => (
              <div
                key={s}
                onClick={() => {
                  setPrompt(s);
                  setAutos([]);
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <button disabled={loading !== 'none'} onClick={genControls}>
        {loading === 'ctrls' ? 'Thinking…' : 'Generate Sliders'}
      </button>

      {/* sliders + options */}
      {controls.length > 0 && (
        <div className="controls-grid">
          <div className="sliders">
            {controls
              .map((c, i) => ({ c, i }))
              .filter(x => x.c.type === 'slider')
              .map(({ c, i }) => {
                const s = c as Slider;
                return (
                  <div className="control-row" key={s.label}>
                    <label>{s.label}</label>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step ?? 1}
                      value={Number(vals[i]?.value)}
                      onChange={e =>
                        setVals(v =>
                          v.map((vv, idx) =>
                            idx === i
                              ? { ...vv, value: Number(e.target.value) }
                              : vv
                          )
                        )
                      }
                    />
                    <span>
                      {vals[i]?.value} {s.unit ?? ''}
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="options">
            {controls
              .map((c, i) => ({ c, i }))
              .filter(x => x.c.type === 'options')
              .map(({ c, i }) => {
                const o = c as Options;
                return (
                  <div className="control-row" key={o.label}>
                    <label>{o.label}</label>
                    <div className="option-buttons">
                      {o.options.map(opt => {
                        const active = vals[i]?.value === opt;
                        return (
                          <button
                            key={opt}
                            className={active ? 'active' : ''}
                            onClick={() =>
                              setVals(v =>
                                v.map((vv, idx) =>
                                  idx === i ? { ...vv, value: opt } : vv
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
      )}

      {controls.length > 0 && (
        <button
          style={{ marginTop: 32 }}
          disabled={loading !== 'none'}
          onClick={genFinal}
        >
          {loading === 'final' ? 'Composing…' : 'Generate Final Prompt'}
        </button>
      )}

      {final && (
        <div className="preview">
          <h3>Final Prompt</h3>
          <ul>{bullets(final)}</ul>

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
