export type BufferedSpeechPlayer = {
  addAudioToBuffer: (samples: Array<number>, sampleRate: number) => void;
  setGain: (gain: number) => void;
  start: () => void;
  stop: () => void;
};

// Thin wrapper to keep SDK self-contained while reusing logic
export {default as createBufferedSpeechPlayer} from '../../createBufferedSpeechPlayer';


