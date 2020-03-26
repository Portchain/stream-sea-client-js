import { Stream, Remote, SchemaDefinition } from './types';
import { StreamSeaSubscription } from './stream-sea-subscription';
export declare const subscribe: (args: Remote & Stream & {
    clientSecret: string;
    fanout?: boolean | undefined;
}) => Promise<StreamSeaSubscription>;
export declare const subscribeWithJwt: (args: Remote & Stream & {
    jwt: string;
    fanout?: boolean | undefined;
}) => Promise<StreamSeaSubscription>;
export declare const publish: (args: Remote & Stream & {
    clientSecret: string;
    payload: any;
}) => Promise<any>;
export declare const defineStream: (args: Remote & Stream & {
    clientSecret: string;
} & SchemaDefinition) => Promise<any>;
export declare const describeStream: (args: Remote & Stream & {
    clientSecret: string;
}) => Promise<any>;
export declare const getSchemaVersionsVector: (args: Remote & {
    clientSecret: string;
    schemaNames: string[];
}) => Promise<any>;
export declare const createClient: (args: Remote & {
    clientSecret: string;
    targetClientId: string;
    targetClientDescription: string;
}) => Promise<any>;
export declare const deleteClient: (args: Remote & {
    clientSecret: string;
    targetClientId: string;
}) => Promise<any>;
export declare const rotateClientSecret: (args: Remote & {
    clientSecret: string;
}) => Promise<any>;
export declare const rotateClientJwtPublicKey: (args: Remote & {
    clientSecret: string;
    jwtPublicKey: string | null;
}) => Promise<any>;
