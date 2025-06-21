import React, { useState, useEffect } from 'react';

type Slider = {
  label: string; type: 'slider'; min: number; max: number;
  step?: number; default?: number; unit?: string;
};
type Options = {
  label: string; type: 'options'; options: string[]; default?: number;
};
type Control = Slider | Options;

const suggestions = [
  'how to cook chicken biryani',
  'design a sci-fi city',
  'draw a cozy reading nook',
  'generate an avatar from description',
  'plan a surprise birthday party'
];

// Convert paragraphs → list items, keep numbering tidy
const toBullets = (txt: string) =>
  txt
    .replace(/(\r?\n)+/g, ' ')           // single line
    .replace(/(\d+)\.\s+/g, '\n$1\t')    // “1. ” → newline + tab
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map((s, i) => <li key={i}>{s}</li>);

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [controls, setControls] = useState<Control[]>([]);
  const [sel, setSel] = useState<{ label: string; value: string | number }[]>([]);
  const [output, setOutput] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('vap-theme') as 'dark' | 'light') || 'light'
  );
  const [filtered, setFiltered] = useState<string[]>([]);

  /* ---------- theme ---------- */
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    localStorage.setItem('vap-theme', theme);
  }, [theme]);

  /* ---------- prompt input ---------- */
  const onPrompt = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setPrompt(v);
    setFiltered(v.length > 2 ? suggestions.filter(s => s.toLowerCase().includes(v.toLowerCase())) : []);
  };

  /* ---------- fetch controls ---------- */
  const getControls = async () => {
    if (!prompt.trim()) return;
    setErr(''); setOutput(''); setLoading(true);
    try {
      const r = await fetch('/api/nlp-parser', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const j = await r.json();
      if (!j.controls?.length) throw new Error('No controls returned');
      setControls(j.controls);
      setSel(j.controls.map((c: any) => ({
        label: c.label,
        value: c.type === 'options' ? c.options[c.default ?? 0] : c.default ?? c.min
      })));
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  /* ---------- generate output ---------- */
  const genOutput = async () => {
    setErr(''); setOutput(''); setLoading(true);
    try {
      const r = await fetch('/api/generate-final', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, selections: sel })
      });
      const j = await r.json();
      if (!j.output) throw new Error('Empty response');
      setOutput(j.output);
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="card">
      {/* theme toggle */}
      <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? '🌞' : '🌙'}
      </button>

      {/* logo + heading */}
      <div className="branding">
        <picture>
          <source srcSet="/logo-light.png" media="(prefers-color-scheme: dark)" />
          <img src="/logo-dark.png" className="logo" alt="logo" />
        </picture>
        <h1>Visual AI Pro V5</h1>
        <p>Bringing AI to Life Visually</p>
      </div>

      {/* prompt box */}
      <textarea value={prompt} onChange={onPrompt} placeholder="Enter your prompt…" />
      {filtered.length > 0 && (
        <div className="suggestions">
          {filtered.map(s => (
            <div key={s} onClick={() => { setPrompt(s); setFiltered([]); }}>{s}</div>
          ))}
        </div>
      )}

      {/* generate sliders btn */}
      <button onClick={getControls} disabled={loading}>{loading ? 'Thinking…' : 'Generate Sliders'}</button>

      {/* sliders & option buttons */}
      {controls.length > 0 && (
        <div className="controls-grid">
          {/* sliders */}
          {controls.map((c, i) =>
            c.type === 'slider' ? (
              <div className="control-row" key={c.label}>
                <label>{c.label}</label>
                <input
                  type="range" min={c.min} max={c.max} step={c.step ?? 1}
                  value={sel[i]?.value as number}
                  onChange={e =>
                    setSel(p => p.map((s, j) => j === i ? { ...s, value: Number(e.target.value) } : s))
                  }
                />
                <span>{sel[i]?.value}{c.unit ?? ''}</span>
              </div>
            ) : (
              <div className="control-row" key={c.label}>
                <label>{c.label}</label>
                <div className="option-buttons">
                  {c.options.map(opt => (
                    <button
                      key={opt}
                      className={sel[i]?.value === opt ? 'active' : ''}
                      onClick={() =>
                        setSel(p => p.map((s, j) => j === i ? { ...s, value: opt } : s))
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
          <button onClick={genOutput} disabled={loading}>
            {loading ? 'Composing…' : 'Generate Final Prompt'}
          </button>
        </div>
      )}

      {err && <div className="error">{err}</div>}

      {output && (
        <div className="preview">
          <h3>Final Output</h3>
          <ul>{toBullets(output)}</ul>
        </div>
      )}
    </div>
  );
}
