An isomorphic client library for stream-sea

# Compatibility
This library is compatible with stream-sea ^4.0 (i.e. 4.0 <= stream-sea < 5.0)

# API Reference

#### publish(args: Remote & {stream: string, clientSecret: string, payload: any})
Publish a message to a stream.
- `stream: string` - The name of the stream to publish to
- `clientSecret: string` - The client secret used to authenticate the client
- `payload: any` - The message payload to send

#### describeStream(args: Remote & {stream: string, clientSecret: string})
Read a schema definition for a stream
- `stream: string` - The name of the stream
- `clientSecret: string` - The client secret used to authenticate the client

#### defineStream(args: Remote & Stream & {clientSecret: string} & SchemaDefinition)
Write a schema definition for a stream
- `stream: string` - The name of the stream
- `clientSecret: string` - The client secret used to authenticate the client
If a schema definition with the same name and version number already exists, the existing definition will not be overwritten.
The returned promise will resolve if the new definition is the same as the existing definition, and reject otherwise.

#### getSchemaVersionsVector(args: Remote & { clientSecret: string, schemaNames: string[]})
Read the version numbers for multiple streams
- `clientSecret: string` - The client secret used to authenticate the client
- `schemaNames: string[]` - The names of the streams
This function will return an array `retVal` with the same length as `schemaNames`. For every `i`, if the stream with name `schemaNames[i]` exists, then the value of `retVal[i]` will be that stream's version number. If the stream with name `schemaNames[i]` does not exist, then the value of `retVal[i]` will be `null`.

#### createClient(args: Remote & { clientSecret: string, targetClientId: string, targetClientDescription: string })
Create another client in the same jail
- `clientSecret: string` - The client secret used to authenticate the current client
- `targetClientId: string` - The client ID of the new client
- `targetClientDescription: string` - The description of the new client
The client secret will be generated on the server and returned in the `secret` field of the result.

#### deleteClient(args: Remote & { clientSecret: string, targetClientId: string })
Delete another client in the same jail
- `clientSecret: string` - The client secret used to authenticate the current client
- `targetClientId: string` - The client ID of the client to delete

#### rotateClientSecret(args: Remote & { clientSecret: string })
Rotate the client secret for this client
- `clientSecret: string` - The client secret used to authenticate the current client
The new client secret will be generated on the server and returned in the `secret` field of the result.

#### rotateClientJwtPublicKey(args: Remote & { clientSecret: string, jwtPublicKey: string | null})
Rotate the JWT public key for this client
- `clientSecret: string` - The client secret used to authenticate the current client
- `jwtPublicKey: string | null` - The new JWT public key

#### subscribe(args: Remote & Stream & {clientSecret: string, fanout?: boolean})
Subscribe to a single stream indefinitely using basic authentication
- `clientSecret: string` - The client secret used to authenticate the current client
- `fanout?: boolean` - If true, compete for messages with other instances of this client that also have fanout=true
Note: for a more flexible subscription API use the StreamSeaClient object

#### subscribeWithJwt(args: Remote & Stream & {jwt: string, fanout?: boolean})
Subscribe to a single stream indefinitely using JWT authentication
- `clientSecret: string` - The client secret used to authenticate the current client
- `fanout?: boolean` - If true, compete for messages with other instances of this client that also have fanout=true
Note: for a more flexible subscription API use the StreamSeaClient object

#### interface Remote
The `Remote` interface identifies a remote stream-sea server and transport-level connection options. All API methods require a `Remote` as part of their args.
The `Remote` interface has the following fields:
- `remoteServerHost: string` - The DNS name of the remote server
- `remoteServerPort: string` - The port of the remote server
- `secure: boolean` - If true, TLS is used on the transport layer (HTTPS/WSS instead of HTTP/WS)
- `clientId: string` - The client ID

#### interface SchemaDefinition
The `SchemaDefinition` interface defines a schema for a stream.
The `SchemaDefinition` interface has the following fields:
- `name: string` - The name of the schema. Currently the name of the schema must be equal to the name of the stream.
- `version: number` - The version number of the schema.
- `fields: SchemaField[]` - The set of fields in the schema. Fields are treated as an unordered set, so the order of this array does not matter.

#### interface SchemaField
The `SchemaField` interface defines a single field in a schema.
The `SchemaField` interface has the following fields:
- `name: string` - The name of the field
- `type: FieldType` - The type of the field

