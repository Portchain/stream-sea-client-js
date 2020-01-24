"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
// Statuses:
//   connecting
//   connected
// Events:
//   error
// Public methods:
//   addSubscription(streamName: string): ISubscription
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
        this.addSubscription = (subscription) => {
            this.subscriptions.push(subscription);
        };
        this.options = options;
        this.connection = options.connectionFactory.createConnection();
    }
}
exports.StreamSeaClient = StreamSeaClient;
