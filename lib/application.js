
var finalhandler = require('./finalhandler');
var Router = require('./router');
var debug = require('debug')('express-mqtt:application');
var { flatten } = require('array-flatten');
var setPrototypeOf = require('setprototypeof')
var slice = Array.prototype.slice;

var middleware = require('./middleware');
var app = exports = module.exports = {};

app.init = function init(client) {
  var env = process.env.NODE_ENV || 'development';
  debug('booting in %s mode', env);
  this.mountpath = '/';
  this.on('mount', function onmount(parent) {
    setPrototypeOf(this.request, parent.request)
  });
  if (client) {
    this.wrapper(client);
  }
};

app.wrapper = function wrapperMqtt(client) {
  var self = this;
  client.on('message', function (topic, message) {
    var request = {
      url: topic,
      message: message
    }
    debug(topic);
    self(request);
  })
}
app.lazyrouter = function lazyrouter() {
  if (!this._router) {
    this._router = new Router({
      caseSensitive: true,
      strict: true,
    });
    this._router.use(middleware.init(this));
  }
};

app.handle = function handle(req, callback) {
  var env = process.env.NODE_ENV || 'development';
  var router = this._router;

  // final handler
  var done = callback || finalhandler(req, {
    env: env,
    onerror: logerror.bind(this)
  });

  // no routes
  if (!router) {
    debug('no routes defined on app');
    done();
    return;
  }

  router.handle(req, done);
};

app.use = function use(fn) {
  var offset = 0;
  var path = '/';

  // default path to '/'
  // disambiguate app.use([fn])
  if (typeof fn !== 'function') {
    var arg = fn;

    while (Array.isArray(arg) && arg.length !== 0) {
      arg = arg[0];
    }

    // first arg is the path
    if (typeof arg !== 'function') {
      offset = 1;
      path = fn;
    }
  }

  var fns = flatten(slice.call(arguments, offset));

  if (fns.length === 0) {
    throw new TypeError('app.use() requires a middleware function')
  }

  // setup router
  this.lazyrouter();
  var router = this._router;

  fns.forEach(function (fn) {
    // non-express app
    if (!fn || !fn.handle || !fn.set) {
      return router.use(path, fn);
    }

    debug('.use app under %s', path);
    fn.mountpath = path;
    fn.parent = this;

    // restore .app property on req
    router.use(path, function mounted_app(req, next) {
      var orig = req.app;
      fn.handle(req, function (err) {
        setPrototypeOf(req, orig.request)
        next(err);
      });
    });

    // mounted an app
    fn.emit('mount', this);
  }, this);

  return this;
};

app.get = function get(path) {
  this.lazyrouter();
  var route = this._router.route(path);
  route.get.apply(route, slice.call(arguments, 1));
  return this;
};

app.route = function route(path) {
  this.lazyrouter();
  return this._router.route(path);
};

app.param = function param(name, fn) {
  this.lazyrouter();

  if (Array.isArray(name)) {
    for (var i = 0; i < name.length; i++) {
      this.param(name[i], fn);
    }

    return this;
  }

  this._router.param(name, fn);

  return this;
};

app.path = function path() {
  return this.parent
    ? this.parent.path() + this.mountpath
    : '';
};
/**
 * Log error using console.error.
 *
 * @param {Error} err
 * @private
 */

function logerror(err) {
  var env = process.env.NODE_ENV || 'development';
  /* istanbul ignore next */
  if (env !== 'test') console.error(err.stack || err.toString());
}
