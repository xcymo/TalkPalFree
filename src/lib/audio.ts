/** Convert a recorded Blob into a 16 kHz mono PCM WAV, which is what MiMo ASR accepts. */
export async function convertToWav(blob: Blob, targetSampleRate = 16_000): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextClass =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('当前浏览器不支持音频处理，请升级浏览器后重试。');
  }

  const context = new AudioContextClass();
  let decoded: AudioBuffer;
  try {
    decoded = await context.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    throw new Error('无法读取录音格式，请使用最新版 Chrome / Edge / Safari 重试。');
  } finally {
    void context.close().catch(() => undefined);
  }

  const channels = decoded.numberOfChannels;
  const mono = new Float32Array(decoded.length);
  for (let channel = 0; channel < channels; channel += 1) {
    const data = decoded.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      mono[i] += data[i] / channels;
    }
  }

  const samples =
    decoded.sampleRate === targetSampleRate
      ? mono
      : resampleLinear(mono, decoded.sampleRate, targetSampleRate);

  return encodeWav(trimSilence(samples, targetSampleRate), targetSampleRate);
}

/**
 * 裁掉首尾静音，避免 ASR 把静音/底噪识别成数字或时间戳。
 * 保留少量前后余量，并在边界做 5ms 淡入淡出，防止裁切产生爆音。
 */
function trimSilence(samples: Float32Array, sampleRate: number): Float32Array {
  const threshold = 0.012;
  let start = 0;
  while (start < samples.length && Math.abs(samples[start]) < threshold) start += 1;
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) < threshold) end -= 1;
  if (end <= start) return samples;

  const from = Math.max(0, start - Math.round(sampleRate * 0.12));
  const to = Math.min(samples.length, end + Math.round(sampleRate * 0.18));
  const trimmed = samples.slice(from, to);

  const fade = Math.min(Math.round(sampleRate * 0.005), Math.floor(trimmed.length / 2));
  for (let i = 0; i < fade; i += 1) {
    const gain = i / fade;
    trimmed[i] *= gain;
    trimmed[trimmed.length - 1 - i] *= gain;
  }
  return trimmed;
}

function resampleLinear(input: Float32Array, sourceRate: number, targetRate: number): Float32Array {
  const ratio = sourceRate / targetRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const position = i * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const fraction = position - left;
    output[i] = input[left] * (1 - fraction) + input[right] * fraction;
  }
  return output;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result);
    };
    reader.onerror = () => reject(new Error('音频编码失败，请重试。'));
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const pure = base64.includes(',') ? base64.slice(base64.indexOf(',') + 1) : base64;
  const binary = atob(pure);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

/** 我们发出的 WAV 固定为 16kHz 单声道 16-bit PCM，44 字节头。 */
export function getWavDurationSeconds(blob: Blob, sampleRate = 16_000): number {
  const dataBytes = Math.max(0, blob.size - 44);
  return dataBytes / (sampleRate * 2);
}
