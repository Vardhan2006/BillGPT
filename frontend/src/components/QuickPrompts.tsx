import React from 'react';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const PROMPTS = [
  { icon: '💻', label: 'MacBook Air M3', query: 'MacBook' },
  { icon: '🎧', label: 'Sony Headphones', query: 'Sony WH-1000XM5' },
  { icon: '📺', label: 'Samsung 65" OLED TV', query: 'Samsung' },
  { icon: '📱', label: 'iPhone 15 Pro Max', query: 'iPhone 15' },
  { icon: '🧹', label: 'Dyson V15 Vacuum', query: 'Dyson' },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  return (
    <div className="quick-prompts-container">
      {PROMPTS.map((p) => (
        <button
          key={p.label}
          type="button"
          className="prompt-pill-btn"
          onClick={() => onSelectPrompt(p.query)}
        >
          <span className="prompt-icon">{p.icon}</span>
          <span className="prompt-label">{p.label}</span>
        </button>
      ))}
    </div>
  );
};
