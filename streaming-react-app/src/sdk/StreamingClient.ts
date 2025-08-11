import SocketTransport from './SocketTransport';
import {DEFAULTS, EVENT, getDefaultServerURL} from './constants';
import type {
  EventMap,
  StreamingClientOptions,
  StreamingStatus,
  ServerStateUpdate,
  TranslationTextEvent,
  TranslationSpeechEvent,
  Unsubscribe,
} from './types';
import type {RoomState} from './types';
import AudioCapture from './audio/AudioCapture';
import {createBufferedSpeechPlayer} from './audio/BufferedSpeechPlayer';

type Listener<T> = (payload: T) => void;

export default class StreamingClient {
  private socket = new SocketTransport();
  private audio = new AudioCapture();
  private player = createBufferedSpeechPlayer({});
  private listeners: {[K in keyof EventMap]?: Array<EventMap[K]>} = {};

  private options: Required<StreamingClientOptions> = {
    serverURL: getDefaultServerURL(),
    socketPath: DEFAULTS.socketPath,
    outputMode: DEFAULTS.outputMode,
    bufferLimit: DEFAULTS.bufferLimit,
    audioConstraints: DEFAULTS.audioConstraints,
  };

  private clientID: string | null = null;
  private modelName: string | null = null;
  private roomID: string | null = null;
  private status: StreamingStatus = 'idle';
  private targetLanguage: string | null = null;
  private lastSampleRate: number | null = null;
  private wasDisconnected: boolean = false;

  constructor(opts?: StreamingClientOptions) {
    this.options = {...this.options, ...(opts ?? {})};
  }

  on<K extends keyof EventMap>(event: K, handler: EventMap[K]): Unsubscribe {
    const list = (this.listeners[event] ?? []) as Array<EventMap[K]>;
    list.push(handler);
    this.listeners[event] = list as any;
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: EventMap[K]): void {
    const list = (this.listeners[event] ?? []) as Array<EventMap[K]>;
    this.listeners[event] = list.filter((h) => h !== handler) as any;
  }

