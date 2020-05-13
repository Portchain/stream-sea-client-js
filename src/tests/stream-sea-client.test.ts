import { IStreamSeaConnection, IStreamSeaConnectionFactory } from '../stream-sea-connection'
import { EventEmitter } from 'events'
import { StreamSeaClient } from '../stream-sea-client'
import { StreamSeaSubscription, IStreamSeaSubscription } from '../stream-sea-subscription'

class GoodConnection extends EventEmitter implements IStreamSeaConnection {
  public addSubscription: (subscription: IStreamSeaSubscription) => void
  public close = () => undefined
  constructor(addSubscription: (subscription: IStreamSeaSubscription) => void) {
    super()
    this.addSubscription = addSubscription
  }
}

class UnconnectableConnection extends EventEmitter implements IStreamSeaConnection {
  public addSubscription: (subscription: IStreamSeaSubscription) => void
  public close = () => undefined
  constructor(addSubscription: (subscription: IStreamSeaSubscription) => void) {
    super()
    this.addSubscription = addSubscription
    setTimeout(() => {
      this.emit('warning', 'Could not connect')
      this.emit('close')
    })
  }
}

/**
 * Factory that creates good connections
 */
class GoodConnectionFactory implements IStreamSeaConnectionFactory {
  public tries = 0
  public addSubscription: (subscription: IStreamSeaSubscription) => void
  constructor(addSubscription: (subscription: IStreamSeaSubscription) => void) {
    this.addSubscription = addSubscription
  }
  createConnection = () => {
    this.tries++
    if (this.tries === 1) {
      return new GoodConnection(this.addSubscription)
    } else {
      throw Error('Expected 1 try only')
    }
  }
}

/**
 * Factory that creates two bad connections followed by a good connection
 */
class ThirdTimeLuckyConnectionFactory implements IStreamSeaConnectionFactory {
  public tries = 0
  public addSubscription: (subscription: IStreamSeaSubscription) => void
  constructor(addSubscription: (subscription: IStreamSeaSubscription) => void) {
    this.addSubscription = addSubscription
  }
  createConnection = () => {
    this.tries++
    if (this.tries < 3) {
      return new UnconnectableConnection(this.addSubscription)
    } else if (this.tries === 3) {
      return new GoodConnection(this.addSubscription)
    } else {
      throw Error('Expected 3 tries only')
    }
  }
}

describe('StreamSeaClient', () => {
  it('subscription is passed through to the connection', done => {
    const mockAddSubscription = jest.fn()
    const connectionFactory = new GoodConnectionFactory(mockAddSubscription)
    const client = new StreamSeaClient({
      credentialOptions: {
        type: 'basic',
        clientId: 'mockId',
        clientSecret: 'mockSecret',
      },
      remoteServerHost: 'mockHost',
      remoteServerPort: '101',
      secure: false,
      connectionFactory,
    })
    const testSubscription = new StreamSeaSubscription({ streamName: 'testStream' })
    client.addSubscription(testSubscription)

    setTimeout(() => {
      // Verify that a connection was created
      expect(connectionFactory.tries).toBe(1)
      // Verify that the subscription was added to the connection
      expect(mockAddSubscription.mock.calls.length).toBe(1)
      expect(mockAddSubscription.mock.calls[0][0]).toBe(testSubscription)
      done()
    }, 1000)
  })
  it('client reconnects on the third attempt if the first two attempts fail', done => {
    const mockAddSubscription = jest.fn()
    const connectionFactory = new ThirdTimeLuckyConnectionFactory(mockAddSubscription)
    const client = new StreamSeaClient({
      credentialOptions: {
        type: 'basic',
        clientId: 'mockId',
        clientSecret: 'mockSecret',
      },
      remoteServerHost: 'mockHost',
      remoteServerPort: '101',
      secure: false,
      connectionFactory,
    })
    const testSubscription = new StreamSeaSubscription({ streamName: 'testStream' })
    ;(client as any).RECONNECT_INTERVAL_MS = 1
    client.addSubscription(testSubscription)

    setTimeout(() => {
      // Verify that 3 connections were created
      expect(connectionFactory.tries).toBe(3)
      // Verify that the subscription was added to each of the 3 connections
      expect(mockAddSubscription.mock.calls.length).toBe(3)
      expect(mockAddSubscription.mock.calls.map(c => c[0] === testSubscription)).toEqual([true, true, true])
      done()
    }, 1000)
  })
})
