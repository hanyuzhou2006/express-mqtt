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
  //var env = opts.env || process.env.NODE_ENV || 'development'

  // get error callback
  var onerror = opts.onerror

  return function (err) {
    //var msg
    var status

    // unhandled error
    if (err) {
      // respect status code from error
      status = getErrorStatusCode(err)
      // get error message
      // msg = getErrorMessage(err, status, env)
    }
    debug('default %s', status)
    // schedule onerror callback
    if (err && onerror) {
      defer(onerror, err, req)
    }

    // console.error(status, msg)
  }
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


