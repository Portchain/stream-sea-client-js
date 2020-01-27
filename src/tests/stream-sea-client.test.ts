import { IStreamSeaConnection, IStreamSeaConnectionFactory } from "../stream-sea-connection"
import { EventEmitter } from "events"
import { StreamSeaClient } from "../stream-sea-client"
import { StreamSeaSubscription } from "../stream-sea-subscription"

class SimpleMockConnection extends EventEmitter implements IStreamSeaConnection {
  addSubscription = () => {return;}
}

class SimpleMockConnectionFactory implements IStreamSeaConnectionFactory {
  createConnection = () => {
    return new SimpleMockConnection()
  }
}

class InstantFailureConnection extends EventEmitter implements IStreamSeaConnection {
  constructor(){
    super()
    setTimeout(() => {
      this.emit('error', 'Could not connect')
      this.emit('close')
    })
  }
  addSubscription = () => {return;}
}

class ThirdTimeLuckyConnectionFactory implements IStreamSeaConnectionFactory {
  public tries = 0
  createConnection = () => {
    if (++this.tries < 3){
      return new InstantFailureConnection()
    }
    return new SimpleMockConnection()
  }
}


describe('StreamSeaClient', () => {
  it('subscription is passed through to the connection', done => {
    const client = new StreamSeaClient({
      appId: 'mockId',
      appSecret: 'mockSecret',
      remoteServerHost: 'mockHost',
      remoteServerPort: '101',
      secure: false,
      connectionFactory: new SimpleMockConnectionFactory()
    })
    const testSubscription = new StreamSeaSubscription('testStream')
    ;(client as any).connection.addSubscription = (s: any) => {
      expect(s).toBe(testSubscription)
      done()
    }
    client.addSubscription(testSubscription)
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