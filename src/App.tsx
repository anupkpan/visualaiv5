// src/App.tsx
import React, { useState } from 'react';
import './index.css';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [controls, setControls] = useState<any[]>([]);
  const [values, setValues] = useState<{ [key: string]: any }>({});
  const [result, setResult] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.className = `${newTheme}-theme`;
  };

  const fetchControls = async () => {
    const res = await fetch('/api/nlp-parser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (data?.controls) {
      setControls(data.controls);
      const initialValues: { [key: string]: any } = {};
      data.controls.forEach((c: any) => {
        initialValues[c.label] = c.default;
      });
      setValues(initialValues);
    }
  };

  const generateFinal = async () => {
    const res = await fetch('/api/generate-final', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, controls: values }),
    });
    const data = await res.json();
    setResult(data.result);
  };

  const handleChange = (label: string, value: any) => {
    setValues((prev) => ({ ...prev, [label]: value }));
  };

  const handleSuggestionClick = (s: string) => {
    setPrompt(s);
    setSuggestions([]);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  const feedback = (val: 'up' | 'down') => {
    console.log('Feedback:', val);
  };

  return (
    <div className="card">
      <button className="theme-toggle" onClick={handleThemeToggle}>
        {theme === 'dark' ? '🌞' : '🌙'}
      </button>

      <div className="branding">
        <img
          className="logo"
          src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
          alt="logo"
        />
        <h1>Visual AI Pro V5</h1>
        <p className="tagline">Bringing AI to Life Visually</p>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
      />
      <button onClick={fetchControls}>Generate Sliders</button>

      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => handleSuggestionClick(s)}>
              {s}
            </div>
          ))}
        </div>
      )}

      <div className="controls-grid">
        <div className="sliders">
          {controls
            .filter((c) => c.type === 'slider')
            .map((c) => (
              <div className="control-row" key={c.label}>
                <label>{c.label}</label>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={values[c.label]}
                  onChange={(e) => handleChange(c.label, parseInt(e.target.value))}
                />
                <span>{values[c.label] + (c.unit || '')}</span>
              </div>
            ))}
        </div>

        <div className="options">
          {controls
            .filter((c) => c.type === 'options')
            .map((c) => (
              <div className="control-row" key={c.label}>
                <label>{c.label}</label>
                <div className="option-buttons">
                  {c.options.map((opt: string) => (
                    <button
                      key={opt}
                      className={values[c.label] === opt ? 'active' : ''}
                      onClick={() => handleChange(c.label, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {controls.length > 0 && (
        <button style={{ marginTop: '24px' }} onClick={generateFinal}>
          Generate Final Prompt
        </button>
      )}

      {result && (
        <div className="preview">
          <h3>AI Output</h3>
          <p>{result}</p>
          <button className="copy-btn" onClick={copyToClipboard}>
            Copy to Clipboard
          </button>
          <div className="feedback">
            <button onClick={() => feedback('up')}>👍</button>
            <button onClick={() => feedback('down')}>👎</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
