import { IStreamSeaConnection, IStreamSeaConnectionFactory } from "../stream-sea-connection"
import { EventEmitter } from "events"
import { StreamSeaClient } from "../stream-sea-client"
import { StreamSeaSubscription } from "../stream-sea-subscription"

class MockStreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
  addSubscription = () => {return;}
}

class MockStreamSeaConnectionFactory implements IStreamSeaConnectionFactory {
  createConnection = () => {
    return new MockStreamSeaConnection()
  }
}

describe('StreamSeaClient', () => {
  it('subscriptions as passed through to the connection', done => {
    const client = new StreamSeaClient({
      appId: 'mockId',
      appSecret: 'mockSecret',
      remoteServerHost: 'mockHost',
      remoteServerPort: '101',
      secure: false,
      connectionFactory: new MockStreamSeaConnectionFactory()
    })
    const testSubscription = new StreamSeaSubscription('testStream')
    ;(client as any).connection.addSubscription = (s: any) => {
      expect(s).toBe(testSubscription)
      done()
    }
    client.addSubscription(testSubscription)
  })
})