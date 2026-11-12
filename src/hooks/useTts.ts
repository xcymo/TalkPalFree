import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, getOrCreateTtsBlob } from '../lib/api';
import { useSettings } from './useSettings';

export type TtsStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export function useTtsPlayer() {
  const { settings } = useSettings();
  const [status, setStatus] = useState<TtsStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const sourceRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const cleanupAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    sourceRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const loadAndPlay = useCallback(
    async (text: string, voice: string) => {
      const source = `${voice}::${text}`;
      if (audioRef.current && sourceRef.current === source) {
        const audio = audioRef.current;
        if (audio.paused) {
          try {
            await audio.play();
          } catch {
            setStatus('paused');
          }
        }
        return;
      }

      setError(null);
      if (loadingRef.current) return;
      loadingRef.current = true;
      setStatus('loading');
      try {
        const blob = await getOrCreateTtsBlob(settings.apiKey, text, voice);
        if (!mountedRef.current) return;

        cleanupAudio();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = 'auto';
        urlRef.current = url;
        audioRef.current = audio;
        sourceRef.current = source;

        audio.onplay = () => setStatus('playing');
        audio.onpause = () => {
          setStatus((current) => (current === 'playing' ? 'paused' : current));
        };
        audio.onended = () => {
          audio.currentTime = 0;
          setStatus('idle');
        };
        audio.onerror = () => {
          setStatus('error');
          setError('音频播放失败，请重试。');
        };

        try {
          await audio.play();
        } catch {
          setStatus('paused');
          setError('浏览器阻止了自动播放，点击播放按钮即可收听。');
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setStatus('error');
        setError(errorMessage(err));
      } finally {
        loadingRef.current = false;
      }
    },
    [cleanupAudio, settings.apiKey],
  );

  const toggle = useCallback(
    async (text: string, voice: string) => {
      if (!text.trim()) return;
      const source = `${voice}::${text}`;
      const audio = audioRef.current;

      if (audio && sourceRef.current === source) {
        if (audio.paused) {
          setError(null);
          try {
            await audio.play();
          } catch {
            setStatus('paused');
            setError('播放失败，请重试。');
          }
        } else {
          audio.pause();
        }
        return;
      }

      await loadAndPlay(text, voice);
    },
    [loadAndPlay],
  );

  return { status, error, toggle };
}
