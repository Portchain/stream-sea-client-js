const WebSocket = require('isomorphic-ws')
import { EventEmitter } from 'events'

const PING_INTERVAL_MS = 15000 // Interval for ping messages in milliseconds

export interface IStreamSeaSocket extends EventEmitter {
  send: (m: any) => void
}

interface StreamSeaSocketOptions {
  url: string
}

interface IsomorphicWebsocket {
  onopen: null | (() => void)
  onmessage: null | ((m: MessageEvent) => void)
  onclose: null | (() => void)
  onerror: null | ((e: any) => void)
  ping?: (callback: () => void) => void
  send: (message: string) => void
}

/**
 * A StreamSeaSocket encapsulates a WebSocket with automatic ping-pong.
 *
 * Events:
 *   open
 *   message
 *   close
 *   error
 *
 * Public methods:
 *   send(message: string)
 */
export class StreamSeaSocket extends EventEmitter implements IStreamSeaSocket {
  private ws: IsomorphicWebsocket
  private heartbeatInterval?: NodeJS.Timeout
  private options: StreamSeaSocketOptions
  constructor(options: StreamSeaSocketOptions) {
    super()
    this.options = options
    this.ws = new WebSocket(this.options.url)
    this.ws.onopen = this.onWsOpen
    this.ws.onmessage = this.onWsMessage
    this.ws.onclose = this.onWsClose
    this.ws.onerror = this.onWsError
  }

  private onWsOpen = () => {
    this.heartbeatInterval = setInterval(() => {
      // this.ws.ping is available on Nodejs but not in the browser
      if (this.ws.ping){
        this.ws.ping(() => {
          return
        })
      }
    }, PING_INTERVAL_MS)
    this.emit('open')
  }

  private onWsMessage = (m: MessageEvent) => {
    // console.log('StreamSeaSocket.onWsMessage:', JSON.stringify(m, null, 4))
    this.emit('message', m)
  }

  private onWsClose = () => {
    // console.log('StreamSeaSocket.onWsClose')
    this.emit('close')
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      delete this.heartbeatInterval
    }
  }

  private onWsError = (e: any) => {
    this.emit('error', e)
  }

  public send = (message: string) => {
    // console.log('StreamSeaSocket.send', JSON.stringify(message, null, 4))
    this.ws.send(message)
  }
}

// Factory methods

export interface IStreamSeaSocketFactory {
  createSocket: (options: StreamSeaSocketOptions) => IStreamSeaSocket
}

export interface StreamSeaSocketFactoryOptions {}

export class StreamSeaSocketFactory implements IStreamSeaSocketFactory {
  private options: StreamSeaSocketFactoryOptions
  constructor(options: StreamSeaSocketFactoryOptions) {
    this.options = options
  }
  public createSocket = (options: StreamSeaSocketOptions) => {
    return new StreamSeaSocket(options)
  }
}
