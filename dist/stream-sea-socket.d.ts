/// <reference types="node" />
import { EventEmitter } from "events";
export interface IStreamSeaSocket extends EventEmitter {
    send: (m: any) => void;
}
export declare class StreamSeaSocket extends EventEmitter implements IStreamSeaSocket {
    private ws;
    private heartbeatInterval?;
    constructor(url: string);
    private onWsOpen;
    private onWsMessage;
    private onWsClose;
    private onWsError;
    send: (m: any) => void;
}
