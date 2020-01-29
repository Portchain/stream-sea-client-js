/// <reference types="node" />
import { EventEmitter } from 'events';
import { IStreamSeaConnectionFactory } from './stream-sea-connection';
import { IStreamSeaSubscription } from './stream-sea-subscription';
interface StreamSeaClientOptions {
    remoteServerHost: string;
    remoteServerPort: string;
    secure: boolean;
    appId: string;
    appSecret: string;
}
/**
 * A StreamSeaClient manages a StreamSeaConnection, restarting it if necessary
 *
 * Events:
 *   error - non-recoverable error. The client should be re-configured
 *
 * Public methods:
 *   addSubscription: (subscription: IStreamSeaSubscription) => void
 */
export declare class StreamSeaClient extends EventEmitter {
    private options;
    private connection;
    private subscriptions;
    private RECONNECT_INTERVAL_MS;
    constructor(options: StreamSeaClientOptions & {
        connectionFactory: IStreamSeaConnectionFactory;
    });
    private onConnectionError;
    private onConnectionWarning;
    private onConnectionClose;
    private reopenConnection;
    addSubscription: (subscription: IStreamSeaSubscription) => void;
}
export declare const getStreamSeaClient: (options: StreamSeaClientOptions) => StreamSeaClient;
export {};
