import { EventEmitter } from "events";

// States: <none>

// Events:
//   message

// Public methods:
// constructor(streamName: string)

export class StreamSeaSubscription extends EventEmitter {
  public streamName: string
  constructor(streamName: string){
    super()
    this.streamName = streamName
  }
}