import React, { useState } from 'react';
import './index.css';

const systemPrompt = `Return STRICT JSON format:
{
  "controls": [
    { "label": "...", "type": "slider", "min": 0, "max": 100, "step": 1, "default": 50, "unit": "%" },
    { "label": "...", "type": "options", "options": ["A", "B", "C"], "default": "B" }
  ]
}
Only return valid JSON. No markdown, no text. Max 6 controls.`;

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [controls, setControls] = useState<any[]>([]);
  const [values, setValues] = useState<any>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [finalOutput, setFinalOutput] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    fetch(`/api/nlp-parser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: e.target.value })
    })
      .then(res => res.json())
      .then(data => setSuggestions(data.suggestions || []));
  };

  const handleGenerateControls = async () => {
    const res = await fetch('/api/nlp-parser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    setControls(data.controls);
    const initialValues: any = {};
    data.controls.forEach((c: any) => {
      initialValues[c.label] = c.default;
    });
    setValues(initialValues);
  };

  const handleControlChange = (label: string, value: any) => {
    setValues(prev => ({ ...prev, [label]: value }));
  };

  const handleGenerateFinal = async () => {
    const res = await fetch('/api/generate-final', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, controls: values })
    });
    const data = await res.json();
    setFinalOutput(data.result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalOutput);
  };

  return (
    <div className={darkMode ? 'dark-theme' : 'light-theme'}>
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>🌓</button>
      <div className="card">
        <div className="branding">
          <img src={darkMode ? '/logo-dark.png' : '/logo-light.png'} alt="logo" className="logo" />
          <h1>Visual AI Pro V5</h1>
          <p className="tagline">Bringing AI to Life Visually</p>
        </div>

        <textarea value={prompt} onChange={handlePromptChange} placeholder="Enter your prompt..." />
        <button onClick={handleGenerateControls}>Generate Sliders</button>

        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((sug, idx) => (
              <div key={idx} onClick={() => setPrompt(sug)}>{sug}</div>
            ))}
          </div>
        )}

        {controls.length > 0 && (
          <div className="controls-grid">
            <div className="sliders">
              {controls.filter(c => c.type === 'slider').map((control, idx) => (
                <div className="control-row" key={idx}>
                  <label>{control.label}</label>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={values[control.label]}
                    onChange={(e) => handleControlChange(control.label, parseInt(e.target.value))}
                  />
                  <span>{values[control.label]} {control.unit}</span>
                </div>
              ))}
            </div>
            <div className="options">
              {controls.filter(c => c.type === 'options').map((control, idx) => (
                <div className="control-row" key={idx}>
                  <label>{control.label}</label>
                  <div className="option-buttons">
                    {control.options.map((opt: string) => (
                      <button
                        key={opt}
                        className={values[control.label] === opt ? 'active' : ''}
                        onClick={() => handleControlChange(control.label, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {controls.length > 0 && (
          <button onClick={handleGenerateFinal} style={{ marginTop: '32px' }}>
            Generate Final Prompt
          </button>
        )}

        {finalOutput && (
          <div className="preview">
            <h3>Final Output</h3>
            <pre>{finalOutput}</pre>
            <button className="copy-btn" onClick={handleCopy}>📋 Copy</button>
            <div className="feedback">
              <button title="Like">👍</button>
              <button title="Dislike">👎</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
