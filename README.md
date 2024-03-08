# ReEvSocket

ReEvSocket is a small wrapper around `WebSocket` which helps you in building event based socket requirement and will also automatically reconnect if the connect is lost.
This module provides a comprehensive solution for managing WebSocket connections, including automatic retries, heartbeat for connection health, and event handling. It's designed to ensure persistent and reliable connections, making it especially useful for applications that require constant data exchange over WebSockets.

## Install

```
$ npm install --save reevsocket
```

## Features

- **Automatic Reconnection**: Supports automatic reconnection with configurable delay and maximum attempts.
- **Exponential Backoff**: Option to use exponential backoff strategy for reconnection attempts.
- **Heartbeat**: Sends periodic "ping" messages to check connection health and automatically reconnects if the connection is lost.
- **Event Handling**: Simplified event subscription to handle incoming messages and WebSocket events (open, close, error).
- **Extensible**: Supports custom protocols and allows passing additional options for WebSocket initialization.


## Usage
```js
const ReEvSocket = require('reevsocket');

const ws = new ReEvSocket('ws://localhost:3000', {
  delay: 10000, // Time between reconnection attempts
  maxAttempts: 10, // Maximum number of reconnection attempts
  exponentialFactor: 2, // Exponential backoff factor
  maxDelay: 30000, // Maximum delay for reconnection attempts
  heartbeatInterval: 30000, // Interval for sending heartbeat messages
  disableHeartbeat: false, // Set to true to disable heartbeat messages
  pongTimeoutInterval: 35000, // Timeout interval for expecting pong response
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

#### options
Type: `Object`

## Configuration Options

The WebSocket Connection Manager accepts an `options` object for configuration. Below is a table describing each available option:

| Option              | Type       | Default    | Description                                                                                                              |
|---------------------|------------|------------|--------------------------------------------------------------------------------------------------------------------------|
| `maxAttempts`       | `number`   | `Infinity` | Maximum number of reconnection attempts.                                                                                 |
| `delay`             | `number`   | `10000`    | Time between reconnection attempts in milliseconds.                                                                      |
| `exponentialFactor` | `number`   | `0`        | Exponential backoff factor for reconnection attempts. A value of `0` indicates no exponential backoff.                   |
| `maxDelay`          | `number`   | `30000`    | Maximum delay between reconnection attempts in milliseconds, applicable when exponential backoff is used.                |
| `heartbeatInterval` | `number`   | `30000`     | Interval in milliseconds for sending heartbeat messages. If not specified, the default value is used.                     |
| `disableHeartbeat`  | `boolean`  | `false`    | If true, heartbeat messages are not sent.                                                                                |
| `pongTimeoutInterval`| `number`  | `30000`     | Timeout in milliseconds for expecting a pong response after a heartbeat message. Default is based on `heartbeatInterval`. |
| `onConnect`         | `function` | *None*     | Callback function invoked when a connection is successfully established.                                                 |
| `onClose`           | `function` | *None*     | Callback function invoked when the connection is closed.                                                                 |
| `onMessage`         | `function` | *None*     | Callback function invoked when a message is received.                                                                    |
| `onError`           | `function` | *None*     | Callback function invoked when an error occurs.                                                                          |
| `onReconnecting`    | `function` | *None*     | Callback function invoked during a reconnection attempt.                                                                 |
| `onOverflow`        | `function` | *None*     | Callback function invoked when the maximum number of reconnection attempts is exceeded.                                  |
| `protocols`         | `string[]` | *None*     | Optional protocols for the WebSocket connection. Either a single protocol string or an array of protocol strings.        |

#### options.protocols
Type: `String|Array`

Either a single protocol string or an array of strings used to indicate sub-protocols. See the [`WebSocket` docs][MDN] for more info.

#### options.disableHeartbeat
Type: `Boolean`
Default: `false`

Disables heartbeat feature, if heartbeat is enabled, the client calls an `action: "ping"` request to the server with the provided [heartbeatInterval](#optionsheartbeatinterval) and expects pong response back, if server fails to send `action: "pong"` back, then the module tries the reconnection attempt again.

#### options.heartbeatInterval
Type: `Number`<br>
Default: `30000`

Beyond just attempting to reconnect on disconnects or errors, actively monitor the health of the WebSocket connection. Implement heartbeats or ping/pong messages to ensure the connection is alive. If the connection appears unresponsive, proactively initiate a reconnection.

#### options.pongTimeoutInterval
Type: `Number`<br>
Default: `30000`

Defines when the to decide socket is closed

#### options.delay
Type: `Number`<br>
Default: `10000`

The minimum amount of time (in `ms`) to wait in between reconnection attempts. Defaults to 10 second. If [`exponentialFactor`](#optionsexponentialFactor) is not set, then [`delay`](#optionsdelay) will work as a static delay between each attempt.

#### options.maxAttempts
Type: `Number`<br>
Default: `Infinity`

The maximum number of attempts to reconnect. Pass `-1` if you want to disable retry logic.

#### options.exponentialFactor
Type: `Number`<br>
Default: `0`

The exponential backoff factor for the delay to scale with between each reconnect attempts. The value cannot be `Infinity`.

#### options.maxDelay
Type: `Number`<br>
Default: `30000`

This field only takes effect when [`exponentialFactor`](#optionsexponentialFactor) is set to a number. This makes sure, delay does not cross the given threshold.

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

It is a native to [`WebSocket.send()`][send(data)]

### on(event, listener)

Registers an event listener for a custom event.

* `event`: Name of the event.
* `listener`: Callback function to be executed when the event occurs.

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

Initializes a new `WebSocket` &mdash; used on initialization and by [`retry()`](#retry()).

#### Network Change Detection [Experimental]

This module automatically detects network changes (online/offline events) in browser environments and adjusts the WebSocket connection accordingly.

#### Note

This module is designed for Node.js and browser environments that support the Websocket API. Ensure that your target environment is compatible with WebSockets.

