ReEvSocket is a small wrapper around `WebSocket` which helps you in building event based socket requirement and will also automatically reconnect if the connect is lost.

## Install

```
$ npm install --save reevsocket
```

## Usage
```js
const ReEvSocket = require('reevsocket');

const ws = new ReEvSocket('ws://localhost:3000', {
  timeout: 5000,
  maxAttempts: 10,
  onConnect: e => console.log('Connected!', e),
  onMessage: e => console.log('Ring Ring:', e),
  onReconnecting: e => console.log('Trying to reconnect', e),
  onOverflow: e => console.log('Retry attemps exhausted :(', e),
  onClose: e => console.log('Closed!', e),
  onError: e => console.log('Error:', e)
});

/** Emit events, ws.emit(action, payload) */
ws.emit("my_event", { myKey: myVal })

/** Catch events */
ws.on("my_event", function (payload) {
  console.log(payload);   
});
```

## API

### ReEvSocket(url, options)

#### url
Type: `String`

The URL you want to connect to &mdash; Should be prefixed with `ws://` or `wss://`. This is passed directly to `WebSocket`.

#### options.protocols
Type: `String|Array`

Either a single protocol string or an array of strings used to indicate sub-protocols. See the [`WebSocket` docs][MDN] for more info.

#### options.timeout
Type: `Number`<br>
Default: `1000`

The amount of time (in `ms`) to wait in between reconnection attempts. Defaults to 1 second.

#### options.maxAttempts
Type: `Number`<br>
Default: `Infinity`

The maximum number of attempts to reconnect. Pass `-1` if you want to disable retry logic.

#### options.onConnect
Type: `Function`

The `EventListener` to run in response to `'open'` events. It receives the `Event` object as its only parameter.

> This is called when the connection has been established and is ready to send and receive data.

> **Important:** on successful connection old retries counter will get reset, so that the next time connection is lost, you will consistently retry `n` number of times, as determined by `options.maxAttempts`.

#### options.onMessage
Type: `Function`

The `EventListener` to run in response to `'message'` events. It receives the `Event` object as its only parameter.

> This is called when a message has been received from the server. You'll probably want `event.data`!

#### options.onReconnecting
Type: `Function`

The callback to run when attempting to reconnect to the server.

#### options.onOverflow
Type: `Function`

The callback to run when the [`maxAttempts`](#optionsmaxattempts) limit has been met.

#### options.onClose
Type: `Function`

The `EventListener` to run in response to `'close'` events. It receives the `Event` object as its only parameter.

> This is called when the connection has been closed for any reason.

> **Important:** If the `event.code` is _not_ `1000`, `1001`, or `1005` an automatic reconnect attempt will be queued.

#### options.onError
Type: `Function`

The `EventListener` to run in response to `'error'` events. It receives the `Event` object as its only parameter.

> This is called anytime an error occurs.

> **Important:** If the `event.code` is `ECONNREFUSED`, an automatic reconnect attempt will be queued.

### send(data)

It is a native to [`WebSocket.send()`][send]

### on(event, listener)

Event listener method which helps you in building event based socket implementations.

Example for emitting events from external sources like API Gateway
```js
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const client = new ApiGatewayManagementApiClient({ endpoint, region });

const requestParams = {
  ConnectionId: connectionId,
  Data: { "action": "my_custom_event", "payload": "HELLO WORLD" },
};

const command = new PostToConnectionCommand(requestParams);
await client.send(command);
```

Example for catching events at the client end
```js
ws.on("my_custom_event", function (payload) { 
  // ... perform operation
  console.log(payload) // prints HELLO WORLD
})
```

### emit(action, json)

Helps in emitting event based messages

Example:
```js
ws.emit("my_custom_event", { message: "HELLO WORLD" })
```

### close(code, reason)

It is native to [`WebSocket.close()`][close].

> **Note:** The `code` will default to `1000` unless specified.

### json(obj)

Convenience method that passes your `obj` (Object) through `JSON.stringify` before passing it to [`WebSocket.send()`][send].

### retry()

If [`options.maxAttempts`](#optionsmaxattempts) has not been exceeded, enqueues a reconnection attempt. Otherwise, it runs your [`options.onOverflow`](#optionsonoverflow) callback.

### start()

Initializes a new `WebSocket` &mdash; used on initialization and by [`retry()`](#retry).
