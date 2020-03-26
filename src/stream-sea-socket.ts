const WebSocket = require('isomorphic-ws')
import { EventEmitter } from 'events'

export interface IStreamSeaSocket extends EventEmitter {
  send: (m: any) => void
  close: () => void
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
  close: () => void
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
    this.emit('open')
  }

  private onWsMessage = (m: MessageEvent) => {
    // console.log('StreamSeaSocket.onWsMessage:', JSON.stringify(m, null, 4))
    this.emit('message', m)
  }

  private onWsClose = () => {
    // console.log('StreamSeaSocket.onWsClose')
    this.emit('close')
  }

  private onWsError = (e: any) => {
    this.emit('error', e)
  }

  public send = (message: string) => {
    // console.log('StreamSeaSocket.send', JSON.stringify(message, null, 4))
    this.ws.send(message)
  }

  public close = () => {
    this.ws.close()
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
