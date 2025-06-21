import React, { useState, useEffect } from 'react';

type Control =
  | {
      label: string;
      type: 'slider';
      min: number;
      max: number;
      step?: number;
      default?: number;
      unit?: string;
    }
  | {
      label: string;
      type: 'options';
      options: string[];
      default?: number;
    };

const suggestions = [
  'how to cook chicken biryani',
  'generate a cover letter',
  'design a fantasy castle',
  'draw a cyberpunk city',
  'plan a surprise birthday party'
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [controls, setControls] = useState<Control[]>([]);
  const [selections, setSelections] = useState<{ label: string; value: number | string }[]>([]);
  const [finalOutput, setFinalOutput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);
    if (value.length > 2) {
      const matches = suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
      setFiltered(matches);
    } else {
      setFiltered([]);
    }
  };

  const fetchControls = async () => {
    if (!prompt.trim()) return;
    setError('');
    setFinalOutput('');
    setControls([]);
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
        data.controls.map((ctrl: any) => ({
          label: ctrl.label,
          value: ctrl.type === 'options'
            ? ctrl.options[ctrl.default ?? 0]
            : ctrl.default ?? ctrl.min
        }))
      );
    } catch (err: any) {
      setError('Failed to generate sliders.');
    } finally {
      setLoading(false);
    }
  };

  const generateOutput = async () => {
    setError('');
    setFinalOutput('');
    setLoading(true);

    try {
      const res = await fetch('/api/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, selections })
      });
      const data = await res.json();
      let output = data.output || '';
      setFinalOutput(output);
    } catch (err: any) {
      setError('Failed to generate final output.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '720px', margin: '0 auto', padding: '32px' }}>
      {/* LOGO */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <picture>
          <source srcSet="/logo-light.png" media="(prefers-color-scheme: dark)" />
          <img src="/logo-dark.png" alt="Visual AI Logo" style={{ height: '64px', borderRadius: '12px' }} />
        </picture>
        <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Visual AI Pro V5</h1>
        <p style={{ color: '#666', fontSize: '1rem' }}>Bringing AI to Life Visually</p>
      </div>

      {/* INPUT */}
      <textarea
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Enter your prompt..."
        style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
      />
      {filtered.length > 0 && (
        <div style={{ background: '#f1f1f1', marginTop: '8px', padding: '8px', borderRadius: '8px' }}>
          {filtered.map((s, i) => (
            <div
              key={i}
              style={{ padding: '6px', cursor: 'pointer' }}
              onClick={() => {
                setPrompt(s);
                setFiltered([]);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchControls}
        disabled={loading}
        style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '8px', background: '#111', color: 'white' }}
      >
        {loading ? 'Thinking…' : 'Generate Sliders'}
      </button>

      {controls.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          {controls.map((ctrl, i) => (
            <div key={ctrl.label} style={{ marginBottom: '24px' }}>
              <label>{ctrl.label}</label>
              {ctrl.type === 'slider' ? (
                <div>
                  <input
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step ?? 1}
                    value={selections[i]?.value as number}
                    onChange={(e) =>
                      setSelections((prev) =>
                        prev.map((s, j) =>
                          i === j ? { ...s, value: Number(e.target.value) } : s
                        )
                      )
                    }
                    style={{ width: '100%' }}
                  />
                  <div>{selections[i]?.value} {ctrl.unit ?? ''}</div>
                </div>
              ) : (
                <div>
                  {ctrl.options.map((opt) => {
                    const isActive = selections[i]?.value === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() =>
                          setSelections((prev) =>
                            prev.map((s, j) =>
                              i === j ? { ...s, value: opt } : s
                            )
                          )
                        }
                        style={{
                          margin: '6px 6px 0 0',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #888',
                          background: isActive ? '#111' : '#eee',
                          color: isActive ? 'white' : 'black'
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={generateOutput}
            disabled={loading}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: '#333',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Generating…' : 'Generate Final Prompt'}
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: 'red', marginTop: '16px' }}>{error}</div>
      )}

      {finalOutput && (
        <div style={{ marginTop: '32px', background: '#f5f5f5', padding: '20px', borderRadius: '12px', whiteSpace: 'pre-line' }}>
          <h3>Final Output</h3>
          <p>{finalOutput}</p>
        </div>
      )}
    </div>
  );
}
