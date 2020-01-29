import { StreamSeaConnection, StreamSeaConnectionStatus } from "../stream-sea-connection"
import { EventEmitter } from "events"
import { IStreamSeaSocket, IStreamSeaSocketFactory } from "../stream-sea-socket"
import * as assert from 'assert'
import { StreamSeaSubscription } from "../stream-sea-subscription"

class BasicSocket extends EventEmitter implements IStreamSeaSocket {
  // public sendMock = jest.fn<any, any>(() => {return;})
  public subscriptionKey?: number
  public sendCallbacks: Array<(m: any) => void> = [
    m => {
      expect(m.action).toBe('authenticate')
      this.emit('message', JSON.stringify({
        id: m.id,
        action: "authenticate",
        success: true,
        payload: {
          jailId: "some_jail"
        }
      }))
    },
    m => {
      expect(m.action).toBe('subscribe')
      this.subscriptionKey = m.id
      this.emit('message', JSON.stringify({
        id: m.id,
        action: "subscription",
        success: true,
        payload: m.id,
      }))
    },
  ]
  constructor(){
    super()
    setTimeout(() => this.emit('open'))
  }
  public send = (m: any) => {
    const fn = this.sendCallbacks.shift()
    assert.ok(fn)
    setTimeout(() => fn!(JSON.parse(m)))
  }
  public emitSubscriptionMessage(){
    assert.ok(this.subscriptionKey)
    this.emit('message', JSON.stringify({
      id: this.subscriptionKey,
      action: 'subscription',
      streamName: 'testStream',
      payload: {
        foo: "bar"
      },
    }))
  }
}

class BasicSocketFactory implements IStreamSeaSocketFactory {
  public sockets: BasicSocket[] = []
  createSocket = () => {
    const socket = new BasicSocket()
    this.sockets.push(socket)
    return socket
  }
}

describe('StreamSeaConnection', () => {
  it('basic flow', done => {
    const socketFactory = new BasicSocketFactory()
    const connection = new StreamSeaConnection({
      url: 'test_url',
      appId: 'test_app_id',
      appSecret: 'test_app_secret',
      socketFactory,
    })
    const subscription = new StreamSeaSubscription('testStream')
    connection.addSubscription(subscription)
    setTimeout(() => {
      // Verify a socket was created
      expect(socketFactory.sockets.length).toBe(1)
      // Verify that all callbacks have been called
      expect(socketFactory.sockets[0].sendCallbacks.length).toBe(0)
      // Verify that the connection is open
      expect(connection.status).toBe(StreamSeaConnectionStatus.open)
      // Verify that messages on the socket are forwarded to the subscription
      subscription.on('message', m => {
        expect(m.foo).toBe('bar')
        done()
      })
      socketFactory.sockets[0].emitSubscriptionMessage()
    }, 1000)
  })
})
