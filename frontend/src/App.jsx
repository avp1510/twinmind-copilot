import React, { useState } from 'react';
import './styles/global.css';
import Recorder from './components/Recorder';
import TranscriptPanel from './components/TranscriptPanel';
import SuggestionsPanel from './components/SuggestionsPanel';
import ChatPanel from './components/ChatPanel';
import SettingsPanel from './components/SettingsPanel';
import { Settings, Download } from 'lucide-react';
import { API_BASE_URL } from './config';

const DEFAULT_PROMPTS = {
  suggestion: `You are a focused meeting assistant. Based on the transcript, return exactly 3 useful, specific suggestions for the listener. 

Rules:
- ONE sentence each, max 15 words.
- Specific to current topic (no generic advice).
- Format ONLY as a JSON array of strings: ["...", "...", "..."]`,

  detailed: `You are a helpful meeting assistant. Provide a clear, readable summary or expansion of the suggested topic based on the transcript.

Format:
- Use 3-5 concise bullet points.
- Use plain, professional English.
- Avoid technical jargon, code, or math unless essential.`,

  chat: `You are a real-time meeting assistant. Answer the user's question using the meeting transcript as context.
Be direct, specific, and grounded in what was said.`,
};

const DEFAULT_CONTEXT_WINDOWS = { suggestion: 10, detailed: 20 };

function App() {
  const [transcript, setTranscript] = useState([]);
  const [interimText, setInterimText] = useState(''); // Live Web Speech API text
  const [suggestionBatches, setSuggestionBatches] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [contextWindows, setContextWindows] = useState(DEFAULT_CONTEXT_WINDOWS);

  const handleNewTranscript = (text) => {
    setTranscript(prev => [...prev, { text, timestamp: new Date() }]);
    setInterimText(''); // CRITICAL: Clear live text immediately when final arrives
  };

  // onInterimTranscript: (finalSegment, currentInterim)
  const handleInterimTranscript = (finalSegment, currentInterim) => {
    // Only show currentInterim to avoid ghosting old 'final' segments
    // from the speech API that haven't been 'Whisper-finalized' yet.
    setInterimText(currentInterim || '');
  };

  const handleNewSuggestions = (suggestions) => {
    setSuggestionBatches(prev => [{ suggestions, timestamp: new Date() }, ...prev]);
  };

  const handleManualRefresh = async () => {
    const recentChunks = transcript.slice(-contextWindows.suggestion);
    const context = recentChunks.map(t => t.text).join('\n\n');
    if (!context && !interimText) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/suggestions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: context || interimText, prompt_template: prompts.suggestion, api_key: apiKey }),
      });
      const data = await res.json();
      if (data.suggestions) handleNewSuggestions(data.suggestions);
    } catch (err) {
      console.error('Manual refresh error:', err);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setChatHistory(prev => [...prev, { role: 'user', content: suggestion, isSuggestion: true }]);
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      transcript: transcript.map(t => ({ timestamp: t.timestamp, text: t.text })),
      suggestionBatches: suggestionBatches.map(b => ({ timestamp: b.timestamp, suggestions: b.suggestions })),
      chatHistory: chatHistory.filter(m => !m.isSuggestion).map(({ role, content }) => ({ role, content })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twinmind-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      {showSettings && (
        <SettingsPanel
          apiKey={apiKey}
          setApiKey={(key) => { setApiKey(key); localStorage.setItem('groq_api_key', key); }}
          prompts={prompts}
          setPrompts={setPrompts}
          contextWindows={contextWindows}
          setContextWindows={setContextWindows}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Column 1: Mic & Transcript ── */}
      <div className="column">
        <div className="column-header">
          <div className="header-info">
            <span className="column-number">1.</span>
            <span className="column-title">Mic & Transcript</span>
          </div>
          <span className={`status-label ${isRecording ? 'recording' : ''}`}>
            {isRecording ? '● LIVE' : 'IDLE'}
          </span>
        </div>

        <div style={{ padding: '0 1.5rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Recorder
            apiKey={apiKey}
            prompts={prompts}
            contextWindows={contextWindows}
            transcript={transcript}
            onTranscript={handleNewTranscript}
            onSuggestions={handleNewSuggestions}
            onRecordingChange={setIsRecording}
            onInterimTranscript={handleInterimTranscript}
          />
          <button className="btn btn-icon" onClick={() => setShowSettings(true)} title="Settings">
            <Settings size={16} />
          </button>
        </div>

        <TranscriptPanel transcript={transcript} interimText={interimText} />
      </div>

      {/* ── Column 2: Live Suggestions ── */}
      <div className="column">
        <div className="column-header">
          <div className="header-info">
            <span className="column-number">2.</span>
            <span className="column-title">Live Suggestions</span>
          </div>
          <span className="status-label">{suggestionBatches.length} BATCHES</span>
        </div>

        <div style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid var(--border-color)' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleManualRefresh}>
            ↺ Reload suggestions
          </button>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>auto every 30s</span>
        </div>

        <SuggestionsPanel batches={suggestionBatches} onSuggestionClick={handleSuggestionClick} />

        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleExport}>
            <Download size={14} /> Export Session (JSON)
          </button>
        </div>
      </div>

      {/* ── Column 3: Chat ── */}
      <div className="column">
        <div className="column-header">
          <div className="header-info">
            <span className="column-number">3.</span>
            <span className="column-title">Chat — Detailed Answers</span>
          </div>
          <span className="status-label">SESSION-ONLY</span>
        </div>

        <ChatPanel
          history={chatHistory}
          setHistory={setChatHistory}
          transcript={transcript.slice(-contextWindows.detailed).map(t => t.text).join('\n\n')}
          apiKey={apiKey}
          prompts={prompts}
        />
      </div>
    </div>
  );
}

export default App;
