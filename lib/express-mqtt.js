var proto = require('./application');
var EventEmitter = require('events').EventEmitter;
var mixin = require('merge-descriptors');
var request = {};


exports = module.exports = createApplication;
/**
 * Create an express application.
 *
 * @return {Function}
 * @api public
 */
function createApplication(client) {
  var app = function (req, next) {
    app.handle(req, next);
  };

  mixin(app, EventEmitter.prototype, false);
  mixin(app, proto, false);

  // expose the prototype that will get set on requests
  app.request = Object.create(request, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  })

  app.init(client);
  return app;
}
