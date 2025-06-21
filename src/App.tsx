import React, { useState, useEffect } from 'react';

/* ---------- types ---------- */
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
  default?: string;
};

type Control = Slider | Options;

/* ---------- helpers ---------- */
const promptSuggestions = [
  'how to cook chicken biryani',
  'design a sci-fi city skyline',
  'generate avatar from description',
  'write a bedtime story',
  'explain quantum computing'
];

const fetchJsonSafe = async (url: string, body: any) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const type = r.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new Error(await r.text());
  return r.json();
};

const bullets = (txt: string) =>
  txt
    .split(/\r?\n/)
    .filter(Boolean)
    .map((s, i) => <li key={i}>{s.replace(/^\d+\.\s*/, '')}</li>);

/* ---------- component ---------- */
export default function App() {
  /* state */
  const [prompt,        setPrompt]        = useState('');
  const [suggestions,   setSuggestions]   = useState<string[]>([]);
  const [controls,      setControls]      = useState<Control[]>([]);
  const [values,        setValues]        = useState<(string|number)[]>([]);
  const [finalOutput,   setFinalOutput]   = useState('');
  const [loading,       setLoading]       = useState(false);
  const [dark,          setDark]          = useState(
    localStorage.getItem('vap-theme') === 'dark'
  );

  /* side-effects */
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('vap-theme', dark ? 'dark' : 'light');
  }, [dark]);

  /* event handlers */
  const handlePrompt = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setPrompt(v);
    setSuggestions(
      v.length > 2 ? promptSuggestions.filter(s => s.includes(v)) : []
    );
  };

  const generateControls = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { controls } = await fetchJsonSafe('/api/nlp-parser', { question: prompt });
      setControls(controls);
      /* init values */
      setValues(
        controls.map(c =>
          c.type === 'slider'
            ? (c as Slider).default ?? (c as Slider).min
            : (c as Options).options[(c as Options).default ?? 0]
        )
      );
      setFinalOutput('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const generateOutput = async () => {
    setLoading(true);
    try {
      const selections = controls.map((c, i) => ({
        label: c.label,
        value: values[i]
      }));
      const { output } = await fetchJsonSafe('/api/generate-final', {
        prompt,
        selections
      });
      setFinalOutput(output);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* UI */
  return (
    <main className="wrapper">
      {/* dark-mode toggle + logo */}
      <header>
        <img src={dark ? '/logo-dark.png' : '/logo-light.png'} alt="logo" />
        <button onClick={() => setDark(!dark)}>{dark ? '🌞' : '🌙'}</button>
      </header>

      <h1>Visual AI Pro V5</h1>
      <p className="tag">Bringing AI to Life Visually</p>

      {/* prompt box */}
      <textarea
        placeholder="Enter your prompt…"
        value={prompt}
        onChange={handlePrompt}
      />

      {/* auto-suggestion dropdown */}
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map(s => (
            <div
              key={s}
              onClick={() => { setPrompt(s); setSuggestions([]); }}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      <button onClick={generateControls} disabled={loading}>
        {loading ? 'Thinking…' : 'Generate Sliders'}
      </button>

      {/* controls grid */}
      {controls.length > 0 && (
        <section className="grid">
          {controls.map((c, i) =>
            c.type === 'slider' ? (
              <div key={i} className="ctrl">
                <label>{c.label}</label>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step || 1}
                  value={values[i] as number}
                  onChange={e =>
                    setValues(v =>
                      v.map((val, idx) =>
                        idx === i ? Number(e.target.value) : val
                      )
                    )
                  }
                />
                <small>{values[i]} {c.unit ?? ''}</small>
              </div>
            ) : (
              <div key={i} className="ctrl">
                <label>{c.label}</label>
                <div className="opts">
                  {c.options.map(opt => (
                    <button
                      key={opt}
                      className={opt === values[i] ? 'sel' : ''}
                      onClick={() =>
                        setValues(v => v.map((val, idx) =>
                          idx === i ? opt : val
                        ))
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </section>
      )}

      {controls.length > 0 && (
        <button onClick={generateOutput} disabled={loading} className="full">
          {loading ? 'Composing…' : 'Generate Final Prompt'}
        </button>
      )}

      {/* output */}
      {finalOutput && (
        <section className="output">
          <h3>Final Output ✨</h3>
          <ul>{bullets(finalOutput)}</ul>

          <div className="out-actions">
            <button
              onClick={() => {
                navigator.clipboard.writeText(finalOutput);
                alert('Copied!');
              }}
            >
              📋 Copy
            </button>
            <span style={{ fontSize: 24 }}>👍 👎</span>
          </div>
        </section>
      )}
    </main>
  );
}
