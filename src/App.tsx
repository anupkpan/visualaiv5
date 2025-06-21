import React, { useState } from "react";
import "./index.css";

const SUGGESTIONS = [
  "how to cook chicken biryani",
  "how to play football",
  "how to write a resume",
  "how to build a website",
];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  return (
    <div className="card">
      <button
        className="theme-toggle"
        onClick={() =>
          document.body.classList.toggle("dark-theme") ||
          document.body.classList.toggle("light-theme")
        }
      >
        🌗
      </button>

      <div className="branding">
        <img src="/logo-dark.png" alt="Logo" className="logo" />
        <h1>Visual AI Pro V5</h1>
        <p className="tagline">Bringing AI to Life Visually</p>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onFocus={() => setSuggestionsVisible(true)}
        onBlur={() => setTimeout(() => setSuggestionsVisible(false), 200)}
        placeholder="Enter your prompt…"
      />

      {suggestionsVisible && (
        <div className="suggestions">
          {SUGGESTIONS.map((s, i) => (
            <div key={i} onClick={() => setPrompt(s)}>
              {s}
            </div>
          ))}
        </div>
      )}

      {/* You can insert Generate Sliders, controls, and final output here later */}
    </div>
  );
}
