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
  metadata: { "client_id": "123-ABC" }, // pass some metadata on every heartbeat
  enableAcknowledge: true, // send acknowledge of the recieved action
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
| `heartbeatInterval` | `number`   | `150000`     | Interval in milliseconds for sending heartbeat messages. If not specified, the default value is used.                     |
| `disableHeartbeat`  | `boolean`  | `false`    | If true, heartbeat messages are not sent.                                                                                |
| `pongTimeoutInterval`| `number`  | `30000`     | Timeout in milliseconds for expecting a pong response after a heartbeat message. Default is based on `heartbeatInterval`. |
| `onConnect`         | `function` | *None*     | Callback function invoked when a connection is successfully established.                                                 |
| `onClose`           | `function` | *None*     | Callback function invoked when the connection is closed.                                                                 |
| `onMessage`         | `function` | *None*     | Callback function invoked when a message is received.                                                                    |
| `onError`           | `function` | *None*     | Callback function invoked when an error occurs.                                                                          |
| `onReconnecting`    | `function` | *None*     | Callback function invoked during a reconnection attempt.                                                                 |
| `onOverflow`        | `function` | *None*     | Callback function invoked when the maximum number of reconnection attempts is exceeded.                                  |
| `protocols`         | `string[]` | *None*     | Optional protocols for the WebSocket connection. Either a single protocol string or an array of protocol strings.        |
| `metadata` | `object`   | `null`     | Passes metadata on every event object. |
| `enableAcknowledge` | `boolean` | `false` | Sends acknowledge event back on successfully recieving the event |
| `handleApiGatewayDefaults` | `boolean` | `false` | Handles the 10 mins idle timeout + 2 hours connection duration for WebSocket API |

### send(data)

It is a native to [`WebSocket.send()`][send(data)]

> **NOTE**: Does not pass metadata if you use this method

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

### setMetadata()

Set or overwrite metadata which will be submitted on every event

> **Note:** Metadata will be passed on every heartbeat event as well.

### start()

Initializes a new `WebSocket` &mdash; used on initialization and by [`retry()`](#retry()).

### isConnected()

Returns a boolean `true` or `false`.

#### Network Change Detection [Experimental]

This module automatically detects network changes (online/offline events) in browser environments and adjusts the WebSocket connection accordingly.

#### Note

This module is designed for Node.js and browser environments that support the Websocket API. Ensure that your target environment is compatible with WebSockets.

