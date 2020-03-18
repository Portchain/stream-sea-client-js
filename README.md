An isomorphic client library for stream-sea

# Compatibility
This library is compatible with stream-sea ^2.3 (i.e. 2.3 <= stream-sea < 3.0)

# For users

# For developers

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
  - A `jwt` field of JSON type `string` containing the stream-sea JWT that is signed and serialized using the client JWT secret and RFC 7515 JWS Compact Serialization
- The server must respond to an Authentication Request message with exactly one Authentication Response message

### Stream-sea JWT
- The stream-sea JWT is a JSON object
- The stream-sea JWT must have an `exp` field of JSON type `number`. This must contain the expiration time as a UNIX timestamp as per RFC 7515
- The stream-sea JWT must have an `mustFanout` field of JSON type `boolean`. If true, the client must use fanout mode for all subscriptions.

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