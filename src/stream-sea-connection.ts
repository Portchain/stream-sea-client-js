import { EventEmitter } from "events";
import { IStreamSeaSubscription } from "./stream-sea-subscription";
import { IStreamSeaSocket, IStreamSeaSocketFactory, StreamSeaSocketFactory } from "./stream-sea-socket";

interface PromiseProxy {
  reject: (err: any) => void
  resolve: (msg?: any) => void
}

export interface IStreamSeaConnection extends EventEmitter {
  addSubscription: (subscription: IStreamSeaSubscription) => void
}

export interface StreamSeaConnectionOptions {
  url: string
  appId: string
  appSecret: string
}

enum StreamSeaConnectionStatus {
  init = 'init',
  open = 'open',
  closed = 'closed',
}

interface SingleReplyCallbackRecord {
  type: 'SingleReply',
  callback: PromiseProxy
}

interface MultiReplyCallbackRecord {
  type: 'MultiReply',
  receivedReply: boolean,
  firstReplyCallback: PromiseProxy,
  otherRepliesCallback: PromiseProxy,
}

type CallbackRecord = SingleReplyCallbackRecord | MultiReplyCallbackRecord

type AuthenticationError = { // Authentication failed
  type: 'AuthenticationError',
  error: any
}
type ProtocolError = { // The server's response violated protocol
  type: 'ProtocolError',
  error: any
}
type SocketError = { // Unknown error from underlying socket
  type: 'SocketError',
  error: any
}
export type StreamSeaConnectionError = AuthenticationError
export type StreamSeaConnectionWarning = ProtocolError | SocketError

/**
 * A StreamSeaConnection gives a higher-level interface on top of StreamSeaSocket, taking
 * care of authentication and subscription messages
 * 
 * Events:
 *   message
 *   close - the underlying websocket has closed
 *   error - a non-recoverable error has occurred. The connection needs to be terminated
 *   warning - a recoverable error has occurred
 * 
 * Public methods:
 *   addSubscription: (subscription: IStreamSeaSubscription) => void
 */
