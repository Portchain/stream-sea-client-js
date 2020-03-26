import { EventEmitter } from 'events'
import { IStreamSeaConnectionFactory, IStreamSeaConnection, StreamSeaConnectionFactory, StreamSeaConnectionError, StreamSeaConnectionWarning } from './stream-sea-connection'
import { IStreamSeaSubscription } from './stream-sea-subscription'
import { getWsURLScheme } from './utils'
import * as logger from './logger'
import { CredentialOptions } from './types'
import uuid from 'uuid-random'

type StreamSeaClientOptions = {
  remoteServerHost: string
  remoteServerPort: string
  secure: boolean
  credentialOptions: CredentialOptions
  fanout?: boolean
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
  private options: StreamSeaClientOptions & { connectionFactory: IStreamSeaConnectionFactory }
  private connection: IStreamSeaConnection
  private subscriptions: IStreamSeaSubscription[] = []
  private RECONNECT_INTERVAL_MS = 3000
  private CONNECTION_FAILURE_ALERT_THRESHOLD = 20 // Log an error after this many consecutive failures
  private consecutiveConnectionFailures = 0
  private groupId: string | undefined
  private isDestroyed: boolean = false

  constructor(options: StreamSeaClientOptions & { connectionFactory: IStreamSeaConnectionFactory }) {
    super()
    this.options = options
    this.groupId = options.fanout ? uuid() : undefined
    this.connection = options.connectionFactory.createConnection({
      url: `${getWsURLScheme(options.secure)}://${options.remoteServerHost}:${options.remoteServerPort}/api/v1/streams`,
      credentialOptions: options.credentialOptions,
      groupId: this.groupId,
    })
    this.attachConnectionEventHandlers()
  }
  private attachConnectionEventHandlers = () => {
    this.connection.on('open', this.onConnectionOpen)
    this.connection.on('close', this.onConnectionClose)
    this.connection.on('error', this.onConnectionError)
    this.connection.on('warning', this.onConnectionWarning)
  }

  private onConnectionOpen = () => {
    this.consecutiveConnectionFailures = 0
  }

  private onConnectionError = (e: StreamSeaConnectionError) => {
    this.emit('error', e)
  }

  private onConnectionWarning = (w: StreamSeaConnectionWarning) => {
    logger.warn(w)
  }

  private onConnectionClose = () => {
    if (this.isDestroyed) {
      // Do nothing if the client is destroyed
      return
    }
    this.consecutiveConnectionFailures++
    const errorMessage = `StreamSeaClient: Connection closed for the ${this.consecutiveConnectionFailures} time consecutively`
    if (this.consecutiveConnectionFailures === this.CONNECTION_FAILURE_ALERT_THRESHOLD) {
      logger.error(errorMessage)
    } else {
      logger.warn(errorMessage)
    }
    setTimeout(this.reopenConnection, this.RECONNECT_INTERVAL_MS)
  }

  private reopenConnection = () => {
    logger.warn('StreamSeaClient: Reopening connection')
    this.connection = this.options.connectionFactory.createConnection({
      url: `${getWsURLScheme(this.options.secure)}://${this.options.remoteServerHost}:${this.options.remoteServerPort}/api/v1/streams`,
      credentialOptions: this.options.credentialOptions,
      groupId: this.groupId,
    })
    this.attachConnectionEventHandlers()
    this.subscriptions.forEach(subscription => this.connection.addSubscription(subscription))
  }
  public addSubscription = (subscription: IStreamSeaSubscription) => {
    this.subscriptions.push(subscription)
    this.connection.addSubscription(subscription)
  }
  public setCredentialOptions = (credentialOptions: CredentialOptions) => {
    this.options.credentialOptions = credentialOptions
  }
  public destroy = () => {
    this.isDestroyed = true
    this.connection.close()
  }
}

export const getStreamSeaClient = (options: StreamSeaClientOptions) => new StreamSeaClient({ ...options, connectionFactory: new StreamSeaConnectionFactory({}) })
