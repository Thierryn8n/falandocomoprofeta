'use client';

import React, { useState, useRef, useEffect } from 'react';

interface GrokVoiceInputProps {
  onSendText?: (text: string) => void;
  onSendAudio?: (audioBlob: Blob) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const GrokVoiceInput: React.FC<GrokVoiceInputProps> = ({
  onSendText,
  onSendAudio,
  disabled = false,
  isLoading = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');

  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pendingActionRef = useRef<'send' | 'cancel' | null>(null);

  // Inicia o microfone + visualizador em tempo real
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Configura AudioContext + Analyser para a animação reativa
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder para gravar o áudio
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        if (pendingActionRef.current === 'send' && onSendAudio) {
          onSendAudio(blob);
        }
        pendingActionRef.current = null;

        cleanupAudio();
      };

      recorder.start(100); // coleta dados a cada 100ms
      setIsListening(true);

      visualize();
    } catch (err) {
      console.error(err);
      alert('Não consegui acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  // Animação do waveform (8 barrinhas que reagem à sua voz)
  const visualize = () => {
    const analyser = analyserRef.current;
    if (!analyser || barRefs.current.length === 0) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const numBars = 8;
    const step = Math.floor(bufferLength / numBars);

    for (let i = 0; i < numBars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j];
      }
      const avg = sum / step;
      const height = Math.max(12, (avg / 255) * 68); // 12px a 68px

      const bar = barRefs.current[i];
      if (bar) bar.style.height = `${height}px`;
    }

    animationFrameRef.current = requestAnimationFrame(visualize);
  };

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    analyserRef.current = null;
    setIsListening(false);
  };

  const handleSendVoice = () => {
    pendingActionRef.current = 'send';
    mediaRecorderRef.current?.stop();
  };

  const handleCancelVoice = () => {
    pendingActionRef.current = 'cancel';
    mediaRecorderRef.current?.stop();
  };

  const handleSendText = () => {
    if (inputText.trim() && onSendText) {
      onSendText(inputText);
      setInputText('');
    }
  };

  // Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="w-full">
      {!isListening ? (
        /* === MODO NORMAL (igual ao Grok) === */
        <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-3xl px-4 sm:px-6 py-3 sm:py-4 shadow-2xl">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={disabled || isLoading}
            className="flex-1 bg-transparent text-white outline-none placeholder-zinc-400 text-base sm:text-lg disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          />

          {/* Botão Microfone */}
          <button
            onClick={startListening}
            disabled={disabled || isLoading}
            className="ml-2 sm:ml-4 p-2 sm:p-3 text-zinc-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
            title="Gravar áudio"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 sm:w-7 sm:h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-.5-15a3.5 3.5 0 10-7 0v4a3.5 3.5 0 007 0V6z"
              />
            </svg>
          </button>

          {/* Botão Enviar texto */}
          <button
            onClick={handleSendText}
            disabled={disabled || isLoading || !inputText.trim()}
            className="ml-2 sm:ml-3 p-2 sm:p-3 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-30"
          >
            {isLoading ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 sm:w-7 sm:h-7 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 sm:w-7 sm:h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.874L5.999 12zm0 0h7.07"
                />
              </svg>
            )}
          </button>
        </div>
      ) : (
        /* === MODO ÁUDIO (animação reativa igual ao Grok) === */
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl px-4 sm:px-8 py-6 sm:py-10 shadow-2xl flex flex-col items-center">
          {/* Waveform reativo */}
          <div className="flex items-end gap-1 sm:gap-1.5 mb-4 sm:mb-6 h-16 sm:h-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  barRefs.current[i] = el;
                }}
                className="w-3 sm:w-4 bg-gradient-to-t from-cyan-400 to-blue-500 rounded-full shadow-[0_0_12px_-2px] shadow-cyan-400 transition-all duration-75"
                style={{ height: '12px' }}
              />
            ))}
          </div>

          <p className="text-cyan-300 text-xs sm:text-sm font-semibold tracking-[2px] mb-4 sm:mb-8">
            CAPTANDO ÁUDIO...
          </p>

          {/* Botões Cancelar e Enviar */}
          <div className="flex gap-3 sm:gap-4">
            <button
              onClick={handleCancelVoice}
              className="px-6 sm:px-10 py-3 sm:py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-2xl flex items-center gap-2 transition-colors text-sm sm:text-base"
            >
              <span>Cancelar</span>
            </button>

            <button
              onClick={handleSendVoice}
              className="px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-medium rounded-2xl flex items-center gap-2 shadow-xl shadow-cyan-500/40 transition-all hover:scale-105 text-sm sm:text-base"
            >
              <span>Enviar áudio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrokVoiceInput;
