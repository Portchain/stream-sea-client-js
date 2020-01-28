import { IStreamSeaConnection, IStreamSeaConnectionFactory } from "../stream-sea-connection"
import { EventEmitter } from "events"
import { StreamSeaClient } from "../stream-sea-client"
import { StreamSeaSubscription } from "../stream-sea-subscription"

class GoodConnection extends EventEmitter implements IStreamSeaConnection {
  addSubscription = () => {return;}
}

class UnconnectableConnection extends EventEmitter implements IStreamSeaConnection {
  constructor(){
    super()
    setTimeout(() => {
      this.emit('error', 'Could not connect')
      this.emit('close')
    })
  }
  addSubscription = () => {return;}
}

/**
 * Factory that creates good connections
 */
class GoodConnectionFactory implements IStreamSeaConnectionFactory {
  public tries = 0
  createConnection = () => {
    this.tries++
    if (this.tries === 1){
      return new GoodConnection()
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
  createConnection = () => {
    this.tries++
    if (this.tries < 3){
      return new UnconnectableConnection()
    } else if (this.tries === 3){
      return new GoodConnection()
    } else {
      throw Error('Expected 3 tries only')
    }
  }
}


describe('StreamSeaClient', () => {
  it('subscription is passed through to the connection', done => {
    const connectionFactory = new GoodConnectionFactory()
    const client = new StreamSeaClient({
      appId: 'mockId',
      appSecret: 'mockSecret',
      remoteServerHost: 'mockHost',
      remoteServerPort: '101',
      secure: false,
      connectionFactory,
    })
    const testSubscription = new StreamSeaSubscription('testStream')
    ;(client as any).connection.addSubscription = (s: any) => {
      // Verify that testSubscription was added to the connection
      expect(s).toBe(testSubscription)
      done()
    }
    client.addSubscription(testSubscription)
    setTimeout(() => {
      expect(connectionFactory.tries).toBe(1)
      done()
    }, 1000)
  })
  it('client reconnects on the third attempt if the first two attempts fail', done => {
    const connectionFactory = new ThirdTimeLuckyConnectionFactory()
    const client = new StreamSeaClient({
      appId: 'mockId',
      appSecret: 'mockSecret',
      remoteServerHost: 'mockHost',
      remoteServerPort: '101',
      secure: false,
      connectionFactory,
    })
    ;(client as any).RECONNECT_INTERVAL_MS = 1;
    setTimeout(() => {
      expect(connectionFactory.tries).toBe(3)
      done()
    }, 1000)
  })
})