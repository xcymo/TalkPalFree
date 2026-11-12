import { useCallback, useEffect, useRef, useState } from 'react';
import { pickRecorderMimeType } from '../lib/audio';
import { RECORDING } from '../config/models';

interface UseRecorderOptions {
  onComplete: (blob: Blob, durationSeconds: number) => void;
  onError: (message: string) => void;
  maxSeconds?: number;
}

export function useRecorder({ onComplete, onError, maxSeconds = RECORDING.maxSeconds }: UseRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const start = useCallback(async () => {
    if (startingRef.current || isRecording) return;
    startingRef.current = true;

    try {
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('当前浏览器不支持录音，请使用最新版 Chrome / Edge / Safari。');
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('当前浏览器不支持录音，请使用最新版 Chrome / Edge / Safari。');
      }
      if (!window.isSecureContext) {
        throw new Error('录音需要 HTTPS 或 localhost 环境，请通过 HTTPS 打开本页面。');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        clearTimer();
        releaseStream();
        const duration = (Date.now() - startedAtRef.current) / 1000;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        chunksRef.current = [];
        setIsRecording(false);
        setSeconds(0);
        if (duration < RECORDING.minSeconds || blob.size < 800) {
          onErrorRef.current('录音太短了，按住按钮多说几句再试。');
          return;
        }
        onCompleteRef.current(blob, duration);
      };

      recorder.start(150);
      startedAtRef.current = Date.now();
      setSeconds(0);
      setIsRecording(true);

      clearTimer();
      intervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAtRef.current) / 1000;
        setSeconds(elapsed);
        if (elapsed >= maxSeconds && recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, 200);
    } catch (error) {
      releaseStream();
      setIsRecording(false);
      onErrorRef.current(recordingErrorMessage(error));
    } finally {
      startingRef.current = false;
    }
  }, [clearTimer, isRecording, maxSeconds, releaseStream]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      releaseStream();
    };
  }, [clearTimer, releaseStream]);

  return { isRecording, seconds, start, stop };
}

function recordingErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return '麦克风权限被拒绝。请在浏览器地址栏的权限设置里允许麦克风后重试。';
    }
    if (error.name === 'NotFoundError') {
      return '没有找到麦克风设备，请检查设备连接。';
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return '无法开始录音，请刷新页面后重试。';
}
