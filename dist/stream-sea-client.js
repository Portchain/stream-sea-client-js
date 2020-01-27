"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const stream_sea_connection_1 = require("./stream-sea-connection");
// Statuses:
//   connecting
//   connected
// Events:
//   error
// Public methods:
//   addSubscription(streamName: string): ISubscription
const RECONNECT_INTERVAL_MS = 3000;
const getWsURLScheme = (secure) => (secure ? 'wss' : 'ws');
var StreamSeaClientStatus;
(function (StreamSeaClientStatus) {
    StreamSeaClientStatus["connecting"] = "connecting";
    StreamSeaClientStatus["connected"] = "connected";
})(StreamSeaClientStatus || (StreamSeaClientStatus = {}));
class StreamSeaClient extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.status = StreamSeaClientStatus.connecting;
        this.subscriptions = [];
        this.onClose = () => {
            console.log('StreamSeaClient: Connection closed');
            setTimeout(this.reopenConnection, RECONNECT_INTERVAL_MS);
        };
        this.reopenConnection = () => {
            console.log('StreamSeaClient: Reopening connection');
            this.connection = this.options.connectionFactory.createConnection({
                url: `${getWsURLScheme(this.options.secure)}://${this.options.remoteServerHost}:${this.options.remoteServerPort}/api/v1/streams`,
                appId: this.options.appId,
                appSecret: this.options.appSecret,
            });
            this.connection.on('close', this.onClose);
            this.connection.on('error', e => console.error(e));
            // TODO: avoid code repetition
            this.subscriptions.forEach(subscription => this.connection.addSubscription(subscription));
        };
        this.addSubscription = (subscription) => {
            this.subscriptions.push(subscription);
            this.connection.addSubscription(subscription);
        };
        this.options = options;
        this.connection = options.connectionFactory.createConnection({
            url: `${getWsURLScheme(options.secure)}://${options.remoteServerHost}:${options.remoteServerPort}/api/v1/streams`,
            appId: options.appId,
            appSecret: options.appSecret,
        });
        this.connection.on('close', this.onClose);
        this.connection.on('error', e => console.error(e));
    }
}
exports.getStreamSeaClient = (options) => new StreamSeaClient({ ...options, connectionFactory: new stream_sea_connection_1.StreamSeaConnectionFactory({}) });
