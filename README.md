### For users

### For developers

Here is an example of a stream sea socket protocol conversation.

The client authenticates and requests 1 subscription for the stream `boiler_data`
The server sends one message for the stream `boiler_data`

```
StreamSeaSocket.send {
	"id":1,
	"action": "authenticate",
	"payload": {
		"username": "some_username",
		"password": "some_password"
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
```