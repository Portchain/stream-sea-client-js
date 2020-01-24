import { EventEmitter } from "events";
import { StreamSeaSubscription } from "./stream-sea-subscription";

// States:
//   init
//   authenticating
//   open
//   closed

// Events:
//   close

// Public methods:
//   addSubscription(streamName: string): IStreamSeaSubscription


// Factory methods

export interface IStreamSeaConnectionFactory {
  createConnection: () => IStreamSeaConnection
}

export interface StreamSeaConnectionFactoryOptions {

}

export class StreamSeaConnectionFactory implements IStreamSeaConnectionFactory {
  private options: StreamSeaConnectionFactoryOptions
  constructor(options: StreamSeaConnectionFactoryOptions){
    this.options = options
  }
  public createConnection = () => {
    return new StreamSeaConnection({})
  }
}

// Stream methods

export interface IStreamSeaConnection extends EventEmitter {
  addSubscription: (subscription: StreamSeaSubscription) => void
}

export interface StreamSeaConnectionOptions {

}

export class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
  private subscriptions: Array<{isReady: boolean; subscription: StreamSeaSubscription}> = []
  constructor(options: StreamSeaConnectionOptions){
    super()
  }
  public addSubscription = (subscription: StreamSeaSubscription) => {
    this.subscriptions.push({isReady: false, subscription})
  }
}