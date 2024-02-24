function noop() {};

/**
 * 
 * @param {string} url
 * @param {object} [options]
 * @param {number} [options.maxAttempts=Infinity] - maximum number of reconnection attempts, will be ignored if retry is set to exponential
 * @param {number} [options.timeout=1000] - time between reconnection attempts
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

    var ws, num = 0, timer = 1, controller = {};

    var max = options.maxAttempts || Infinity;
    var default_timeout = 1e3;
    var events = {}; // Event registry

    // Register an event listener
    controller.on = function (event, listener) {
        if (!events[event]) {
            events[event] = [];
        }
        events[event].push(listener);
    };

    // Trigger an event
    controller.event = function (event, ...args) {
        if (events[event]) {
            events[event].forEach(function (listener) {
                listener.apply(null, args);
            });
        }
    };

    controller.emit = function (action, json) {
        if (!action || !json) return;
        ws.send(JSON.stringify({ action: action, payload: json }));
    }

    controller.start = function () {
        ws = new WebSocket(url, options && options.protocols || []);

        ws.onmessage = function(e) {
            (options && options.onMessage || noop)(e);

            var message = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
            if (message.action && events[message.action]) {
                controller.event(message.action, message);
            }
        };

        ws.onopen = function (e) {
            (options && options.onConnect || noop)(e);
            num = 0;
        }

        /**
         * 1e3 or 1000 means normal closure
         * 1001 means going away which indicates that a server is shutting down or a browser tab is being closed
         * 1005 means no status recieved
         */
        ws.onclose = function (e) {
            if (e.code === 1e3 || e.code === 1001 || e.code === 1005) {
                controller.retry(e);
            } else {
                (options && options.onClose || noop)(e);
            }
        }

        ws.onerror = function (e) {
            if (e && e.code && e.code === "ECONNREFUSED") {
                controller.retry(e);
            } else {
                (options && options.onError || noop)(e);
            }
        }
    }

    controller.retry = function (e) {
        if (timer && num++ < max) {
            timer = setTimeout(function () {
                (options && options.onReconnecting || noop)(e);
                controller.start();
            }, (options && options.timeout) || default_timeout)
        } else {
            (options && options.onOverflow || noop)(e);
        }
    }

    controller.json = function (value) {
        try {
            ws.send(JSON.stringify(value));
        } catch (error) {
            console.error(error);
        }
    }

    controller.send = function (value) {
        ws.send(value);
    }

    controller.close = function (code, reason) {
        timer = clearTimeout(timer);
        ws.close(code || 1e3, reason);
    }

    controller.start();

    return controller;
}