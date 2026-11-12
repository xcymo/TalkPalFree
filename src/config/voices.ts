export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  language: 'en' | 'zh';
}

/**
 * MiMo built-in voices. To add a voice, append an entry here — the settings
 * dropdown, TTS cache keys and playback all read from this list.
 */
export const VOICES: VoiceOption[] = [
  { id: 'Mia', name: 'Mia', description: '明亮、年轻的英文女声', language: 'en' },
  { id: 'Chloe', name: 'Chloe', description: '温暖、有质感的英文女声', language: 'en' },
  { id: 'Milo', name: 'Milo', description: 'Energetic、亲切的英文男声', language: 'en' },
  { id: 'Dean', name: 'Dean', description: '低沉、有说服力的英文男声', language: 'en' },
  { id: '冰糖', name: '冰糖', description: '清甜中文女声（MiMo 默认）', language: 'zh' },
  { id: '茉莉', name: '茉莉', description: '柔和中文女声', language: 'zh' },
  { id: '苏打', name: '苏打', description: '清爽中文男声', language: 'zh' },
  { id: '白桦', name: '白桦', description: '沉稳中文男声', language: 'zh' },
];

export const DEFAULT_VOICE = 'Mia';

export function getVoice(id: string): VoiceOption {
  return VOICES.find((voice) => voice.id === id) ?? VOICES[0];
}
