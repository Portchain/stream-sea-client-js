import { StreamSeaConnection, StreamSeaConnectionStatus, StreamSeaConnectionError } from '../stream-sea-connection'
import { EventEmitter } from 'events'
import { IStreamSeaSocket, IStreamSeaSocketFactory } from '../stream-sea-socket'
import * as assert from 'assert'
import { StreamSeaSubscription } from '../stream-sea-subscription'

class BasicSocket extends EventEmitter implements IStreamSeaSocket {
  // public sendMock = jest.fn<any, any>(() => {return;})
  public subscriptionKey?: number
  public groupId?: string
  public verifyAuthenticationPayload = (payload: any) => {
    expect(payload.type).toBe('basic')
    return payload.clientSecret === 'test_client_secret'
  }
  public sendCallbacks: Array<(m: any) => void> = [
    m => {
      expect(m.action).toBe('authenticate')
      if (this.verifyAuthenticationPayload(m.payload)) {
        this.emit('message', {
          data: JSON.stringify({
            id: m.id,
            action: 'authenticate',
            success: true,
            payload: {
              jailId: 'some_jail',
            },
          }),
        })
      } else {
        this.emit('message', {
          data: JSON.stringify({
            id: m.id,
            action: 'authenticate',
            success: false,
            error: {
              message: 'Invalid credentials',
            },
          }),
        })
      }
    },
    m => {
      expect(m.action).toBe('subscribe')
      this.subscriptionKey = m.id
      this.groupId = m.groupId
      this.emit('message', {
        data: JSON.stringify({
          id: m.id,
          action: 'subscription',
          success: true,
          payload: m.id,
        }),
      })
    },
  ]
  constructor() {
    super()
    setTimeout(() => this.emit('open'))
  }
  public send = (m: any) => {
    const fn = this.sendCallbacks.shift()
    assert.ok(fn)
    setTimeout(() => fn!(JSON.parse(m)))
  }
  public close = () => undefined
  public emitSubscriptionMessage() {
    assert.ok(this.subscriptionKey)
    this.emit('message', {
      data: JSON.stringify({
        id: this.subscriptionKey,
        action: 'subscription',
        streamName: 'testStream',
        payload: {
          foo: 'bar',
        },
      }),
    })
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

class JwtSocket extends BasicSocket {
  public verifyAuthenticationPayload = (payload: any) => {
    expect(payload.type).toBe('jwt')
    return payload.jwt === 'test.client.jwt'
  }
}

class JwtSocketFactory implements IStreamSeaSocketFactory {
  public sockets: JwtSocket[] = []
  createSocket = () => {
    const socket = new JwtSocket()
    this.sockets.push(socket)
    return socket
  }
}

describe('StreamSeaConnection', () => {
  it('positive: Basic auth with default groupId', done => {
    const socketFactory = new BasicSocketFactory()
    const connection = new StreamSeaConnection({
      url: 'test_url',
      credentialOptions: {
        type: 'basic',
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
      },
      socketFactory,
      fanout: false,
    })
    const subscription = new StreamSeaSubscription('testStream')
    connection.addSubscription(subscription)
    setTimeout(() => {
      // Verify a socket was created
      expect(socketFactory.sockets.length).toBe(1)
      // Verify the groupId is undefined
      expect(socketFactory.sockets[0].groupId).toBe(undefined)
      // Verify that all send callbacks have been called
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
  it('positive: Basic auth with fanout', done => {
    const socketFactory = new BasicSocketFactory()
    const connection = new StreamSeaConnection({
      url: 'test_url',
      credentialOptions: {
        type: 'basic',
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
      },
      socketFactory,
      fanout: true,
    })
    const subscription = new StreamSeaSubscription('testStream')
    connection.addSubscription(subscription)
    setTimeout(() => {
      // Verify a socket was created
      expect(socketFactory.sockets.length).toBe(1)
      // Verify the groupId is undefined
      expect(socketFactory.sockets[0].groupId).toBeTruthy()
      // Verify that all send callbacks have been called
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
  it('negative: Basic auth with bad credentials', done => {
    const socketFactory = new BasicSocketFactory()
    const connection = new StreamSeaConnection({
      url: 'test_url',
      credentialOptions: {
        type: 'basic',
        clientId: 'test_client_id',
        clientSecret: 'wrong_secret',
      },
      socketFactory,
      fanout: false,
    })
    const subscription = new StreamSeaSubscription('testStream')
    connection.addSubscription(subscription)
    // Verify the correct error is thrown
    const errorHandler = jest.fn((e: StreamSeaConnectionError) => expect(e.type).toBe('AuthenticationError'))
    connection.on('error', errorHandler)
    setTimeout(() => {
      // Verify a socket was created
      expect(socketFactory.sockets.length).toBe(1)
      // Verify that only the first send callback has been called
      expect(socketFactory.sockets[0].sendCallbacks.length).toBe(1)
      // Verify that the connection is not open
      expect(connection.status).toBe(StreamSeaConnectionStatus.init)
      // Verify that the error handler was called
      expect(errorHandler.mock.calls.length).toBe(1)
      done()
    }, 1000)
  })
  it('positive: JWT auth', done => {
    const socketFactory = new JwtSocketFactory()
    const connection = new StreamSeaConnection({
      url: 'test_url',
      credentialOptions: {
        type: 'jwt',
        clientId: 'test_client_id',
        jwt: 'test.client.jwt',
      },
      socketFactory,
      fanout: false,
    })
    const subscription = new StreamSeaSubscription('testStream')
    connection.addSubscription(subscription)
    setTimeout(() => {
      // Verify a socket was created
      expect(socketFactory.sockets.length).toBe(1)
      // Verify the groupId is undefined
      expect(socketFactory.sockets[0].groupId).toBe(undefined)
      // Verify that all send callbacks have been called
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
