/**
 * @param {string} url
 * @param {object} [options]
 * @param {number} [options.maxAttempts=Infinity] - maximum number of reconnection attempts, will be ignored if retry is set to exponential
 * @param {number} [options.delay=10000] - time between reconnection attempts
 * @param {number} [options.exponentialFactor=0] - exponential backoff factor
 * @param {number} [options.maxDelay=30000] - the threshold for the exponential factor
 * @param {number} [options.heartbeatInterval]
 * @param {boolean} [options.disableHeartbeat]
 * @param {number} [options.pongTimeoutInterval]
 * @param {object} [options.metadata]
 * @param {boolean} [options.enableAcknowledge] - enabled acknowledge of recieved event
 * @param {function} [options.onConnect] - when a connection is established
 * @param {function} [options.onClose] - when a connection is closed
 * @param {function} [options.onMessage] - on recieving a message
 * @param {function} [options.onError] - when a connection has error
 * @param {function} [options.onReconnecting] - when there is a attempt of retry
 * @param {function} [options.onOverflow] - when the attempts threshold is exhausted
 * @param {string[]} [options.protocols] - Either a single protocol string or an array of protocol strings. These strings are used to indicate sub-protocols, so that a single server can implement multiple WebSocket sub-protocols
 */
module.exports = function (url, options) {
  options = options || {};
  var metadata = options.metadata || null;
  var ws;
  var retryCount = 0;
  var retryTimer;
  var events = {};
  var heartbeatTimer, pongTimer;
  var def_heartbeat_interval = 30000;
  var def_max_delay = 30000;

  function noop() {}

  var controller = {
    start: function () {
      if (ws) {
        ws.close(1000, "Restarting connection"); // close an existing connection
      }
      ws = new WebSocket(url, options.protocols || []);

      ws.onopen = function (event) {
        resetRetryCounter();
        (options.onConnect || noop)(event);
        setupHeartbeat(); // start the heartbeat
      };

      ws.onmessage = function (event) {
        (options.onMessage || noop)(event);
        try {
          var message = JSON.parse(event.data);
          if (message.action && events[message.action]) {
            controller.eventify(message.action, message.payload);
            controller.sendAck(message.action);
          }
        } catch (error) {
          console.error("Error parsing message: ", error);
        }
        clearTimeout(pongTimer);
        setupHeartbeat(); // Reset the heartbeat timer on any message
      };

      ws.onerror = function (event) {
        (options.onError || noop)(event);
        scheduleRetry(event);
      };

      ws.onclose = function (event) {
        (options.onClose || noop)(event);
        if (event.code !== 1000) {
          scheduleRetry(event);
        }
      };
    },

    setMetadata: function (data) {
      metadata = data;
    },

    sendAck: function (action) {
      if (action && options.enableAcknowledge) {
        controller.emit("ack", { recieved: action });
      }
    },

    on: function (event, listener) {
      if (!events[event]) {
        events[event] = [];
      }
      events[event].push(listener);
    },

    eventify: function (event, ...args) {
      if (events[event]) {
        events[event].forEach(function (listener) {
          listener.apply(null, args);
        });
      }
    },

    emit: function (action, data) {
      if (!action) return;
      data = data || null;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: action, payload: data, metadata }));
      }
    },

    retry: function (event) {
      if (retryCount < options.maxAttempts || Infinity) {
        var delay = calculateRetryDelay();
        retryTimer = setTimeout(function () {
          retryCount++;
          controller.start();
          (options.onReconnecting || noop)(event);
        }, delay);
      } else {
        (options.onOverflow || noop)(event);
        clearRetryTimer();
      }
    },

    close: function (code, reason) {
      if (ws) {
        ws.close(code || 1000, reason);
      }
      clearTimers();
    },

    json: function (value) {
      try {
        ws.send(JSON.stringify(value));
      } catch (error) {
        console.error(error);
      }
    },

    send: function (value) {
      if (ws) {
        ws.send(value);
      }
    },

    isConnected: function () {
      return (
        ws &&
        ws.readyState !== WebSocket.CLOSED &&
        ws.readyState !== WebSocket.CLOSING
      );
    },
  };

  function calculateRetryDelay() {
    var backoff = options.exponentialFactor || 0;
    var def_delay = 10000;
    var delay =
      backoff === 0
        ? options.delay || def_delay
        : Math.min(
            (options.delay || def_delay) * Math.pow(backoff, retryCount),
            options.maxDelay || def_max_delay
          );
    delay += Math.random() * 1000; // Add jitter
    return delay;
  }

  function resetRetryCounter() {
    retryCount = 0;
  }

  function scheduleRetry(event) {
    clearTimers();
    controller.retry(event);
  }

  function setupHeartbeat() {
    if (options.disableHeartbeat) return;
    clearTimeout(heartbeatTimer);
    heartbeatTimer = setTimeout(function () {
      if (ws.readyState === WebSocket.OPEN) {
        controller.emit("ping", null); // Send a ping message
      }
    }, options.heartbeatInterval || def_heartbeat_interval);

    // Setup pong message expectation
    clearTimeout(pongTimer);
    pongTimer = setTimeout(function () {
      console.log("Heartbeat failed");
      controller.close(1013, "Heartbeat failed");
    }, options.pongTimeoutInterval ||
      (options.heartbeatInterval || def_heartbeat_interval) + 5000);
  }

  function clearTimers() {
    clearTimeout(retryTimer);
    clearTimeout(heartbeatTimer);
    clearTimeout(pongTimer);
  }

  // Network change detection
  if (typeof window !== "undefined") {
    window.addEventListener("online", function () {
      controller.start();
    });
    window.addEventListener("offline", function () {
      controller.close(1011, "Browser is offline");
    });
  }

  controller.start();
  return controller;
};
