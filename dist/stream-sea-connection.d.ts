/// <reference types="node" />
import { EventEmitter } from "events";
import { StreamSeaSubscription } from "./stream-sea-subscription";
export interface IStreamSeaConnectionFactory {
    createConnection: () => IStreamSeaConnection;
}
export interface StreamSeaConnectionFactoryOptions {
}
export declare class StreamSeaConnectionFactory implements IStreamSeaConnectionFactory {
    private options;
    constructor(options: StreamSeaConnectionFactoryOptions);
    createConnection: () => StreamSeaConnection;
}
export interface IStreamSeaConnection extends EventEmitter {
    addSubscription: (subscription: StreamSeaSubscription) => void;
}
export interface StreamSeaConnectionOptions {
}
export declare class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
    private subscriptions;
    constructor(options: StreamSeaConnectionOptions);
    addSubscription: (subscription: StreamSeaSubscription) => void;
}
