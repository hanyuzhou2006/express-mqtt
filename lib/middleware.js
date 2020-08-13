var setPrototypeOf = require('setprototypeof')
exports.init = function(app){
  return function init(req, next){
    req.next = next;
    setPrototypeOf(req, app.request)
    next();
  };
};
