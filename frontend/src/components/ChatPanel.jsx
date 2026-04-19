import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatPanel = ({ history, setHistory, transcript, apiKey, prompts }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // When a suggestion is clicked, it's appended to history with isSuggestion=true
  // This effect fires the AI expansion automatically
  useEffect(() => {
    const last = history[history.length - 1];
    if (last?.role === 'user' && last?.isSuggestion && !isTyping) {
      handleQuery(last.content, true);
    }
  }, [history.length]); // Triggered only when a new message arrives

  const handleQuery = async (query, isFromSuggestion = false) => {
    setIsTyping(true);
    try {
      const res = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: history
            .filter(m => !m.isSuggestion)
            .map(({ role, content }) => ({ role, content })),
          context: transcript,
          query,
          prompt_template: isFromSuggestion ? prompts?.detailed : prompts?.chat,
          api_key: apiKey,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ answer: `Server error ${res.status}` }));
        setHistory(prev => [...prev, { role: 'assistant', content: err.error || `Error ${res.status}` }]);
        return;
      }

      const data = await res.json();
      if (data.answer) {
        setHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'assistant', content: `Network error: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;
    setHistory(prev => [...prev, { role: 'user', content: text }]);
    handleQuery(text, false);
    setInput('');
  };

  // Visible messages: show all assistant messages + user messages that are NOT hidden suggestion triggers
  const visible = history.filter(m => m.role === 'assistant' || !m.isSuggestion ? true : false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="content-scroll chat-messages" ref={scrollRef}>
        {visible.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '2rem', fontSize: '0.875rem' }}>
            Click a suggestion or type a question below.
          </div>
        ) : (
          visible.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role === 'assistant' ? 'message-ai' : 'message-user'}`}>
              {msg.role === 'assistant'
                ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                : msg.content}
            </div>
          ))
        )}
        {isTyping && (
          <div className="chat-message message-ai" style={{ opacity: 0.5, letterSpacing: '0.1em' }}>···</div>
        )}
      </div>

      <div className="chat-input-bar">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            className="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question about the conversation..."
          />
          <button type="submit" className="btn btn-send" disabled={isTyping}>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
