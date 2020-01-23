/// <reference types="node" />
import { Stream, Remote, SchemaDefinition } from './types';
import { EventEmitter } from 'events';
export declare const subscribe: (args: Remote & Stream) => Promise<EventEmitter>;
export declare const publish: (args: Remote & Stream & {
    payload: any;
}) => Promise<any>;
export declare const defineStream: (args: Remote & Stream & SchemaDefinition) => Promise<any>;
export declare const describeStream: (args: Remote & Stream & SchemaDefinition) => Promise<any>;
export declare const createClient: (args: Remote & {
    description: string;
}) => Promise<any>;
export declare const deleteClient: (args: Remote & {
    clientId: string;
}) => Promise<any>;
export declare const rotateClientSecret: (args: Remote & {
    clientId: string;
}) => Promise<any>;
