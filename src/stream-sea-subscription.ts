import { EventEmitter } from "events";

export interface IStreamSeaSubscription extends EventEmitter {
  streamName: string
}

/**
 * A StreamSeaSubscription represents a long-lasting logical subscription.
 * A StreamSeaSubscription may be transferred from one connection to another
 * 
 * Events:
 *   message
 */
export class StreamSeaSubscription extends EventEmitter implements IStreamSeaSubscription {
  public streamName: string
  constructor(streamName: string){
    super()
    this.streamName = streamName
  }
}