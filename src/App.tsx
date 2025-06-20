import React, { useState, useEffect } from 'react';

type Control =
  | { label: string; type: 'slider'; min: number; max: number; step?: number; default?: number; unit?: string }
  | { label: string; type: 'options'; options: string[]; default?: number };

const promptSuggestions = [
  'how to cook chicken curry',
  'design a sci-fi city',
  'create a fantasy forest wallpaper',
  'draw a cozy reading nook',
  'generate an avatar from description'
];

const toBullets = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map((s) => s.trim())
    .map((s, i) => <li key={i}>{s}</li>);

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [selections, setSelections] = useState<{ label: string; value: string | number }[]>([]);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('vap-theme') as 'dark' | 'light') || 'light'
  );

  useEffect(() => {
    document.title = 'Visual AI Pro V5 — Bringing AI to Life Visually';
  }, []);

  useEffect(() => {
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
    localStorage.setItem('vap-theme', theme);
  }, [theme]);

  const onPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    setPrompt(input);
    setFilteredSuggestions(
      input.length > 2
        ? promptSuggestions.filter((s) => s.toLowerCase().includes(input.toLowerCase()))
        : []
    );
  };

  const fetchControls = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/nlp-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setControls(data.controls);
      setSelections(
        data.controls.map((c: Control) => ({
          label: c.label,
          value:
            c.type === 'options'
              ? c.options[(c as any).default ?? 0]
              : (c as any).default ?? (c as any).min
        }))
      );
      setFinalPrompt('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const composePrompt = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, selections })
      });
      const data = await res.json();
      setFinalPrompt(data.finalPrompt);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <button
        aria-label="Toggle theme"
        className="theme-toggle"
        onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      >
        {theme === 'dark' ? '🌞' : '🌙'}
      </button>

      <div className="branding">
        <img
          src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
          alt="Visual AI Logo"
          className="logo"
        />
        <h1>Visual AI Pro V5</h1>
        <p className="tagline">Bringing AI to Life Visually</p>
      </div>

      <textarea
        placeholder="Enter your prompt..."
        value={prompt}
        onChange={onPromptChange}
      />

      {filteredSuggestions.length > 0 && (
        <div className="suggestions">
          {filteredSuggestions.map((s, i) => (
            <div key={i} onClick={() => {
              setPrompt(s);
              setFilteredSuggestions([]);
            }}>
              {s}
            </div>
          ))}
        </div>
      )}

      <button disabled={loading} onClick={fetchControls}>
        {loading ? 'Thinking…' : 'Generate Sliders'}
      </button>

      {/* Grid layout split */}
      <div className="controls-grid">
        <div className="sliders">
          {controls
            .map((ctrl, idx) => ({ ctrl, idx }))
            .filter(({ ctrl }) => ctrl.type === 'slider')
            .map(({ ctrl, idx }) => (
              <div className="control-row" key={ctrl.label}>
                <label>{ctrl.label}</label>
                <input
                  type="range"
                  min={ctrl.min}
                  max={ctrl.max}
                  step={ctrl.step ?? 1}
                  value={Number(selections[idx]?.value)}
                  onChange={(e) =>
                    setSelections((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, value: Number(e.target.value) } : s))
                    )
                  }
                />
                <span>{selections[idx]?.value} {ctrl.unit ?? ''}</span>
              </div>
            ))}
        </div>

        <div className="options">
          {controls
            .map((ctrl, idx) => ({ ctrl, idx }))
            .filter(({ ctrl }) => ctrl.type === 'options')
            .map(({ ctrl, idx }) => (
              <div className="control-row" key={ctrl.label}>
                <label>{ctrl.label}</label>
                <div className="option-buttons">
                  {ctrl.options.map((opt) => {
                    const active = selections[idx]?.value === opt;
                    return (
                      <button
                        key={opt}
                        className={active ? 'active' : ''}
                        onClick={() =>
                          setSelections((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, value: opt } : s))
                          )
                        }
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

      {controls.length > 0 && (
        <button style={{ marginTop: '28px' }} disabled={loading} onClick={composePrompt}>
          {loading ? 'Composing…' : 'Generate Final Prompt'}
        </button>
      )}

      {finalPrompt && (
        <div className="preview">
          <h3>Final Prompt</h3>
          <ul>{toBullets(finalPrompt)}</ul>
          <button className="copy-btn" onClick={() => navigator.clipboard.writeText(finalPrompt)}>
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
