// Mocks and utilities
const WebSocket = require("ws"); // Use 'ws' in Node.js environment
let wsServer, url;
const reevsocket = require("../dist/index.min.js");

beforeEach(() => {
  // Set up a WebSocket server for testing
  wsServer = new WebSocket.Server({ port: 0 });
  url = `ws://localhost:${wsServer.address().port}`;
});

afterEach((done) => {
  // Terminate all clients
  wsServer.clients.forEach((client) => client.terminate());

  // Close the server
  wsServer.close(() => {
    done();
  });
});

test("should establish a WebSocket connection", (done) => {
  wsServer.on("connection", (socket) => {
    expect(socket).toBeDefined();
    done();
  });

  const wsController = reevsocket(url);
});

test("should attempt to reconnect on connection loss", (done) => {
  let connectionAttempts = 0;

  wsServer.on("connection", (ws) => {
    connectionAttempts++;
    if (connectionAttempts === 1) {
      // Simulate a disconnection without closing the server
      ws.close();
    } else if (connectionAttempts === 2) {
      expect(connectionAttempts).toBe(2);
      done();
    }
  });

  reevsocket(url, {
    maxAttempts: 2,
    delay: 100,
  });
}, 10000);

test("should send heartbeat messages", (done) => {
  wsServer.on("connection", (socket) => {
    socket.on("message", (message) => {
      const data = JSON.parse(message);
      if (data.action === "ping") {
        done();
      }
    });
  });

  const wsController = reevsocket(url, {
    heartbeatInterval: 100,
  });
});

test("should handle custom events", (done) => {
  const testPayload = { key: "value" };
  wsServer.on("connection", (socket) => {
    socket.send(JSON.stringify({ action: "testEvent", payload: testPayload }));
  });

  const wsController = reevsocket(url);
  wsController.on("testEvent", (payload) => {
    expect(payload).toEqual(testPayload);
    done();
  });
});

test("should send messages through WebSocket", (done) => {
  const testAction = "sendMessage";
  const testData = { content: "Hello, World!" };

  wsServer.on("connection", (socket) => {
    socket.on("message", (message) => {
      const { action, payload } = JSON.parse(message);
      expect(action).toBe(testAction);
      expect(payload).toEqual(testData);
      done();
    });
  });

  const wsController = reevsocket(url, {
    onConnect: function () {
      wsController.emit(testAction, testData);
    },
    onError: function (e) {
      done(error);
    },
  });
}, 10000);
