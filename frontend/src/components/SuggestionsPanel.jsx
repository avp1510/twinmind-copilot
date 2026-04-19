import React from 'react';
import { Sparkles, HelpCircle, Lightbulb, CheckCircle } from 'lucide-react';

// Position 0 = question, 1 = talking point, 2 = answer/fact
const CARD_ICONS = [
  { icon: HelpCircle, color: '#60a5fa', label: 'Question' },   // blue
  { icon: Lightbulb,  color: '#c084fc', label: 'Talking Point' }, // purple
  { icon: CheckCircle, color: '#4ade80', label: 'Answer / Fact' }, // green
];

const SuggestionsPanel = ({ batches, onSuggestionClick }) => {
  if (batches.length === 0) {
    return (
      <div className="content-scroll" style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '2rem', fontSize: '0.875rem' }}>
        Suggestions appear here once recording starts.
      </div>
    );
  }

  return (
    <div className="content-scroll">
      {batches.map((batch, bIndex) => (
        <div key={bIndex} className={`suggestion-batch ${bIndex > 0 ? 'older' : ''}`}>
          <div className="batch-header">
            <Sparkles size={12} />
            {batch.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {bIndex === 0 && <span style={{ color: 'var(--accent-primary)' }}>· Latest</span>}
          </div>

          {batch.suggestions.map((suggestion, sIndex) => {
            const meta = CARD_ICONS[sIndex] || CARD_ICONS[2];
            const Icon = meta.icon;
            return (
              <div
                key={sIndex}
                className="suggestion-card"
                onClick={() => onSuggestionClick(suggestion)}
                style={{ borderLeftColor: meta.color }}
              >
                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                  <Icon size={14} style={{ color: meta.color, flexShrink: 0, marginTop: '3px' }} />
                  <span>{suggestion}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SuggestionsPanel;
