import React, { useEffect, useRef } from 'react';

const TranscriptPanel = ({ transcript, interimText }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  const isEmpty = transcript.length === 0 && !interimText;

  return (
    <div className="content-scroll" ref={scrollRef}>
      {isEmpty ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '2rem', fontSize: '0.875rem' }}>
          No transcript yet — start the mic.
        </div>
      ) : (
        <>
          {/* Finalized chunks from Whisper */}
          {transcript.map((item, index) => (
            <div key={index} className="transcript-chunk">
              <div className="transcript-timestamp">
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <p className="transcript-text">{item.text}</p>
            </div>
          ))}

          {/* Live interim text from Web Speech API */}
          {interimText && (
            <div className="transcript-chunk">
              <div className="transcript-timestamp" style={{ color: 'var(--accent-primary)' }}>
                ● Live
              </div>
              <p className="transcript-text transcript-live">{interimText}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TranscriptPanel;