The following field types are supported:
- `FieldType.STRING` - Any string
- `FieldType.FLOAT` - Any JSON-serializable floating point value
- `FieldType.INTEGER` - Any JSON-serializable integer
- `FieldType.DATE` - A UTC date string in the format "YYYY-MM-DDTHH:mm:ssZ"
- `FieldType.STRING_ARRAY` - An array of `FieldType.STRING`
- `FieldType.FLOAT_ARRAY` - An array of `FieldType.FLOAT`
- `FieldType.INTEGER_ARRAY` - An array of `FieldType.INTEGER`
- `FieldType.DATE_ARRAY` - An array of `FieldType.DATE`
- `FieldType.ENUM` - A string restricted to a finite set of values. A `SchemaField` of type `FieldType.ENUM` will have an `enum` field of type `string[]` listing the allowed values.
- `FieldType.OBJECT` - A JSON object. A `SchemaField` of type `FieldType.ENUM` will have a `fields` field of type `SchemaField[]`. This allows you to nest schema definitions.
- `FieldType.OBJECT_ARRAY` - An array of `FieldType.OBJECT`

#### Stream-sea JWT
Clients can create JWTs that give the bearer partial access to stream-sea. In order to do this, they need to create an RSA keypair. The public key should be added to stream-sea using the rotateClientJwtPublicKey method.

- The JWT payload is a JSON object with the following fields:
  - `exp: number` - This must contain the expiration time as a UNIX timestamp as per RFC 7515.
  When the expiration time passes, the JWT bearer's connection will be closed and they will not be allowed to re-connect.
  - `mustFanout: boolean` - If true, the JWT bearer is forced to use fanout mode for all subscriptions.
  - `filter?: FdslExpr` - If present, this field defines rules for which messages the JWT bearer is allowed to receive. If absent, the JWT bearer can receive any message
  from any stream in the same jail. See the Filter DSL section for a detailed description of filter DSL expressions.
- The JWT is created by signing the JWT payload using the client's JWT private key with the RS512 algorithm, and serializing the result to a string using RFC 7515 JWS Compact Serialization

#### Filter DSL
When a JWT-authenticated client has a `filter` field in their JWT, stream-sea will perform filtering before forwarding messages to the client. When a message becomes available, stream-sea will evaluate the filter expression in the context of that message. If the resulting value is truthy, the message is forwarded to the client. If the resulting value is falsy or an error is encountered during evaluation, the message is not forwarded to the client.

#### FDSL leaf nodes
##### FdslLiteralStringExpr
```
{
  t: 'string'
  e: string
}
```
FdslLiteralStringExpr evaluates to the string in the `e` field

##### FdslLiteralNumberExpr
```
{
  t: 'number'
  e: number
}
```
FdslLiteralStringExpr evaluates to the number in the `e` field

##### FdslLiteralBoolExpr
```
{
  t: 'bool'
  e: boolean
}
```
FdslLiteralBoolExpr evaluates to the boolean in the `e` field

##### FdslLiteralNullExpr
```
{
  t: 'null'
}
```
FdslLiteralNullExpr evaluates to `null`

##### FdslLiteralPathExpr
```
{
  t: 'path',
  e: string
}
```
FdslLiteralPathExpr evalutes to the value found in thee message at JSON path `e`

##### FdslLiteralMetaExpr
```
{
  t: 'meta',
  e: string
}
```
FdslLiteralMetaExpr evalutes to the metadata field named `e`. Currently the only supported value is `"streamName"`, which evaluates to the stream name.

#### FDSL operator nodes

##### FdslEqExpr
```
{
  t: 'eq',
  e: [FdslExpr, FdslExpr]
}
```
FdslEqExpr evalutes to true if the subexpressions `e[0]` and `e[1]` evaluate to the same value, and false otherwise.

##### FdslAndExpr
```
{
  t: 'and',
  e: FdslExpr[]
}
```
FdslAndExpr evalutes to true if the subexpressions in `e` all evaluate to truthy values, and false otherwise.

##### FdslOrExpr
```
{
  t: 'or',
  e: FdslExpr[]
}
```
FdslOrExpr evalutes to true if any of the subexpressions in `e` evaluate to a truthy value, and false otherwise.

##### FdslNotExpr
```
{
  t: 'or',
  e: Fdsl[]
}
```
FdslNotExpr evalutes to true if the subexpression `e` evaluates to a falsy value, and false otherwise.

# Stream-sea-client Developer Documentation

## Stream-sea wire protocol

