import { EventEmitter } from "events";
import { StreamSeaSubscription } from "./stream-sea-subscription";
import WebSocket from 'ws'
import { StreamSeaSocket, IStreamSeaSocket } from "./stream-sea-socket";
const logger = require('logacious')()
// States:
//   init
//   open
//   closed

// Events:
//   close
//   error

// Public methods:
//   addSubscription(streamName: string): IStreamSeaSubscription

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

enum StreamSeaConnectionStatus {
  init = 'init',
  open = 'open',
  closed = 'closed',
}

interface SingleReplyMessageRecord {
  type: 'SingleReply',
  callback: PromiseProxy
}

interface MultiReplyMessageRecord {
  type: 'MultiReply',
  receivedReply: boolean,
  subscribeCallback: PromiseProxy,
  messageCallback: PromiseProxy,
}

type MessageRecord = SingleReplyMessageRecord | MultiReplyMessageRecord

export class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
  private msgCnt: number = 0
  private status: StreamSeaConnectionStatus = StreamSeaConnectionStatus.init
  private subscriptionsQueue: StreamSeaSubscription[] = []
  private messageCallbacks: Map<number, MessageRecord> = new Map()
  private sss: IStreamSeaSocket
  private options: StreamSeaConnectionOptions
  constructor(options: StreamSeaConnectionOptions){
    super()
    this.options = options
    this.sss = new StreamSeaSocket(options.url) // TODO: use factory method
    this.sss.on('open', this.onWsOpen)
    this.sss.on('message', this.onWsMessage)
    this.sss.on('close', this.onWsClose)
    this.sss.on('error', this.onWsError)
  }

  private onWsOpen = () => {
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

  private onWsMessage = (msgStr: string) => {
    try {
      const msg = JSON.parse(msgStr)
      if (!msg.id) {
        const errMessage = `Server sends a message without an id ${JSON.stringify(msg)}`
        logger.error(errMessage)
        this.emit('error', errMessage)
        return
      }
      if (!this.messageCallbacks.has(msg.id)) {
        const errMessage = `Server sent a response but the message id could not be resolved to a request. Message: ${JSON.stringify(msg)}`
        logger.error(errMessage)
        this.emit('error', errMessage)
        return
      }
      const callbackRecord: MessageRecord = this.messageCallbacks.get(msg.id)!
      if (callbackRecord.type === 'SingleReply'){
        const promiseProxy = callbackRecord.callback
        if (msg.success) {
          promiseProxy.resolve(msg.payload)
        } else {
          promiseProxy.reject(msg.error)
        }
        this.messageCallbacks.delete(msg.id)
      } else if (callbackRecord.type === 'MultiReply'){
        if (!callbackRecord.receivedReply) {
          callbackRecord.receivedReply = true
          const promiseProxy = callbackRecord.subscribeCallback
          if (msg.success) {
            promiseProxy.resolve(msg.payload)
          } else {
            promiseProxy.reject(msg.error)
          }
        } else {
          const promiseProxy = callbackRecord.messageCallback
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
    this.subscriptionsQueue.push(subscription)
    this.checkSubscriptionsQueue()
  }

  private checkSubscriptionsQueue(){
    if (this.status === StreamSeaConnectionStatus.open) {
      this.subscriptionsQueue.forEach(subscription => {
        this.sendMultiReply(
          'subscribe',
          subscription.streamName,
          {
            resolve: (m: any) => {return;}, // Nothing to do for subscribe callback
            reject: (e: any) => this.onWsError(e),
          },
          {
            resolve: (m: any) => subscription.emit('message', m),
            reject: (e: any) => this.onWsError(e),
          },
        )
      })
    }
  }

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
      this.messageCallbacks.set(msgId, {
        type: 'SingleReply',
        callback: {
          resolve,
          reject,
        },
      })
    })
  }

  private async sendMultiReply(
    action: string,
    payload: any,
    subscribeCallback: PromiseProxy,
    messageCallback: PromiseProxy,
  ) {
    const msgId = this.generateNextMessageId()
    this.sss.send(
      JSON.stringify({
        id: msgId,
        action,
        payload,
      })
    )
    this.messageCallbacks.set(msgId, {
      type: 'MultiReply',
      subscribeCallback,
      messageCallback,
      receivedReply: false,
    })
  }
}