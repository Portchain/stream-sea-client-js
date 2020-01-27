/// <reference types="node" />
import { EventEmitter } from "events";
import { IStreamSeaConnectionFactory } from "./stream-sea-connection";
import { IStreamSeaSubscription } from "./stream-sea-subscription";
interface StreamSeaClientOptions {
    remoteServerHost: string;
    remoteServerPort: string;
    secure: boolean;
    appId: string;
    appSecret: string;
}
declare class StreamSeaClient extends EventEmitter {
    private status;
    private options;
    private connection;
    private subscriptions;
    constructor(options: StreamSeaClientOptions & {
        connectionFactory: IStreamSeaConnectionFactory;
    });
    private onClose;
    private reopenConnection;
    addSubscription: (subscription: IStreamSeaSubscription) => void;
}
export declare const getStreamSeaClient: (options: StreamSeaClientOptions) => StreamSeaClient;
export {};
