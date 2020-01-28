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
class BasicSocket extends events_1.EventEmitter {
    constructor() {
        super();
        // public sendMock = jest.fn<any, any>(() => {return;})
        this.callbacks = [
            (m) => {
                expect(m.action).toBe('authenticate');
                this.emit('message', JSON.stringify({
                    id: m.id,
                    action: "authenticate",
                    success: true,
                    payload: {
                        jailId: "some_jail"
                    }
                }));
            },
        ];
        this.send = (m) => {
            const fn = this.callbacks.shift();
            assert.ok(fn);
            setTimeout(() => fn(JSON.parse(m)));
        };
        setTimeout(() => this.emit('open'));
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
// class UnconnectableConnection extends EventEmitter implements IStreamSeaConnection {
//   constructor(){
//     super()
//     setTimeout(() => {
//       this.emit('error', 'Could not connect')
//       this.emit('close')
//     })
//   }
//   addSubscription = () => {return;}
// }
// /**
//  * Factory that creates good connections
//  */
// class GoodConnectionFactory implements IStreamSeaConnectionFactory {
//   public tries = 0
//   createConnection = () => {
//     this.tries++
//     if (this.tries === 1){
//       return new GoodConnection()
//     } else {
//       throw Error('Expected 1 try only')
//     }
//   }
// }
// /**
//  * Factory that creates two bad connections followed by a good connection
//  */
// class ThirdTimeLuckyConnectionFactory implements IStreamSeaConnectionFactory {
//   public tries = 0
//   createConnection = () => {
//     this.tries++
//     if (this.tries < 3){
//       return new UnconnectableConnection()
//     } else if (this.tries === 3){
//       return new GoodConnection()
//     } else {
//       throw Error('Expected 3 tries only')
//     }
//   }
// }
describe('StreamSeaConnection', () => {
    it('basic flow', done => {
        const socketFactory = new BasicSocketFactory();
        const connection = new stream_sea_connection_1.StreamSeaConnection({
            url: 'test_url',
            appId: 'test_app_id',
            appSecret: 'test_app_secret',
            socketFactory,
        });
        // const subscription = new StreamSeaSubscription('testStream')
        setTimeout(() => {
            expect(socketFactory.sockets.length).toBe(1);
            expect(socketFactory.sockets[0].callbacks.length).toBe(0);
            expect(connection.status).toBe(stream_sea_connection_1.StreamSeaConnectionStatus.open);
            done();
        }, 1000);
    });
});
// describe('StreamSeaClient', () => {
//   it('subscription is passed through to the connection', done => {
//     const connectionFactory = new GoodConnectionFactory()
//     const client = new StreamSeaClient({
//       appId: 'mockId',
//       appSecret: 'mockSecret',
//       remoteServerHost: 'mockHost',
//       remoteServerPort: '101',
//       secure: false,
//       connectionFactory,
//     })
//     const testSubscription = new StreamSeaSubscription('testStream')
//     ;(client as any).connection.addSubscription = (s: any) => {
//       // Verify that testSubscription was added to the connection
//       expect(s).toBe(testSubscription)
//       done()
//     }
//     client.addSubscription(testSubscription)
//     setTimeout(() => {
//       expect(connectionFactory.tries).toBe(1)
//       done()
//     }, 1000)
//   })
//   it('client reconnects on the third attempt if the first two attempts fail', done => {
//     const connectionFactory = new ThirdTimeLuckyConnectionFactory()
//     const client = new StreamSeaClient({
//       appId: 'mockId',
//       appSecret: 'mockSecret',
//       remoteServerHost: 'mockHost',
//       remoteServerPort: '101',
//       secure: false,
//       connectionFactory,
//     })
//     ;(client as any).RECONNECT_INTERVAL_MS = 1;
//     setTimeout(() => {
//       expect(connectionFactory.tries).toBe(3)
//       done()
//     }, 1000)
//   })
// })
