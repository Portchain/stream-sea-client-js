import { EventEmitter } from "events";
import { IStreamSeaConnectionFactory, IStreamSeaConnection, StreamSeaConnectionFactory } from "./stream-sea-connection";
import { IStreamSeaSubscription } from "./stream-sea-subscription";
const logger = require('logacious')()

const RECONNECT_INTERVAL_MS = 3000;

const getWsURLScheme = (secure: boolean) => (secure ? 'wss' : 'ws')

interface StreamSeaClientOptions {
  remoteServerHost: string
  remoteServerPort: string
  secure: boolean
  appId: string
  appSecret: string
}

/**
 * Events:
 *   error
 * 
 * Public methods:
 *   addSubscription: (subscription: IStreamSeaSubscription) => void
 */
export class StreamSeaClient extends EventEmitter {
  private options: StreamSeaClientOptions & {connectionFactory: IStreamSeaConnectionFactory}
  private connection: IStreamSeaConnection
  private subscriptions: IStreamSeaSubscription[] = []
  constructor(options: StreamSeaClientOptions & {connectionFactory: IStreamSeaConnectionFactory}){
    super()
    this.options = options
    this.connection = options.connectionFactory.createConnection({
      url: `${getWsURLScheme(options.secure)}://${options.remoteServerHost}:${options.remoteServerPort}/api/v1/streams`,
      appId: options.appId,
      appSecret: options.appSecret,
    })
    this.connection.on('close', this.onConnectionClose)
    this.connection.on('error', e => console.error(e))
  }
  private onConnectionClose = () => {
    logger.warn('StreamSeaClient: Connection closed')
    setTimeout(this.reopenConnection, RECONNECT_INTERVAL_MS)
  }
  private reopenConnection = () => {
    logger.warn('StreamSeaClient: Reopening connection')
    this.connection = this.options.connectionFactory.createConnection({
      url: `${getWsURLScheme(this.options.secure)}://${this.options.remoteServerHost}:${this.options.remoteServerPort}/api/v1/streams`,
      appId: this.options.appId,
      appSecret: this.options.appSecret,
    })
    this.connection.on('close', this.onConnectionClose)
    this.connection.on('error', e => console.error(e))
    // TODO: avoid code repetition
    this.subscriptions.forEach(subscription => this.connection.addSubscription(subscription))
  }
  public addSubscription = (subscription: IStreamSeaSubscription) => {
    this.subscriptions.push(subscription)
    this.connection.addSubscription(subscription)
  }
}

export const getStreamSeaClient = (options: StreamSeaClientOptions) => new StreamSeaClient({...options, connectionFactory: new StreamSeaConnectionFactory({})})