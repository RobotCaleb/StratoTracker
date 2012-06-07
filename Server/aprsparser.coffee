spawn = require('child_process').spawn

class aprsparser
	decode: (msg, processor) ->
		parser = spawn 'perl', ['parseaprs.pl']
		parser.stdout.on 'data', (data) ->
			processor data
		parser.stderr.on 'data', (data) ->
			console.log "    ERRROR: %s", data
		parser.stdin.write msg
		parser.stdin.end()

module.exports = aprsparser