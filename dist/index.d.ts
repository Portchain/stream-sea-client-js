import { Stream, Remote, SchemaDefinition } from './types';
import { StreamSeaSubscription } from './stream-sea-subscription';
export declare const subscribe: (args: Remote & Stream & {
    fanout?: boolean | undefined;
}) => Promise<StreamSeaSubscription>;
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