export class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
  private msgCnt: number = 0
  private status: StreamSeaConnectionStatus = StreamSeaConnectionStatus.init
  // Queue of subscribe requests that have not yet been sent to the server
  private subscriptionsQueue: IStreamSeaSubscription[] = []
  private callbacksMap: Map<number, CallbackRecord> = new Map()
  private socket: IStreamSeaSocket
  private options: StreamSeaConnectionOptions & {socketFactory: IStreamSeaSocketFactory}
  constructor(options: StreamSeaConnectionOptions & {socketFactory: IStreamSeaSocketFactory}){
    super()
    this.options = options
    this.socket = this.options.socketFactory.createSocket({url: options.url}) // TODO: use factory method
    this.socket.on('open', this.onSocketOpen)
    this.socket.on('message', this.onSocketMessage)
    this.socket.on('close', this.onSocketClose)
    this.socket.on('error', this.onSocketError)
  }

  private onSocketOpen = () => {
    this.sendSingleReply('authenticate', {
      username: this.options.appId,
      password: this.options.appSecret,
    })
    .then(() => {
      this.status = StreamSeaConnectionStatus.open
      this.checkSubscriptionsQueue()
    })
    .catch(error => {
      const err: StreamSeaConnectionError = {
        type: 'AuthenticationError',
        error,
      }
      this.emit('error', err)
    })
  }

  private onSocketMessage = (msgStr: string) => {
    let msg: any
    try {
      msg = JSON.parse(msgStr)
    } catch (error) {
      const warning: StreamSeaConnectionWarning = {
        type: 'ProtocolError',
        error,
      }
      this.emit('warning', warning)
      return
    }

    if (!msg.id) {
      const warning: StreamSeaConnectionWarning = {
        type: 'ProtocolError',
        error: `Server sends a message without an id ${JSON.stringify(msg)}`
      }
      this.emit('warning', warning)
      return
    }

    if (!this.callbacksMap.has(msg.id)) {
      const warning: StreamSeaConnectionWarning = {
        type: 'ProtocolError',
        error: `Server sent a response but the message id could not be resolved to a request. Message: ${JSON.stringify(msg)}`,
      }
      this.emit('warning', warning)
      return
    }

    const callbackRecord: CallbackRecord = this.callbacksMap.get(msg.id)!
    if (callbackRecord.type === 'SingleReply'){
      const promiseProxy = callbackRecord.callback
      if (msg.success) {
        promiseProxy.resolve(msg.payload)
      } else {
        promiseProxy.reject(msg.error)
      }
      this.callbacksMap.delete(msg.id)
      return
    } else {
      // callbackRecord.type === 'MultiReply'
      if (!callbackRecord.receivedReply) {
        callbackRecord.receivedReply = true
        const promiseProxy = callbackRecord.firstReplyCallback
        if (msg.success) {
          promiseProxy.resolve(msg.payload)
        } else {
          promiseProxy.reject(msg.error)
        }
      } else {
        const promiseProxy = callbackRecord.otherRepliesCallback
        promiseProxy.resolve(msg.payload)
      } 
    }
  }

  private onSocketClose = () => {
    this.emit('close')
  }

  private onSocketError = (error: any) => {
    const warning: StreamSeaConnectionWarning = {
      type: 'SocketError',
      error,
    }
    this.emit('warning', warning)
  }

  private generateNextMessageId() {
    return ++this.msgCnt
  }

  public addSubscription = (subscription: IStreamSeaSubscription) => {
    // console.log('StreamSeaConnection.addSubscription')
    this.subscriptionsQueue.push(subscription)
    this.checkSubscriptionsQueue()
  }

  /**
   * Send out queued subscriptions if possible
   */
  private checkSubscriptionsQueue(){
    if (this.status === StreamSeaConnectionStatus.open) {
      this.subscriptionsQueue.forEach(subscription => {
        this.sendMultiReply(
          'subscribe',
          subscription.streamName,
          {
            resolve: (m: any) => {return;}, // Nothing to do for subscribe callback
            reject: (e: any) => this.onSocketError(e),
          },
          {
            resolve: (m: any) => subscription.emit('message', m),
            reject: (e: any) => this.onSocketError(e),
          },
        )
      })
      this.subscriptionsQueue = []
    }
  }

  /**
   * Send a message expecting a single reply
   */
  private async sendSingleReply(action: string, payload: any): Promise<any> {
    const msgId = this.generateNextMessageId()
    this.socket.send(
      JSON.stringify({
        id: msgId,
        action,
        payload,
      })
    )
    return new Promise((resolve, reject) => {
      this.callbacksMap.set(msgId, {
        type: 'SingleReply',
        callback: {
          resolve,
          reject,
        },
      })
    })
  }

  /**
   * Send a message expecting multiple replies
   */
  private sendMultiReply(
    action: string,
    payload: any,
    firstReplyCallback: PromiseProxy,
    otherRepliesCallback: PromiseProxy,
  ) {
    const msgId = this.generateNextMessageId()
    this.socket.send(
      JSON.stringify({
        id: msgId,
        action,
        payload,
      })
    )
    this.callbacksMap.set(msgId, {
      type: 'MultiReply',
      firstReplyCallback,
      otherRepliesCallback,
      receivedReply: false,
    })
  }
}

// Factory methods

export interface IStreamSeaConnectionFactory {
  createConnection: (options: StreamSeaConnectionOptions) => IStreamSeaConnection
}

export interface StreamSeaConnectionFactoryOptions {

}

export class StreamSeaConnectionFactory implements IStreamSeaConnectionFactory {
  private options: StreamSeaConnectionFactoryOptions
  private socketFactory: IStreamSeaSocketFactory
  constructor(options: StreamSeaConnectionFactoryOptions){
    this.options = options
    this.socketFactory = new StreamSeaSocketFactory({})
  }
  public createConnection = (options: StreamSeaConnectionOptions) => {
    return new StreamSeaConnection({...options, socketFactory: this.socketFactory})
  }
}