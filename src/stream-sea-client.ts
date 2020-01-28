import { EventEmitter } from "events";
import { IStreamSeaConnectionFactory, IStreamSeaConnection, StreamSeaConnectionFactory, StreamSeaConnectionError, StreamSeaConnectionWarning } from "./stream-sea-connection";
import { IStreamSeaSubscription } from "./stream-sea-subscription";
const logger = require('logacious')()

const getWsURLScheme = (secure: boolean) => (secure ? 'wss' : 'ws')

interface StreamSeaClientOptions {
  remoteServerHost: string
  remoteServerPort: string
  secure: boolean
  appId: string
  appSecret: string
}

/**
 * A StreamSeaClient manages a StreamSeaConnection, restarting it if necessary
 * 
 * Events:
 *   error - non-recoverable error. The client should be re-configured
 * 
 * Public methods:
 *   addSubscription: (subscription: IStreamSeaSubscription) => void
 */
export class StreamSeaClient extends EventEmitter {
  private options: StreamSeaClientOptions & {connectionFactory: IStreamSeaConnectionFactory}
  private connection: IStreamSeaConnection
  private subscriptions: IStreamSeaSubscription[] = []
  private RECONNECT_INTERVAL_MS = 3000;

  constructor(options: StreamSeaClientOptions & {connectionFactory: IStreamSeaConnectionFactory}){
    super()
    this.options = options
    this.connection = options.connectionFactory.createConnection({
      url: `${getWsURLScheme(options.secure)}://${options.remoteServerHost}:${options.remoteServerPort}/api/v1/streams`,
      appId: options.appId,
      appSecret: options.appSecret,
    })
    this.connection.on('close', this.onConnectionClose)
    this.connection.on('error', this.onConnectionError)
    this.connection.on('warning', this.onConnectionWarning)
  }
  private onConnectionError = (e: StreamSeaConnectionError) => {
    this.emit('error', e)
  }

  private onConnectionWarning = (w: StreamSeaConnectionWarning) => {
    logger.warn(w)
  }

  private onConnectionClose = () => {
    logger.warn('StreamSeaClient: Connection closed')
    setTimeout(this.reopenConnection, this.RECONNECT_INTERVAL_MS)
  }

  private reopenConnection = () => {
    logger.warn('StreamSeaClient: Reopening connection')
    this.connection = this.options.connectionFactory.createConnection({
      url: `${getWsURLScheme(this.options.secure)}://${this.options.remoteServerHost}:${this.options.remoteServerPort}/api/v1/streams`,
      appId: this.options.appId,
      appSecret: this.options.appSecret,
    })
    this.connection.on('close', this.onConnectionClose)
    this.connection.on('error', this.onConnectionError)
    this.connection.on('warning', this.onConnectionWarning)
    this.subscriptions.forEach(subscription => this.connection.addSubscription(subscription))
  }
  public addSubscription = (subscription: IStreamSeaSubscription) => {
    this.subscriptions.push(subscription)
    this.connection.addSubscription(subscription)
  }
}

export const getStreamSeaClient = (options: StreamSeaClientOptions) => new StreamSeaClient({...options, connectionFactory: new StreamSeaConnectionFactory({})})