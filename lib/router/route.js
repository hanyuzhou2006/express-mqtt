
'use strict';

/**
 * Module dependencies.
 * @private
 */

var debug = require('debug')('express-mqtt:router:route');
var flatten = require('array-flatten').flatten;
var Layer = require('./layer');

/**
 * Module variables.
 * @private
 */

var slice = Array.prototype.slice;
var toString = Object.prototype.toString;

/**
 * Module exports.
 * @public
 */

module.exports = Route;

/**
 * Initialize `Route` with the given `path`,
 *
 * @param {String} path
 * @public
 */

function Route(path) {
  this.path = path;
  this.stack = [];

  debug('new %o', path)

}

/**
 * dispatch req into this route
 * @private
 */

Route.prototype.dispatch = function dispatch(req, done) {
  var idx = 0;
  var stack = this.stack;
  if (stack.length === 0) {
    return done();
  }
  req.route = this;

  next();

  function next(err) {
    // signal to exit route
    if (err && err === 'route') {
      return done();
    }

    // signal to exit router
    if (err && err === 'router') {
      return done(err)
    }

    var layer = stack[idx++];
    if (!layer) {
      return done(err);
    }

    if (err) {
      layer.handle_error(err, req, next);
    } else {
      layer.handle_request(req, next);
    }
  }
};

/**
 * Add a handler for all HTTP verbs to this route.
 * @param {function} handler
 * @return {Route} for chaining
 * @api public
 */

Route.prototype.use = function use() {
  var handles = flatten(slice.call(arguments));

  for (var i = 0; i < handles.length; i++) {
    var handle = handles[i];

    if (typeof handle !== 'function') {
      var type = toString.call(handle);
      var msg = 'Route.use() requires a callback function but got a ' + type
      throw new TypeError(msg);
    }

    var layer = Layer('/', {}, handle);

    this.stack.push(layer);
  }

  return this;
};

Route.prototype.get = function get() {
  var handles = flatten(slice.call(arguments));

  for (var i = 0; i < handles.length; i++) {
    var handle = handles[i];

    if (typeof handle !== 'function') {
      var type = toString.call(handle);
      var msg = 'Route.get() requires a callback function but got a ' + type
      throw new Error(msg);
    }

    debug('%s %o', 'get', this.path)

    var layer = Layer('/', {}, handle);
    layer.method = 'get';
    this.stack.push(layer);
  }

  return this;
};
