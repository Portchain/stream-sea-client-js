import { EventEmitter } from "events";
import { StreamSeaSubscription } from "./stream-sea-subscription";
import WebSocket from 'ws'
const logger = require('logacious')()
// States:
//   init
//   authenticating
//   open
//   closed

// Events:
//   close
//   error

// Public methods:
//   addSubscription(streamName: string): IStreamSeaSubscription

const PING_INTERVAL_MS = 15000 // Interval for ping messages in milliseconds

// Factory methods

export interface IStreamSeaConnectionFactory {
  createConnection: (options: StreamSeaConnectionOptions) => IStreamSeaConnection
}

export interface StreamSeaConnectionFactoryOptions {

}

export class StreamSeaConnectionFactory implements IStreamSeaConnectionFactory {
  private options: StreamSeaConnectionFactoryOptions
  constructor(options: StreamSeaConnectionFactoryOptions){
    this.options = options
  }
  public createConnection = (options: StreamSeaConnectionOptions) => {
    return new StreamSeaConnection(options)
  }
}

// Stream methods

interface PromiseProxy {
  reject: (err: any) => void
  resolve: (msg?: any) => void
}

export interface IStreamSeaConnection extends EventEmitter {
  addSubscription: (subscription: StreamSeaSubscription) => void
}

export interface StreamSeaConnectionOptions {
  url: string
  appId: string
  appSecret: string
}

type WebSocketWithMaybeHeartbeat = WebSocket & {heartbeatInterval?: any}
enum StreamSeaConnectionStatus {
  init = 'init',
  open = 'open',
  closed = 'closed',
}
export class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
  private msgCnt: number = 0
  private status: StreamSeaConnectionStatus = StreamSeaConnectionStatus.init
  private subscriptions: Array<{msgId: number | null, isReady: boolean; subscription: StreamSeaSubscription}> = []
  private messagesCallbacks: Map<number, PromiseProxy | null> = new Map<number, PromiseProxy | null>()
  private ws: WebSocketWithMaybeHeartbeat
  private options: StreamSeaConnectionOptions
  constructor(options: StreamSeaConnectionOptions){
    super()
    this.options = options
    this.ws = new WebSocket(options.url)
    this.ws.on('open', this.onWsOpen)
    this.ws.on('message', this.onWsMessage)
    this.ws.on('close', this.onWsClose)
    this.ws.on('error', this.onWsError)
  }

  private onWsOpen = () => {
    this.ws.heartbeatInterval = setInterval(() => {
      this.ws.ping(() => {return;})
    }, PING_INTERVAL_MS)
    
    this.send('authenticate', {
      username: this.options.appId,
      password: this.options.appSecret,
    })
    .then(() => {
      this.status = StreamSeaConnectionStatus.open
    })
    .catch(err => {
      this.emit('error', err)
    })
  }

  private onWsMessage = (msgStr: string) => {
    try {
      const msg = JSON.parse(msgStr)
      if (!msg.id) {
        const errMessage = `Server sends a message without an id ${JSON.stringify(msg)}`
        logger.error(errMessage)
        this.emit('error', errMessage)
      } else {
        if (this.messagesCallbacks.has(msg.id) && this.messagesCallbacks.get(msg.id) === null) {
          if (msg.action === 'subscription') {
            // logger.debug('Subscription related message')
            const subscriptionRecord = this.subscriptions.find(s => s.msgId === msg.id)
            if (subscriptionRecord) {
              // logger.debug('Emitting message related to subscription', msg.id)
              subscriptionRecord.subscription.emit('message', msg.payload)
            } else {
              const errMessage = `Could not resolve subscription related event to an existing subscription ${JSON.stringify(msg)}`
              logger.error(errMessage)
              this.emit('error', errMessage)
            }
          } else {
            const errMessage = `Server sent multiple response for a request that has already been processed. Message: ${JSON.stringify(msg)}`
            logger.error(errMessage)
            this.emit('error', errMessage)
          }
        } else if (this.messagesCallbacks.get(msg.id)) {
          const promiseProxy = this.messagesCallbacks.get(msg.id)!
          if (msg.success) {
            promiseProxy.resolve(msg.payload)
          } else {
            promiseProxy.reject(msg.error)
          }
          this.messagesCallbacks.set(msg.id, null)
        } else {
          const errMessage = `Server sent a response but the message id could not be resolved to a request. Message: ${JSON.stringify(msg)}`
          logger.error(errMessage)
          this.emit('error', errMessage)
        }
      }
    } catch (err) {
      logger.error(err)
      this.emit('error', err)
    }
  }

  private onWsClose = () => {
    this.emit('close')
  }

  private onWsError = (e: any) => {
    this.emit('error', e)
  }

  private generateNextMessageId() {
    return ++this.msgCnt
  }

  public addSubscription = (subscription: StreamSeaSubscription) => {
    this.subscriptions.push({msgId: null, isReady: false, subscription})
  }

  // Must only be called when connection is established
  // private async subscribe(streamName: string) {
  //   logger.info(`Subscribing to stream ${streamName}`)
    
  //   // const subscriptionKey = await 
  //   this.send('subscribe', streamName)
  //   .then(subscriptionKey => {
  //     const subscriptionRecord = this.subscriptions.find(s => s.subscription.streamName === streamName)
  //     if (!subscriptionKey)
  //     subscriptionRecord.isReady = true
  //   })
  //   if (subscriptionKey) {
  //     this.subscriptions.set(subscriptionKey, eventEmitter)
  //     return eventEmitter
  //   } else {
  //     throw new Error('Failed to subscribe')
  //   }
  // }

  private async send(action: string, payload: any): Promise<any> {
    // TODO: add message timeouts
    return new Promise((resolve, reject) => {
      const msgId = this.generateNextMessageId()
      this.messagesCallbacks.set(msgId, {
        resolve,
        reject,
      })
      this.ws.send(
        JSON.stringify({
          id: msgId,
          action,
          payload,
        })
      )
    })
  }
}