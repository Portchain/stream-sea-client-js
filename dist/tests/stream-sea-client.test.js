"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const stream_sea_client_1 = require("../stream-sea-client");
class MockStreamSeaConnection extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.addSubscription = () => { };
    }
}
class MockStreamSeaConnectionFactory {
    constructor() {
        this.createConnection = () => {
            return new MockStreamSeaConnection();
        };
    }
}
describe('StreamSeaClient', () => {
    it('basic', done => {
        const client = new stream_sea_client_1.StreamSeaClient({
            appId: 'mockId',
            appSecret: 'mockSecret',
            remoteServerHost: 'mockHost',
            remoteServerPort: '101',
            secure: false,
            connectionFactory: new MockStreamSeaConnectionFactory()
        });
    });
});
