import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader } from 'lucide-react';

const Recorder = ({ apiKey, prompts, transcript, onTranscript, onSuggestions, onRecordingChange, onInterimTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  // MediaRecorder refs — for sending audio to Whisper every 30s
  const mediaRecorderRef = useRef(null);
  const chunkIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Web Speech API ref — for live real-time transcript display
  const recognitionRef = useRef(null);
  // Accumulate final segments between 30s whisper chunks
  const interimTextRef = useRef('');

  const startRecording = async () => {
    setStatus('Initializing...');
    try {
      // ── 1. Web Speech API for LIVE real-time display ──────────────
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              interimTextRef.current += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          // Stream live interim text to UI immediately
          const display = (interim || '').trim();
          onInterimTranscript?.('', display); // finalSegment not used by UI anymore
        };

        recognition.onerror = (e) => console.warn('Speech recognition error:', e.error);
        // Auto-restart if it stops (browsers stop after silence)
        recognition.onend = () => {
          if (isRecording || mediaRecorderRef.current?.state === 'recording') {
            try { recognition.start(); } catch (_) {}
          }
        };
        recognition.start();
      }

      // ── 2. MediaRecorder — sends audio to Whisper every 30s ───────
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        if (blob.size > 0) await processAudioChunk(blob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      onRecordingChange?.(true);
      setStatus('Live');

      // Every 30s: stop → onstop fires → processAudioChunk → restart
      chunkIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start(1000);
        }
      }, 30000);

    } catch (err) {
      console.error('Microphone error:', err);
      setStatus('Mic denied');
    }
  };

  const stopRecording = () => {
    if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (_) {} }
    setIsRecording(false);
    onRecordingChange?.(false);
    setStatus('');
    interimTextRef.current = '';
  };

  const processAudioChunk = async (blob) => {
    setIsProcessing(true);
    try {
      // ── Step 1: Whisper transcription (accurate, stored in transcript) ──
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      if (apiKey) formData.append('api_key', apiKey);

      const tRes = await fetch('http://localhost:8000/api/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!tRes.ok) {
        setStatus(`Transcription error ${tRes.status}`);
        // Still generate suggestions from Web Speech API text if available
        if (interimTextRef.current.trim()) {
          fetchSuggestions(interimTextRef.current);
        }
        return;
      }

      const { transcript: chunkText } = await tRes.json();
      if (chunkText) {
        onTranscript(chunkText);
        // ── Step 2: Suggestions run immediately after transcript ──
        fetchSuggestions(chunkText);
        interimTextRef.current = ''; // Reset accumulator
      }
    } catch (err) {
      console.error('Processing error:', err);
      setStatus('Error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Separated so it can be called from either Whisper or fallback
  const fetchSuggestions = async (contextText) => {
    try {
      const res = await fetch('http://localhost:8000/api/suggestions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: contextText,
          prompt_template: prompts?.suggestion,
          api_key: apiKey,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.suggestions?.length) onSuggestions(data.suggestions.slice(0, 3));
    } catch (err) {
      console.error('Suggestions error:', err);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0' }}>
      {isRecording ? (
        <button className="btn btn-stop" onClick={stopRecording} title="Stop recording">
          <Square size={20} />
        </button>
      ) : (
        <button className="btn btn-record" onClick={startRecording} title="Start recording">
          <Mic size={20} />
        </button>
      )}
      {isProcessing && (
        <Loader size={14} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
      )}
      {status && (
        <span style={{ fontSize: '0.7rem', color: isRecording ? '#4ade80' : 'var(--text-muted)' }}>
          {isRecording ? '● ' : ''}{status}
        </span>
      )}
    </div>
  );
};

export default Recorder;
