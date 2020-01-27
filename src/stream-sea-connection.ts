import { EventEmitter } from "events";
import { StreamSeaSubscription } from "./stream-sea-subscription";
import { StreamSeaSocket, IStreamSeaSocket } from "./stream-sea-socket";
const logger = require('logacious')()

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

/**
 * A StreamSeaConnection gives a higher-level interface on top of StreamSeaSocket, taking
 * care of authentication and subscription messages
 * 
 * Events:
 *   open
 *   message
 *   close
 *   error
 * 
 * Public methods:
 *   addSubscription(subscription: StreamSeaSubscription) => void
 */
export class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
  private msgCnt: number = 0
  private status: StreamSeaConnectionStatus = StreamSeaConnectionStatus.init
  // Queue of subscribe requests that have not yet been sent to the server
  private subscriptionsQueue: StreamSeaSubscription[] = []
  private callbacksMap: Map<number, CallbackRecord> = new Map()
  private sss: IStreamSeaSocket
  private options: StreamSeaConnectionOptions
  constructor(options: StreamSeaConnectionOptions){
    super()
    this.options = options
    this.sss = new StreamSeaSocket(options.url) // TODO: use factory method
    this.sss.on('open', this.onSocketOpen)
    this.sss.on('message', this.onSocketMessage)
    this.sss.on('close', this.onSocketClose)
    this.sss.on('error', this.onSocketError)
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
    .catch(err => {
      this.emit('error', err)
    })
  }

  private onSocketMessage = (msgStr: string) => {
    try {
      const msg = JSON.parse(msgStr)
      if (!msg.id) {
        const errMessage = `Server sends a message without an id ${JSON.stringify(msg)}`
        logger.error(errMessage)
        this.emit('error', errMessage)
        return
      }
      if (!this.callbacksMap.has(msg.id)) {
        const errMessage = `Server sent a response but the message id could not be resolved to a request. Message: ${JSON.stringify(msg)}`
        logger.error(errMessage)
        this.emit('error', errMessage)
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
      } else if (callbackRecord.type === 'MultiReply'){
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
      } else {
        throw new Error('Not implemented')
      }
    } catch (err) {
      logger.error(err)
      this.emit('error', err)
    }
  }

  private onSocketClose = () => {
    this.emit('close')
  }

  private onSocketError = (e: any) => {
    this.emit('error', e)
  }

  private generateNextMessageId() {
    return ++this.msgCnt
  }

  public addSubscription = (subscription: StreamSeaSubscription) => {
    this.subscriptionsQueue.push(subscription)
    this.checkSubscriptionsQueue()
  }

  /**
   * Send out queued subscriptions if possible
   */
  private checkSubscriptionsQueue(){
    if (this.status === StreamSeaConnectionStatus.open) {
      for(const subscription = this.subscriptionsQueue.shift(); subscription;) {
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
      }
    }
  }

  /**
   * Send a message expecting a single reply
   */
  private async sendSingleReply(action: string, payload: any): Promise<any> {
    const msgId = this.generateNextMessageId()
    this.sss.send(
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
    this.sss.send(
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