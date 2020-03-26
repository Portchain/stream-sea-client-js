"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_sea_connection_1 = require("../stream-sea-connection");
const events_1 = require("events");
const assert = __importStar(require("assert"));
const stream_sea_subscription_1 = require("../stream-sea-subscription");
class BasicSocket extends events_1.EventEmitter {
    constructor() {
        super();
        this.verifyAuthenticationPayload = (payload) => {
            expect(payload.type).toBe('basic');
            return payload.clientSecret === 'test_client_secret';
        };
        this.sendCallbacks = [
            m => {
                expect(m.action).toBe('authenticate');
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
                    });
                }
                else {
                    this.emit('message', {
                        data: JSON.stringify({
                            id: m.id,
                            action: 'authenticate',
                            success: false,
                            error: {
                                message: 'Invalid credentials',
                            },
                        }),
                    });
                }
            },
            m => {
                expect(m.action).toBe('subscribe');
                this.subscriptionKey = m.id;
                this.groupId = m.groupId;
                this.emit('message', {
                    data: JSON.stringify({
                        id: m.id,
                        action: 'subscription',
                        success: true,
                        payload: m.id,
                    }),
                });
            },
        ];
        this.send = (m) => {
            const fn = this.sendCallbacks.shift();
            assert.ok(fn);
            setTimeout(() => fn(JSON.parse(m)));
        };
        this.close = () => undefined;
        setTimeout(() => this.emit('open'));
    }
    emitSubscriptionMessage() {
        assert.ok(this.subscriptionKey);
        this.emit('message', {
            data: JSON.stringify({
                id: this.subscriptionKey,
                action: 'subscription',
                streamName: 'testStream',
                payload: {
                    foo: 'bar',
                },
            }),
        });
    }
}
class BasicSocketFactory {
    constructor() {
        this.sockets = [];
        this.createSocket = () => {
            const socket = new BasicSocket();
            this.sockets.push(socket);
            return socket;
        };
    }
}
class JwtSocket extends BasicSocket {
    constructor() {
        super(...arguments);
        this.verifyAuthenticationPayload = (payload) => {
            expect(payload.type).toBe('jwt');
            return payload.jwt === 'test.client.jwt';
        };
    }
}
class JwtSocketFactory {
    constructor() {
        this.sockets = [];
        this.createSocket = () => {
            const socket = new JwtSocket();
            this.sockets.push(socket);
            return socket;
        };
    }
}
describe('StreamSeaConnection', () => {
    it('positive: Basic auth with default groupId', done => {
        const socketFactory = new BasicSocketFactory();
        const connection = new stream_sea_connection_1.StreamSeaConnection({
            url: 'test_url',
            credentialOptions: {
                type: 'basic',
                clientId: 'test_client_id',
                clientSecret: 'test_client_secret',
            },
            socketFactory,
            groupId: undefined,
        });
        const subscription = new stream_sea_subscription_1.StreamSeaSubscription('testStream');
        connection.addSubscription(subscription);
        setTimeout(() => {
            // Verify a socket was created
            expect(socketFactory.sockets.length).toBe(1);
            // Verify the groupId is undefined
            expect(socketFactory.sockets[0].groupId).toBe(undefined);
            // Verify that all send callbacks have been called
            expect(socketFactory.sockets[0].sendCallbacks.length).toBe(0);
            // Verify that the connection is open
            expect(connection.status).toBe(stream_sea_connection_1.StreamSeaConnectionStatus.open);
            // Verify that messages on the socket are forwarded to the subscription
            subscription.on('message', m => {
                expect(m.foo).toBe('bar');
                done();
            });
            socketFactory.sockets[0].emitSubscriptionMessage();
        }, 1000);
    });
    it('positive: Basic auth with custom groupId', done => {
        const socketFactory = new BasicSocketFactory();
        const connection = new stream_sea_connection_1.StreamSeaConnection({
            url: 'test_url',
            credentialOptions: {
                type: 'basic',
                clientId: 'test_client_id',
                clientSecret: 'test_client_secret',
            },
            socketFactory,
            groupId: '00000000-0000-0000-000000001234',
        });
        const subscription = new stream_sea_subscription_1.StreamSeaSubscription('testStream');
        connection.addSubscription(subscription);
        setTimeout(() => {
            // Verify a socket was created
            expect(socketFactory.sockets.length).toBe(1);
            // Verify the groupId is undefined
            expect(socketFactory.sockets[0].groupId).toBe('00000000-0000-0000-000000001234');
            // Verify that all send callbacks have been called
            expect(socketFactory.sockets[0].sendCallbacks.length).toBe(0);
            // Verify that the connection is open
            expect(connection.status).toBe(stream_sea_connection_1.StreamSeaConnectionStatus.open);
            // Verify that messages on the socket are forwarded to the subscription
            subscription.on('message', m => {
                expect(m.foo).toBe('bar');
                done();
            });
            socketFactory.sockets[0].emitSubscriptionMessage();
        }, 1000);
    });
    it('negative: Basic auth with bad credentials', done => {
        const socketFactory = new BasicSocketFactory();
        const connection = new stream_sea_connection_1.StreamSeaConnection({
            url: 'test_url',
            credentialOptions: {
                type: 'basic',
                clientId: 'test_client_id',
                clientSecret: 'wrong_secret',
            },
            socketFactory,
            groupId: undefined,
        });
        const subscription = new stream_sea_subscription_1.StreamSeaSubscription('testStream');
        connection.addSubscription(subscription);
        // Verify the correct error is thrown
        const errorHandler = jest.fn((e) => expect(e.type).toBe('AuthenticationError'));
        connection.on('error', errorHandler);
        setTimeout(() => {
            // Verify a socket was created
            expect(socketFactory.sockets.length).toBe(1);
            // Verify that only the first send callback has been called
            expect(socketFactory.sockets[0].sendCallbacks.length).toBe(1);
            // Verify that the connection is not open
            expect(connection.status).toBe(stream_sea_connection_1.StreamSeaConnectionStatus.init);
            // Verify that the error handler was called
            expect(errorHandler.mock.calls.length).toBe(1);
            done();
        }, 1000);
    });
    it('positive: JWT auth', done => {
        const socketFactory = new JwtSocketFactory();
        const connection = new stream_sea_connection_1.StreamSeaConnection({
            url: 'test_url',
            credentialOptions: {
                type: 'jwt',
                clientId: 'test_client_id',
                jwt: 'test.client.jwt',
            },
            socketFactory,
            groupId: undefined,
        });
        const subscription = new stream_sea_subscription_1.StreamSeaSubscription('testStream');
        connection.addSubscription(subscription);
        setTimeout(() => {
            // Verify a socket was created
            expect(socketFactory.sockets.length).toBe(1);
            // Verify the groupId is undefined
            expect(socketFactory.sockets[0].groupId).toBe(undefined);
            // Verify that all send callbacks have been called
            expect(socketFactory.sockets[0].sendCallbacks.length).toBe(0);
            // Verify that the connection is open
            expect(connection.status).toBe(stream_sea_connection_1.StreamSeaConnectionStatus.open);
            // Verify that messages on the socket are forwarded to the subscription
            subscription.on('message', m => {
                expect(m.foo).toBe('bar');
                done();
            });
            socketFactory.sockets[0].emitSubscriptionMessage();
        }, 1000);
    });
});
