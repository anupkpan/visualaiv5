import React, { useState } from 'react';
import './index.css';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [controls, setControls] = useState<any[]>([]);
  const [controlValues, setControlValues] = useState<{ [key: string]: any }>({});
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const handleToggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark', !darkMode);
  };

  const handleGenerateSliders = async () => {
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }

    try {
      const res = await fetch('/api/nlp-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to generate sliders');

      setControls(data.controls);
      setControlValues(
        data.controls.reduce((acc: any, c: any) => {
          acc[c.label] = c.default;
          return acc;
        }, {})
      );
      setResult('');
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not generate sliders');
    }
  };

  const handleGenerateFinal = async () => {
    try {
      const res = await fetch('/api/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, controls: controlValues }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to generate result');

      setResult(data.result);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not generate final output');
    }
  };

  return (
    <div className="app">
      <div className="theme-toggle" onClick={handleToggleTheme}>
        {darkMode ? '🌞' : '🌙'}
      </div>

      <div className="logo-container">
        <img
          src={darkMode ? '/logo-light.png' : '/logo-dark.png'}
          alt="Logo"
          className="logo"
        />
      </div>

      <h1>Visual AI Pro V5</h1>
      <p>Bringing AI to Life Visually</p>

      <textarea
        className="prompt-box"
        placeholder="Enter your prompt…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button className="generate-btn" onClick={handleGenerateSliders}>
        Generate Sliders
      </button>

      {controls.length > 0 && (
        <div className="controls-grid">
          {controls.map((control, index) => {
            if (control.type === 'slider') {
              return (
                <div key={index} className="control">
                  <label>{control.label}: {controlValues[control.label]}</label>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={controlValues[control.label]}
                    onChange={(e) =>
                      setControlValues({ ...controlValues, [control.label]: Number(e.target.value) })
                    }
                  />
                </div>
              );
            } else if (control.type === 'options') {
              return (
                <div key={index} className="control">
                  <label>{control.label}</label>
                  <select
                    value={controlValues[control.label]}
                    onChange={(e) =>
                      setControlValues({ ...controlValues, [control.label]: e.target.value })
                    }
                  >
                    {control.options.map((opt: string) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {controls.length > 0 && (
        <button className="generate-btn" onClick={handleGenerateFinal}>
          Generate Final Prompt
        </button>
      )}

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-box">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
