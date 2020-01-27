/// <reference types="node" />
import { EventEmitter } from "events";
import { StreamSeaSubscription } from "./stream-sea-subscription";
export interface IStreamSeaConnectionFactory {
    createConnection: (options: StreamSeaConnectionOptions) => IStreamSeaConnection;
}
export interface StreamSeaConnectionFactoryOptions {
}
export declare class StreamSeaConnectionFactory implements IStreamSeaConnectionFactory {
    private options;
    constructor(options: StreamSeaConnectionFactoryOptions);
    createConnection: (options: StreamSeaConnectionOptions) => StreamSeaConnection;
}
export interface IStreamSeaConnection extends EventEmitter {
    addSubscription: (subscription: StreamSeaSubscription) => void;
}
export interface StreamSeaConnectionOptions {
    url: string;
    appId: string;
    appSecret: string;
}
export declare class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
    private msgCnt;
    private status;
    private subscriptionsQueue;
    private messageCallbacks;
    private sss;
    private options;
    constructor(options: StreamSeaConnectionOptions);
    private onWsOpen;
    private onWsMessage;
    private onWsClose;
    private onWsError;
    private generateNextMessageId;
    addSubscription: (subscription: StreamSeaSubscription) => void;
    private checkSubscriptionsQueue;
    private sendSingleReply;
    private sendMultiReply;
}
