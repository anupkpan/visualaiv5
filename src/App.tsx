import React, { useEffect, useState } from 'react';
import './index.css';

/* ---------- type helpers ---------- */
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

/* ---------- demo autocomplete ---------- */
const promptHints = [
  'how to cook chicken biryani',
  'design a sci-fi city',
  'create a fantasy forest wallpaper',
  'draw a cozy reading nook',
  'generate an avatar from description'
];

/* ---------- small helper ---------- */
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
    const msg = await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ---------- main component ---------- */
export default function App() {
  /* ui state */
  const [prompt, setPrompt] = useState('');
  const [controls, setControls] = useState<Control[]>([]);
  const [choices, setChoices] = useState<{ label: string; value: string | number }[]>([]);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('vap-theme') as 'dark' | 'light') || 'dark'
  );

  /* document side-effects */
  useEffect(() => {
    document.title = 'Visual AI Pro V5 — Bringing AI to Life Visually';
  }, []);
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('vap-theme', theme);
  }, [theme]);

  /* ---------- actions ---------- */
  async function generateSliders() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const data = await postJson<{ controls: Control[] }>('/api/nlp-parser', { prompt });
      if (!Array.isArray(data.controls)) throw new Error('Invalid slider payload');

      setControls(data.controls);

      /* default choice values */
      setChoices(
        data.controls.map((c) =>
          c.type === 'options'
            ? { label: c.label, value: c.options[c.default ?? 0] }
            : { label: c.label, value: c.default ?? c.min }
        )
      );
      setPreview('');
    } catch (err: any) {
      alert(`Could not generate sliders\n\n${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function generateFinalPrompt() {
    setLoading(true);
    try {
      const data = await postJson<any>('/api/generate-final', { prompt, selections: choices });
      setPreview(data.finalPrompt ?? data.output ?? '(no output)');
    } catch (err: any) {
      alert(`Could not generate final prompt\n\n${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- render ---------- */
  const suggestions = prompt.length > 2
    ? promptHints.filter((h) => h.toLowerCase().includes(prompt.toLowerCase()))
    : [];

  return (
    <div className="card">
      {/* theme toggle */}
      <button className="theme-toggle" onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}>
        {theme === 'dark' ? '🌞' : '🌙'}
      </button>

      {/* logo / heading */}
      <div className="branding">
        <img className="logo" src={theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'} />
        <h1>Visual AI Pro V5</h1>
        <p className="tagline">Bringing AI to Life Visually</p>
      </div>

      {/* prompt input */}
      <textarea
        placeholder="Enter your prompt…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      {!!suggestions.length && (
        <div className="suggestions">
          {suggestions.map((s) => (
            <div key={s} onClick={() => { setPrompt(s); }}>
              {s}
            </div>
          ))}
        </div>
      )}

      {/* buttons */}
      <button onClick={generateSliders} disabled={loading}>Generate Sliders</button>

      {/* controls grid */}
      {!!controls.length && (
        <div className="controls-grid">
          {/* sliders */}
          <div className="sliders">
            {controls.map((c, idx) => c.type === 'slider' && (
              <div className="control-row" key={c.label}>
                <label>{c.label}</label>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step ?? 1}
                  value={Number(choices[idx]?.value)}
                  onChange={e => setChoices(cs =>
                    cs.map((v, i) => i === idx ? { ...v, value: Number(e.target.value) } : v)
                  )}
                />
                <span>{choices[idx]?.value}{c.unit ?? ''}</span>
              </div>
            ))}
          </div>

          {/* option buttons */}
          <div className="options">
            {controls.map((c, idx) => c.type === 'options' && (
              <div className="control-row" key={c.label}>
                <label>{c.label}</label>
                <div className="option-buttons">
                  {c.options.map(opt => {
                    const active = choices[idx]?.value === opt;
                    return (
                      <button
                        key={opt}
                        className={active ? 'active' : ''}
                        onClick={() => setChoices(cs =>
                          cs.map((v, i) => i === idx ? { ...v, value: opt } : v)
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!controls.length && (
        <button style={{ marginTop: 28 }} onClick={generateFinalPrompt} disabled={loading}>
          {loading ? 'Composing…' : 'Generate Final Prompt'}
        </button>
      )}

      {/* preview area */}
      {!!preview && (
        <div className="preview">
          <h3>Final Prompt</h3>
          <ul>
            {preview
              .split(/(?:\n|•|\d+\.)\s*/)
              .filter(Boolean)
              .map((line, i) => <li key={i}>{line.trim()}</li>)}
          </ul>

          <button className="copy-btn" onClick={() => navigator.clipboard.writeText(preview)}>
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
