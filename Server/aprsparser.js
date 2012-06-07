// Generated by CoffeeScript 1.3.3
(function() {
  var aprsparser, spawn;

  spawn = require('child_process').spawn;

  aprsparser = (function() {

    function aprsparser() {}

    aprsparser.prototype.decode = function(msg, processor) {
      var parser;
      parser = spawn('perl', ['parseaprs.pl']);
      parser.stdout.on('data', function(data) {
        return processor(data);
      });
      parser.stderr.on('data', function(data) {
        return console.log("    ERRROR: %s", data);
      });
      parser.stdin.write(msg);
      return parser.stdin.end();
    };

    return aprsparser;

  })();

  module.exports = aprsparser;

}).call(this);
