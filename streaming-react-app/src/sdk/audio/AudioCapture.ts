import {DEFAULTS} from '../constants';
import float32To16BitPCM from '../../float32To16BitPCM';

export type AudioCaptureOptions = {
  constraints?: MediaTrackConstraints;
  onaudio: (pcm16: Int16Array) => void;
};

export default class AudioCapture {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;

  async start(options: AudioCaptureOptions): Promise<{sampleRate: number}> {
    if (this.audioContext) {
      throw new Error('AudioCapture already started');
    }

    const constraints = options.constraints ?? DEFAULTS.audioConstraints;
    this.audioContext = new AudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({audio: constraints});
    this.mediaStream = stream;

    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    this.scriptProcessor = this.audioContext.createScriptProcessor(16384, 1, 1);

    this.scriptProcessor.onaudioprocess = (event) => {
      if (!this.audioContext) return;
      const float32Audio = event.inputBuffer.getChannelData(0);
      const pcm16 = float32To16BitPCM(float32Audio);
      options.onaudio(pcm16);
    };

    this.mediaStreamSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);

    return {sampleRate: this.audioContext.sampleRate};
  }

  stop(): void {
    if (this.mediaStreamSource && this.scriptProcessor && this.audioContext) {
      this.mediaStreamSource.disconnect(this.scriptProcessor);
      this.scriptProcessor.disconnect(this.audioContext.destination);
    }
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.scriptProcessor = null;
    this.mediaStreamSource = null;
    this.mediaStream = null;
    this.audioContext = null;
  }
}