  private emit<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>) {
    const list = (this.listeners[event] ?? []) as Array<(payload: any) => void>;
    for (const h of list) h(...(args as any));
  }

  private setStatus(s: StreamingStatus) {
    this.status = s;
    this.emit('status', s);
  }

  isConnected(): boolean {
    return this.status === 'connected' || this.status === 'running' || this.status === 'stopped';
  }

  isStreaming(): boolean {
    return this.status === 'running';
  }

  currentTargetLanguage(): string | null {
    return this.targetLanguage;
  }

  async init(): Promise<void> {
    this.clientID = crypto.randomUUID();
    const socket = await this.socket.connect({
      serverURL: this.options.serverURL,
      socketPath: this.options.socketPath,
      query: {clientID: this.clientID},
    });

    this.registerSocketHandlers();
    this.setStatus('connected');

    await new Promise<void>((resolve) => {
      socket.emit(
        EVENT.joinRoom,
        this.clientID,
        null,
        {roles: ['speaker', 'listener'], lockServerName: null},
        (result: {roomID: string}) => {
          this.roomID = result.roomID;
          resolve();
        },
      );
    });
  }

  async setTargetLanguage(code: string): Promise<void> {
    this.targetLanguage = code;
    this.socket.emit(EVENT.setDynamicConfig, {targetLanguage: code}, () => {});
  }

  async start(): Promise<void> {
    if (!this.clientID) throw new Error('init() must be called first');
    this.player.start();

    const {sampleRate} = await this.audio.start({
      constraints: this.options.audioConstraints,
      onaudio: (pcm16) => this.socket.emit(EVENT.incomingAudio, pcm16),
    });
    this.lastSampleRate = sampleRate;

    // Wait for server capabilities to pick a model name
    if (!this.modelName) {
      await new Promise<void>((resolve) => {
        const unsub = this.on('capabilities', (caps) => {
          const first = caps?.[0] ?? null;
          if (first) {
            if (!this.modelName) this.modelName = first.name;
            unsub();
            resolve();
          }
        });
      });
    }

    if (!this.targetLanguage) throw new Error('Target language must be set before start()');

    await new Promise<void>((resolve) => {
      this.socket.emit(
        EVENT.setDynamicConfig,
        {targetLanguage: this.targetLanguage, expressive: null},
        () => resolve(),
      );
    });

    await new Promise<void>((resolve, reject) => {
      this.socket.emit(
        EVENT.configureStream,
        {
          model_name: this.modelName,
          debug: false,
          async_processing: true,
          buffer_limit: this.options.bufferLimit,
          model_type: this.options.outputMode,
          rate: sampleRate,
        },
        (statusObject: {status: 'ok' | 'error'; message?: string}) => {
          if (statusObject.status === 'ok') {
            resolve();
          } else {
            reject(new Error(statusObject.message ?? 'configure_stream failed'));
          }
        },
      );
    });

    this.setStatus('running');
  }

  async stop(): Promise<void> {
    // Make stop idempotent: always try to clean up, regardless of current status
    try {
      // Send a tiny zero-length frame to help drain any residual server buffers
      this.socket.emit(EVENT.incomingAudio, new Int16Array(1));
    } catch {}

    // Stop local playback and capture first to immediately release user media
    try {
      this.player.stop();
    } catch {}
    try {
      this.audio.stop();
    } catch {}

    // Ask server to stop; wait briefly for acknowledgement, but do not block UI
    await new Promise<void>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve();
        }
      }, 500);
      try {
        this.socket.emit(EVENT.stopStream, () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve();
          }
        });
      } catch {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve();
        }
      }
    });

    this.setStatus('stopped');
  }

  destroy(): void {
    if (this.isStreaming()) this.stop();
    this.socket.disconnect();
    this.listeners = {} as any;
    this.clientID = null;
    this.roomID = null;
    this.modelName = null;
    this.targetLanguage = null;
    this.setStatus('disconnected');
  }

  private registerSocketHandlers(): void {
    const s = this.socket;

    const onServerState = (state: ServerStateUpdate) => {
      const first = state.agentsCapabilities?.[0] ?? null;
      if (first && !this.modelName) this.modelName = first.name;
      this.emit('capabilities', state.agentsCapabilities ?? []);
      if (state.serverLock?.isActive && state.serverLock.clientID && state.serverLock.clientID !== this.clientID) {
        if (this.isStreaming()) {
          this.stop();
          this.emit('preempted');
        }
      }
    };

    s.on(EVENT.serverStateUpdate, onServerState);

    // Connection lifecycle handlers for reconnect
    const sock = this.socket.getSocket();
    sock?.on('disconnect', () => {
      this.wasDisconnected = true;
      this.setStatus('disconnected');
    });
    sock?.on('connect', () => {
      if (this.wasDisconnected) {
        this.wasDisconnected = false;
        this.setStatus('connected');
        if (this.isStreaming()) {
          const lang = this.targetLanguage;
          const sr = this.lastSampleRate;
          const model = this.modelName;
          if (lang) this.socket.emit(EVENT.setDynamicConfig, {targetLanguage: lang, expressive: null}, () => {});
          if (model && sr) {
            this.socket.emit(
              EVENT.configureStream,
              {
                model_name: model,
                debug: false,
                async_processing: true,
                buffer_limit: this.options.bufferLimit,
                model_type: this.options.outputMode,
                rate: sr,
              },
              () => {},
            );
          }
        }
      }
    });

    s.on(EVENT.roomStateUpdate, (room: RoomState) => {
      this.emit('room', room);
    });

    s.on(EVENT.translationText, (data: TranslationTextEvent) => {
      if (data?.payload) this.emit('text', data.payload);
    });

    s.on(EVENT.translationSpeech, (data: TranslationSpeechEvent) => {
      if (data?.payload && typeof data.sample_rate === 'number') {
        this.player.addAudioToBuffer(data.payload, data.sample_rate);
        this.emit('speech', data.payload, data.sample_rate);
      }
    });
  }
}


