export const EVENT = {
  joinRoom: 'join_room',
  serverId: 'server_id',
  serverStateUpdate: 'server_state_update',
  roomStateUpdate: 'room_state_update',
  translationText: 'translation_text',
  translationSpeech: 'translation_speech',
  configureStream: 'configure_stream',
  setDynamicConfig: 'set_dynamic_config',
  incomingAudio: 'incoming_audio',
  stopStream: 'stop_stream',
} as const;

export const DEFAULTS = {
  socketPath: '/ws/socket.io',
  bufferLimit: 1,
  outputMode: 's2s&t' as const,
  audioConstraints: {
    echoCancellation: false,
    noiseSuppression: true,
    channelCount: 1,
  } as MediaTrackConstraints,
};

export function getDefaultServerURL(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}`;
}


