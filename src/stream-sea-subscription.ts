import { EventEmitter } from 'events'

export interface StreamSeaSubscriptionOptions {
  streamName: string
  debatch?: boolean // defaults to true
}
export interface IStreamSeaSubscription extends EventEmitter {
  streamName: string
  handleMessageOrBatch: (messageOrBatch: any) => void
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
  private debatch: boolean
  constructor(opts: StreamSeaSubscriptionOptions) {
    super()
    this.streamName = opts.streamName
    this.debatch = opts.debatch === false ? false : true // defaults to true
  }
  public handleMessageOrBatch = (messageOrBatch: any) => {
    if (this.debatch && Array.isArray(messageOrBatch)) {
      // Debatch
      messageOrBatch.forEach(message => {
        this.emit('message', message)
      })
    } else {
      // Don't debatch
      this.emit('message', messageOrBatch)
    }
  }
}
