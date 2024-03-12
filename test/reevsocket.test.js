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
}, 10000);

test("should disconnect if the pong heartbeat is not recieved", (done) => {
  wsServer.on("connection", (socket) => {
    socket.on("message", (message) => {
      const data = JSON.parse(message);
      if (data.action === "ping") {
        // done();
      }
    });
  });

  const wsController = reevsocket(url, {
    heartbeatInterval: 100,
    onClose: function (e) {
      if (e.code === 3000 && e.wasClean === true) {
        done();
      } else {
        done(new Error("failed"));
      }
    },
  });
}, 10000);

test("on heartbeat failure, should attempt to reconnect", (done) => {
  let connectionAttempts = 0;
  wsServer.on("connection", (socket) => {
    connectionAttempts++;
    if (connectionAttempts === 2) {
      expect(connectionAttempts).toBe(2);
      done();
    }
    socket.on("message", (message) => {});
  });

  const wsController = reevsocket(url, {
    heartbeatInterval: 100,
    maxAttempts: 2,
    delay: 100,
  });
}, 20000);

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

test("should submit metadata on events", (done) => {
  const testAction = "sendMessage";
  const testData = { content: "Hello, World!" };
  const testMetadata = { id: "abcd" };

  wsServer.on("connection", (socket) => {
    socket.on("message", (message) => {
      const { action, payload, metadata } = JSON.parse(message);
      expect(action).toBe(testAction);
      expect(payload).toEqual(testData);
      expect(metadata).toEqual(testMetadata);
      done();
    });
  });

  const wsController = reevsocket(url, {
    onConnect: function () {
      wsController.setMetadata(testMetadata);
      wsController.emit(testAction, testData);
    },
    onError: function (e) {
      done(error);
    },
  });
}, 10000);

test("should send isConnected true when connection is live", (done) => {
  wsServer.on("connection", (socket) => {
    expect(socket).toBeDefined();
  });

  const wsController = reevsocket(url, {
    onConnect: function () {
      const isLive = wsController.isConnected();
      expect(isLive).toBe(true);
      done();
    },
    onError: function (error) {
      done(error);
    },
  });
}, 5000);

test("should send isConnected false when connection is closed or closing", (done) => {
  wsServer.on("connection", (socket) => {
    expect(socket).toBeDefined();
  });

  const wsController = reevsocket(url, {
    onConnect: function () {
      const isLive = wsController.isConnected();
      expect(isLive).toBe(true);

      wsController.close(1000, "Intentional Closure");
      const isClosed = wsController.isConnected();
      expect(isClosed).toBe(false);
      done();
    },
    onError: function (error) {
      done(error);
    },
  });
}, 5000);
