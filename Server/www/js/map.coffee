receivedFirst = false
socket        = []
map           = {}
vehicleLines  = []
markers       = []
graph         = []
# graphData     = [[{x: 0, y: 0}], [{x: 0, y: 0}]]
graphData     = [[0,0]]
x_axis        = {}
y_axis        = {}

dateFormat.masks.dateMask = 'ddmmmyy HH:MM';

$(window).load ->
    # createGraph()

# $(document).ready ->
    initialize()
    socket = io.connect '/aprs'
    socket.on 'update', (data) ->
        if data
            fillData data
    socket.on 'firstupdate', (data) ->
        if receivedFirst == false
            if data
                fillData data, true

initialize = ->
    myOptions = {
        center: new google.maps.LatLng(31.1916, -98.71),
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    }
    map = new google.maps.Map $('#map_canvas')[0], myOptions
    createGraph()

createGraph = ->
    graph = new Dygraph(
        $('#stats_chart')[0],
        graphData,
        {
            rollPeriod: 2,
            colors: ["#DC3912", "#FF9900", "#109618", "#3366CC"],
            strokeWidth: 2,
            axisLabelColor: "#CCC",
            labelsSeparateLines: true,
            legend: 'always',
            labels: ['Time', 'Altitude (* 10km)', 'Speed (mph)']

            underlayCallback: (canvas, area, g) ->
                coords = g.toDomCoords 0, 0

                splitX = coords[0]
                splitY = coords[1]

                topHeight = splitY - area.y
                bottomHeight = area.h - topHeight

                canvas.fillStyle = '#282828'
                canvas.fillRect area.x, area.y, area.w, topHeight

                canvas.fillStyle = '#111111';
                canvas.fillRect area.x, splitY, area.w, bottomHeight
        }          # options
    )

fillData = (data, first = false) ->
    tracks = []
    for each in data
        callsign = each.callsign
        tracks[callsign] ?= []
        tracks[callsign].push each
    for call, arr of tracks
        arr.sort (a, b) ->
            a.timestamp - b.timestamp

    displayData tracks, first

displayData = (data, first = false) ->
    adds = []
    bounds = new google.maps.LatLngBounds()
    for call, points of data
        if not vehicleLines[call]?
            vehicleLines[call] = new google.maps.Polyline {
                strokeColor   : "#00F",
                strokeOpacity : 1.0,
                strokeWeight  : 4,
                map           : map
            }
        image = new google.maps.MarkerImage '/symbol/' + call,
            new google.maps.Size(32, 32),
            new google.maps.Point(0, 0),
            new google.maps.Point(16, 16)
        markers[call] ?= new google.maps.Marker {
            map        : map,
            icon       : image
        }
        path = vehicleLines[call].getPath()

        if first && call == "KF5PEP-1"
            graphData = []
        for point in points
            if call == "KF5PEP-1"
                graphData.push [new Date(point.timestamp), point.speed, point.altitude / 1000]
                $('#altitude').text(point.altitude)
                $('#speed').text(point.speed)
            if point.latitude != 0 && point.longitude != 0
                coords = new google.maps.LatLng point.latitude, point.longitude
                path.push coords
                markers[call].setPosition coords
                bounds.extend coords

        graph.updateOptions { file: graphData }
        if first
            map.fitBounds bounds

