import { EventEmitter } from "events";
import { StreamSeaConnection, IStreamSeaConnectionFactory, IStreamSeaConnection, StreamSeaConnectionFactory } from "./stream-sea-connection";
import { StreamSeaSubscription } from "./stream-sea-subscription";

// Statuses:
//   connecting
//   connected

// Events:
//   error

// Public methods:
//   addSubscription(streamName: string): ISubscription

const RECONNECT_INTERVAL_MS = 3000;

const getWsURLScheme = (secure: boolean) => (secure ? 'wss' : 'ws')

enum StreamSeaClientStatus {
  connecting = 'connecting',
  connected = 'connected',
}

interface StreamSeaClientOptions {
  remoteServerHost: string
  remoteServerPort: string
  secure: boolean
  appId: string
  appSecret: string
}

class StreamSeaClient extends EventEmitter {
  private status: StreamSeaClientStatus = StreamSeaClientStatus.connecting
  private options: StreamSeaClientOptions & {connectionFactory: IStreamSeaConnectionFactory}
  private connection: IStreamSeaConnection
  private subscriptions: StreamSeaSubscription[] = []
  constructor(options: StreamSeaClientOptions & {connectionFactory: IStreamSeaConnectionFactory}){
    super()
    this.options = options
    this.connection = options.connectionFactory.createConnection({
      url: `${getWsURLScheme(options.secure)}://${options.remoteServerHost}:${options.remoteServerPort}/api/v1/streams`,
      appId: options.appId,
      appSecret: options.appSecret,
    })
    this.connection.on('close', this.onClose)
    this.connection.on('error', e => console.error(e))
  }
  private onClose = () => {
    console.log('StreamSeaClient: Connection closed')
    setTimeout(this.reopenConnection, RECONNECT_INTERVAL_MS)
  }
  private reopenConnection = () => {
    console.log('StreamSeaClient: Reopening connection')
    this.connection = this.options.connectionFactory.createConnection({
      url: `${getWsURLScheme(this.options.secure)}://${this.options.remoteServerHost}:${this.options.remoteServerPort}/api/v1/streams`,
      appId: this.options.appId,
      appSecret: this.options.appSecret,
    })
    this.connection.on('close', this.onClose)
    this.connection.on('error', e => console.error(e))
    // TODO: avoid code repetition
    this.subscriptions.forEach(subscription => this.connection.addSubscription(subscription))
  }
  public addSubscription = (subscription: StreamSeaSubscription) => {
    this.subscriptions.push(subscription)
    this.connection.addSubscription(subscription)
  }
}

export const getStreamSeaClient = (options: StreamSeaClientOptions) => new StreamSeaClient({...options, connectionFactory: new StreamSeaConnectionFactory({})})