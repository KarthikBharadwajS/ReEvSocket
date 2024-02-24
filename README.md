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

ws.on("my_event", function (payload) {
    console.log(payload);   
})
```

## API

### ReEvSocket(url, options)

#### url
Type: `String`

The URL you want to connect to &mdash; Should be prefixed with `ws://` or `wss://`. This is passed directly to `WebSocket`.
