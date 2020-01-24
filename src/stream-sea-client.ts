import { EventEmitter } from "events";
import { StreamSeaConnection, IStreamSeaConnectionFactory, IStreamSeaConnection } from "./stream-sea-connection";
import { StreamSeaSubscription } from "./stream-sea-subscription";

// Statuses:
//   connecting
//   connected

// Events:
//   error

// Public methods:
//   addSubscription(streamName: string): ISubscription

enum StreamSeaClientStatus {
  connecting = 'connecting',
  connected = 'connected',
}

interface StreamSeaClientOptions {
  connectionFactory: IStreamSeaConnectionFactory
}

export class StreamSeaClient extends EventEmitter {
  private status: StreamSeaClientStatus = StreamSeaClientStatus.connecting
  private options: StreamSeaClientOptions
  private connection: IStreamSeaConnection
  private subscriptions: StreamSeaSubscription[] = []
  constructor(options: StreamSeaClientOptions){
    super()
    this.options = options
    this.connection = options.connectionFactory.createConnection()
  }
  public addSubscription = (subscription: StreamSeaSubscription) => {
    this.subscriptions.push(subscription)
  }
}