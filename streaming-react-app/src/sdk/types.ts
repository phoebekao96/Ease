export type StreamingStatus = 'idle' | 'connected' | 'running' | 'stopped' | 'disconnected';

export type StreamingClientOptions = {
  serverURL?: string;
  socketPath?: string;
  outputMode?: 's2s&t' | 's2t' | 's2s';
  bufferLimit?: number;
  audioConstraints?: MediaTrackConstraints;
};

export type ServerLockInfo = {
  name: string | null;
  clientID: string | null;
  isActive: boolean;
} | null;

export type AgentsCapabilities = Array<{
  name: string;
  description: string;
  modalities: Array<'s2t' | 's2s'>;
  targetLangs: Array<string>;
  dynamicParams: Array<'targetLanguage' | 'expressive'>;
}>;

export type ServerStateUpdate = {
  agentsCapabilities: AgentsCapabilities;
  serverLock: ServerLockInfo;
};

export type RoomState = {
  activeTranscoders: number;
  room_id: string;
  members: Array<{
    client_id: string;
    session_id: string;
    name: string;
    connection_status: 'connected' | 'disconnected';
  }>;
  listeners: Array<string>;
  speakers: Array<string>;
};

export type TranslationTextEvent = {
  payload: string;
  eos?: boolean;
};

export type TranslationSpeechEvent = {
  payload: Array<number>;
  sample_rate: number;
  eos?: boolean;
};

export type EventMap = {
  text: (payload: string) => void;
  speech: (samples: Array<number>, sampleRate: number) => void;
  status: (status: StreamingStatus) => void;
  preempted: () => void;
  error: (e: Error) => void;
  capabilities: (caps: AgentsCapabilities) => void;
  room: (room: RoomState) => void;
};

export type Unsubscribe = () => void;


