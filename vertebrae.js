/* vertebrae.js
 *
 * jQuery Plugin to mock AJAX requests for Backbone applications.
 * Written By: Tim Branyen @tbranyen
 *
 * Licensed under whatever.
 */
(function(window) {

// Third-party hard dependencies
var _ = window._;
var Backbone = window.Backbone;
var jQuery = window.jQuery;

// Throw error if missing any dependencies
if (!_ || !Backbone || !jQuery) {
  throw new Error("Unable to use vertebrae.js missing dependencies.");
}

// Cache internally all future defined routes
var _routes = {};

// Assign directly onto jQuery to be indicative this is indeed
// a plugin and requires jQuery to use.
jQuery.mock = function(routes) {
  var route;
  // Shorten Backbone regexp reference
  var routeToRegExp = Backbone.Router.prototype._routeToRegExp;

  // Convert all URLs passed to regex and assign defaults if they
  // are not provided.
  _.each(routes, function(val, key) {
    route = _routes[key] = val;

    route.regex = routeToRegExp(key);
    route.timeout = route.timeout || 0;
    route.statusCode = isNaN(route.statusCode) ? 200 : route.statusCode;
  });
};

// Plugin defaults, can be overwritten
var defaults = jQuery.mock.options = {
  delay: {
    // Set 404 timeout to simulate real-world delay
    '404': 100
  }
};

// Adding transports in jQuery will push them to the end of the stack for
// filtering.  Without the + preceding the wildcard *, most requests would
// still be handled by jQuery's internal transports.  With the +, this
// catch-all transport is bumped to the front and hijacks *ALL* requests.
$.ajaxTransport('+*', function(options, originalOptions, jqXHR) {
  var timeout, captures, match, route;
  var method = options.type.toUpperCase();

  // Per the documentation a transport should return a function
  // with two keys: send and abort.
  //
  // send: Passes the currently requested route through the routes
  // object and attempts to find a match.  
  return {
    send: function(headers, completeCallback) {
      // Use the underscore detect method to check if a route is found
      // match will either be undefined (falsy) or true (truthy).
      match = _.detect(_routes, function(val, key) {
        captures = val.regex.exec(options.url);
        route = _routes[key];

        // Capture has been found, ensure the requested type has a handler
        if (captures && route[method]) {
          return true;
        }
      });

      // If no matches, trigger 404 with delay
      if (!match) {
        // Return to ensure that the successful handler is never run
        return timeout = window.setTimeout(function() {
          completeCallback(404, 'error');
        }, defaults.delay['404']);
      }

      // Ensure captures is an array and not null
      captures = captures || [];

      // A timeout is useful for testing behavior that may require an abort
      // or simulating how slow requests will show up to an end user.
      timeout = window.setTimeout(function() {
        completeCallback(route.statusCode, 'success', {
          // Slice off the path from captures, only want to send the
          // arguments.
          responseText: route[method].apply(null, captures.slice(1))
        });
      }, route.timeout);
    },

    // This method will cancel any pending "request", by clearing the timeout
    // that is responsible for triggering the success callback.
    abort: function() {
      window.clearTimeout(timeout);
    }
  };
});

})(this);
