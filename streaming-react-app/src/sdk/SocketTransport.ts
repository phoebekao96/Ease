import socketIOClient, {Socket} from 'socket.io-client';
import {DEFAULTS, EVENT, getDefaultServerURL} from './constants';

export type SocketConnectOptions = {
  serverURL?: string;
  socketPath?: string;
  query?: Record<string, string>;
};

export default class SocketTransport {
  private socket: Socket | null = null;

  async connect(options: SocketConnectOptions): Promise<Socket> {
    const {serverURL, socketPath, query} = options;
    const url = serverURL ?? getDefaultServerURL();
    const path = socketPath ?? DEFAULTS.socketPath;

    return new Promise<Socket>((resolve, reject) => {
      const s = socketIOClient(url, {
        query,
        transports: ['websocket'],
        path,
      });

      const onConnect = () => {
        this.socket = s;
        cleanup();
        resolve(s);
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        s.off('connect', onConnect);
        s.off('connect_error', onError);
      };

      s.on('connect', onConnect);
      s.on('connect_error', onError);
    });
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  onAny(cb: (event: string, ...args: any[]) => void): void {
    this.socket?.onAny(cb);
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.socket?.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.socket?.off(event, handler);
  }

  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }
}