### Websocket layer
- The stream-sea wire protocol is built on top of the Websocket protocol
- The protocol is initiated by the client establishing a Websocket connection to the server
- As long as the Websocket connection is open, it is the server's responsibility to send Websocket ping messages
at least every 30 seconds to avoid idle connections being closed
- Once a connection is established, the client and server communicate by exchanging Websocket data messages, which will be referred to as just *messages* for the rest of this spec.
- Every message is a JSON object serialized to a string

### Message structure
- Each message has an `id` field of JSON type `number` and a `action` field of JSON type `string`. Here is an example message:
```
{
  "id": 2,
  "action": "subscription",
  "streamName": "boiler_data",
  "payload": {
    "temperature": 92,
    "pressure": 3002
  }
}
```
- The client must send the first message with `id` equal to `1`, and must increase `id` by 1 for each subsequent message
- Each message `x` sent by the server is a response to an earlier message `y` sent by the client. `x` must have the same values of `id` and `action` as `y`
- For some messages `y` sent by the client, the server can reply with multiple messages `x1, x2, ...`. These must all have the same values of `id` and `action` as `y`

### Authentication Request Message
- The client-sent message with `id = 1` must be an Authentication Request message
- Client-sent messages with `id > 1` must not be Authentication Request messages
- An Authentication Request message has an `action` field with value `"authenticate"`
- An Authentication Request message must have a `payload` field of JSON type `object`
- Stream-sea supports two authentication methods: Basic and JWT
- In order to authenticate with the Basic method, the `payload` of the Authentication Request message must have the following fields:
  - A `type` field with value `"basic"`
  - A `clientId` field of JSON type `string`
  - A `clientSecret` field of JSON type `string`
- In order to authenticate with the Basic method, the `payload` of the Authentication Request message must have the following fields:
  - A `type` field with value `"jwt"`
  - A `clientId` field of JSON type `string`
  - A `jwt` field of JSON type `string` containing the stream-sea JWT
- The server must respond to an Authentication Request message with exactly one Authentication Response message

### Authentication Response Message
- An Authentication Response message has an `action` field with value `"authenticate"`
- An Authentication Response message must have a `success` field of JSON type `boolean` which will indicate whether authentication was successful
- If authentication was unsuccessful, the client must close the connection and must not send any more messages

### Subscription Request Message
- The client may subscribe by sending a Subscription Request message
- A Subscription Request message has an `action` field with value `"subscribe"`
- A Subscription Request message has a `payload` field of JSON type `string`. The value of this field must be the name of the stream to subscribe to.
- A Subscription Request message may have a `groupId` field of JSON type `string`. If set, the value of this field must be a UUID in RFC 4122 format (also known as the 8-4-4-4-12 format).
- A Subscription Request message may have multiple responses. The first response must be a Subscription Response message. Each subsequent response must be a Message Delivery message.

### Subscription Response Message
- A Subscription Response message has an `action` field with value `"subscribe"`
- A Subscription Response message has a `streamName` field of JSON type `string`. The value of this field is the name of the stream that was subscribed to.

### Message Delivery
- A Message Delivery message has an `action` field with value `"subscribe"`
- A Message Delivery message has a `payload` field of JSON type `object`. This value of this field is the user-defined message object.

### Example of stream-sea wire protocol exchange

The client authenticates and subscribes to the stream `boiler_data`
The server delivers two messages from the `boiler_data` stream.

```
StreamSeaSocket.send {
  "id":1,
  "action": "authenticate",
  "payload": {
    "type": "basic"
    "clientId": "abc",
    "clientSecret": "def123"
  }
}

StreamSeaSocket.onWsMessage: {
  "id": 1,
  "action": "authenticate",
  "success": true,
  "payload": {
    "jailId": "some_jail"
  }
}


StreamSeaSocket.send {
  "id": 2,
  "action": "subscribe",
  "payload": "boiler_data"
}

StreamSeaSocket.onWsMessage: {
  "id": 2,
  "action": "subscription",
  "success": true,
  "streamName": "boiler_data",
  "payload":2
}

StreamSeaSocket.onWsMessage: {
  "id": 2,
  "action": "subscription",
  "streamName": "boiler_data",
  "payload": {
    "temperature": 91,
    "pressure": 3001
  }
}

StreamSeaSocket.onWsMessage: {
  "id": 2,
  "action": "subscription",
  "streamName": "boiler_data",
  "payload": {
    "temperature": 92,
    "pressure": 3002
  }
}
```