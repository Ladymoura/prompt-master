export type Status = 'idle' | 'vragen' | 'schrijven'

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': { status: Status }
  }
}
