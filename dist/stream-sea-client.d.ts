/// <reference types="node" />
import { EventEmitter } from "events";
import { IStreamSeaConnectionFactory } from "./stream-sea-connection";
import { StreamSeaSubscription } from "./stream-sea-subscription";
interface StreamSeaClientOptions {
    connectionFactory: IStreamSeaConnectionFactory;
}
export declare class StreamSeaClient extends EventEmitter {
    private status;
    private options;
    private connection;
    private subscriptions;
    constructor(options: StreamSeaClientOptions);
    addSubscription: (subscription: StreamSeaSubscription) => void;
}
export {};
