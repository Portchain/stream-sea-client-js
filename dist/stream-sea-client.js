"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const stream_sea_connection_1 = require("./stream-sea-connection");
const utils_1 = require("./utils");
const logger = __importStar(require("./logger"));
/**
 * A StreamSeaClient manages a StreamSeaConnection, restarting it if necessary
 *
 * Events:
 *   error - non-recoverable error. The client should be re-configured
 *
 * Public methods:
 *   addSubscription: (subscription: IStreamSeaSubscription) => void
 */
class StreamSeaClient extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.subscriptions = [];
        this.RECONNECT_INTERVAL_MS = 3000;
        this.CONNECTION_FAILURE_ALERT_THRESHOLD = 20; // Log an error after this many consecutive failures
        this.consecutiveConnectionFailures = 0;
        this.attachConnectionEventHandlers = () => {
            this.connection.on('open', this.onConnectionOpen);
            this.connection.on('close', this.onConnectionClose);
            this.connection.on('error', this.onConnectionError);
            this.connection.on('warning', this.onConnectionWarning);
        };
        this.onConnectionOpen = () => {
            this.consecutiveConnectionFailures = 0;
        };
        this.onConnectionError = (e) => {
            this.emit('error', e);
        };
        this.onConnectionWarning = (w) => {
            logger.warn(w);
        };
        this.onConnectionClose = () => {
            this.consecutiveConnectionFailures++;
            const errorMessage = `StreamSeaClient: Connection closed for the ${this.consecutiveConnectionFailures} time consecutively`;
            if (this.consecutiveConnectionFailures === this.CONNECTION_FAILURE_ALERT_THRESHOLD) {
                logger.error(errorMessage);
            }
            else {
                logger.warn(errorMessage);
            }
            setTimeout(this.reopenConnection, this.RECONNECT_INTERVAL_MS);
        };
        this.reopenConnection = () => {
            logger.warn('StreamSeaClient: Reopening connection');
            this.connection = this.options.connectionFactory.createConnection({
                url: `${utils_1.getWsURLScheme(this.options.secure)}://${this.options.remoteServerHost}:${this.options.remoteServerPort}/api/v1/streams`,
                appId: this.options.appId,
                appSecret: this.options.appSecret,
            });
            this.attachConnectionEventHandlers();
            this.subscriptions.forEach(subscription => this.connection.addSubscription(subscription));
        };
        this.addSubscription = (subscription) => {
            this.subscriptions.push(subscription);
            this.connection.addSubscription(subscription);
        };
        this.options = options;
        this.connection = options.connectionFactory.createConnection({
            url: `${utils_1.getWsURLScheme(options.secure)}://${options.remoteServerHost}:${options.remoteServerPort}/api/v1/streams`,
            appId: options.appId,
            appSecret: options.appSecret,
        });
        this.attachConnectionEventHandlers();
    }
}
exports.StreamSeaClient = StreamSeaClient;
exports.getStreamSeaClient = (options) => new StreamSeaClient({ ...options, connectionFactory: new stream_sea_connection_1.StreamSeaConnectionFactory({}) });
