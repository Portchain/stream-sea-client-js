import WebSocket from 'ws'
import { EventEmitter } from "events";

const PING_INTERVAL_MS = 15000 // Interval for ping messages in milliseconds

export interface IStreamSeaSocket extends EventEmitter {
  send: (m: any) => void
}

export class StreamSeaSocket extends EventEmitter implements IStreamSeaSocket {
  private ws: WebSocket
  private heartbeatInterval?: NodeJS.Timeout
  constructor(url: string){
    super()
    this.ws = new WebSocket(url)
    this.ws.on('open', this.onWsOpen)
    this.ws.on('message', this.onWsMessage)
    this.ws.on('close', this.onWsClose)
    this.ws.on('error', this.onWsError)
  }
  
  private onWsOpen = () => {
    this.heartbeatInterval = setInterval(() => {
      this.ws.ping(() => {return;})
    }, PING_INTERVAL_MS)
    this.emit('open')
  }

  private onWsMessage = (m: any) => {
    this.emit('message', m)
  }
  
  private onWsClose = () => {
    this.emit('close')
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      delete this.heartbeatInterval
    }
  }

  private onWsError = (e: any) => {
    this.emit('error', e)
  }

  public send = (m: any) => {
    this.ws.send(m)
  }
}