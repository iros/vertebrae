// Set up mock api routes
$.mock({

  '/valid.json': {
    GET: function() {
      return '{ "id": 0, "test": "None"}';
    }
  },

  '/invalid.json': {
    GET: function() {
      return '{ id: 0, test: "None"}';
    }
  }

});

module('json');

asyncTest('valid json', function() {
  $.getJSON('/valid.json', function(data) {
    equals(data.id, 0);
    equals(data.test, 'None')
    start();
  }).error(function() {
    ok(false, 'Should not error here');
    start();
  });
});

asyncTest('invalid json', function() {
  $.getJSON('/invalid.json', function(data) {
    ok(false, 'Should not succeed here');
    start();
  }).error(function(error) {
    equals(error.statusText, 'parsererror');
    start();
  });
});