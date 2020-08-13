/*!
 * finalhandler
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var debug = require('debug')('express-mqtt:finalhandler')
var statuses = {}

/**
 * Module variables.
 * @private
 */


/* istanbul ignore next */
var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function (fn) { process.nextTick(fn.bind.apply(fn, arguments)) }

/**
 * Module exports.
 * @public
 */

module.exports = finalhandler

/**
 * Create a function to handle the final response.
 *
 * @param {Request} req
 * @param {Object} [options]
 * @return {Function}
 * @public
 */

function finalhandler(req, options) {
  var opts = options || {}

  // get environment
  var env = opts.env || process.env.NODE_ENV || 'development'

  // get error callback
  var onerror = opts.onerror

  return function (err) {
    var msg
    var status

    // unhandled error
    if (err) {
      // respect status code from error
      status = getErrorStatusCode(err)
      // get error message
      msg = getErrorMessage(err, status, env)
    }
    debug('default %s', status)
    // schedule onerror callback
    if (err && onerror) {
      defer(onerror, err, req)
    }

    // send response
    console.error(status, msg)
  }
}


/**
 * Get message from Error object, fallback to status message.
 *
 * @param {Error} err
 * @param {number} status
 * @param {string} env
 * @return {string}
 * @private
 */

function getErrorMessage(err, status, env) {
  var msg

  if (env !== 'production') {
    // use err.stack, which typically includes err.message
    msg = err.stack

    // fallback to err.toString() when possible
    if (!msg && typeof err.toString === 'function') {
      msg = err.toString()
    }
  }

  return msg || statuses[status]
}

/**
 * Get status code from Error object.
 *
 * @param {Error} err
 * @return {number}
 * @private
 */

function getErrorStatusCode(err) {
  // check err.status
  if (typeof err.status === 'number' && err.status >= 400 && err.status < 600) {
    return err.status
  }
  return undefined
}


