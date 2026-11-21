// Playground CLI 3.1.64 calls listen(port); constrain this local process to loopback.
const net = require("node:net");
const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  if (typeof args[0] === "number" && (args.length === 1 || typeof args[1] === "function")) {
    args.splice(1, 0, "127.0.0.1");
  }
  return originalListen.apply(this, args);
};
