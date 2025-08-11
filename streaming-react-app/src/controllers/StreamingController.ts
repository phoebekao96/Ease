import {StreamingClient} from '@/sdk'

type Unsubscribe = () => void

export type StreamingControllerStatus = 'idle' | 'connected' | 'running' | 'stopped' | 'disconnected'

type TargetLang = 'eng' | 'cmn' | 'spa'

type ControllerEventMap = {
  status: (s: StreamingControllerStatus) => void
  text: (t: string) => void
  preempted: () => void
}

export class StreamingController {
  private client: StreamingClient | null = null
  private targetLanguage: TargetLang | null = null
  private unsubscribers: Unsubscribe[] = []
  private listeners: {[K in keyof ControllerEventMap]?: Array<ControllerEventMap[K]>} = {}

  on<K extends keyof ControllerEventMap>(event: K, handler: ControllerEventMap[K]): Unsubscribe {
    const list = (this.listeners[event] ?? []) as Array<ControllerEventMap[K]>
    list.push(handler)
    this.listeners[event] = list as any
    return () => this.off(event, handler)
  }

  off<K extends keyof ControllerEventMap>(event: K, handler: ControllerEventMap[K]): void {
    const list = (this.listeners[event] ?? []) as Array<ControllerEventMap[K]>
    this.listeners[event] = list.filter((h) => h !== handler) as any
  }

  private emit<K extends keyof ControllerEventMap>(event: K, ...args: Parameters<ControllerEventMap[K]>) {
    const list = (this.listeners[event] ?? []) as Array<(payload: any) => void>
    for (const h of list) h(...(args as any))
  }

  async init(initialTarget?: TargetLang): Promise<void> {
    if (this.client) return
    const client = new StreamingClient()
    this.client = client

    const unsubStatus = client.on('status', (s) => this.emit('status', s as StreamingControllerStatus))
    const unsubText = client.on('text', (t) => this.emit('text', t))
    const unsubPreempt = client.on('preempted', () => this.emit('preempted'))
    this.unsubscribers.push(unsubStatus, unsubText, unsubPreempt)

    await client.init()

    if (initialTarget) {
      await this.setTargetLanguage(initialTarget)
    } else if (this.targetLanguage) {
      await this.setTargetLanguage(this.targetLanguage)
    }
  }

  async setTargetLanguage(code: TargetLang): Promise<void> {
    this.targetLanguage = code
    if (!this.client) return
    await this.client.setTargetLanguage(code)
  }

  async start(): Promise<void> {
    if (!this.client) throw new Error('init() must be called first')
    if (!this.targetLanguage) throw new Error('Target language must be set before start()')
    await this.client.start()
  }

  async stop(): Promise<void> {
    if (!this.client) return
    await this.client.stop()
  }

  destroy(): void {
    for (const unsub of this.unsubscribers) {
      try {
        unsub()
      } catch {}
    }
    this.unsubscribers = []
    if (this.client) {
      try {
        this.client.destroy()
      } catch {}
    }
    this.client = null
  }
}


