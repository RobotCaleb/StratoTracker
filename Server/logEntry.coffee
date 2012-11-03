class logEntry
    constructor: (data) ->
        console.log data
        @callsign   = data.srccallsign
        @latitude   = data.latitude
        @longitude  = data.longitude
        @altitude   = data.altitude
        @timestamp  = data.timestamp
        @speed      = data.speed
        @comment    = data.comment

        if data.timestamp == undefined
            now        = new Date(new Date().toUTCString())
            @timestamp = Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                now.getUTCHours(),
                now.getUTCMinutes(),
                now.getUTCSeconds(),
                now.getUTCMilliseconds())

        console.log "callsign %s", @callsign
        console.log "latitude %s", @latitude
        console.log "longitude %s", @longitude
        console.log "altitude %s", @altitude
        console.log "timestamp %s", @timestamp
        console.log "speed %s", @speed
        console.log "comment %s", @comment

    postReceive: (collection, io) ->
        if @isValid()
            console.log "Inserting"
            collection.insert this
            console.log "Broadcasting"
            io.emit 'update', [this]

    isValid: ->
        @callsign? and
        @latitude? and
        @longitude? and
        @timestamp?

    toString: ->
        JSON.stringify this

module.exports = logEntry