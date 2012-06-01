mongo = require 'mongodb'
server = new mongo.Server "127.0.0.1", 27017, {}
client = new mongo.Db 'test', server

exampleSave = (dbErr, collection) ->
	console.log "Unable to access databasea: #{dbErr}" if dbErr
	collection.save { _id: "my_favorite_latte", flavor: "honeysuckle" }, (err, docs) ->
		console.log "Unable to save record: #{err}" if err
		client.close()

client.open (err, database) ->
	client.collection 'coffeescript_example', exampleSave