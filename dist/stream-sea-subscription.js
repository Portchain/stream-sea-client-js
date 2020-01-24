"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
// States: <none>
// Events:
//   message
// Public methods:
// constructor(streamName: string)
class StreamSeaSubscription extends events_1.EventEmitter {
    constructor(streamName) {
        super();
        this.streamName = streamName;
    }
}
exports.StreamSeaSubscription = StreamSeaSubscription;
