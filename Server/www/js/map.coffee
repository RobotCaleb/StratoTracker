receivedFirst = false
socket        = []
map           = {}
vehicleLines  = []
markers       = []

dateFormat.masks.dateMask = 'ddmmmyy HH:MM';

$(window).load ->
	initialize()

$(document).ready ->
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
		center: new google.maps.LatLng(40.027614, -76.008911),
		zoom: 8,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	map = new google.maps.Map $('#map_canvas')[0], myOptions

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

		for point in points
			if call == "KF5PEP-1"
				$('#altitude').text(point.altitude) 
				$('#speed').text(point.speed) 
			if point.latitude != 0 && point.longitude != 0
				coords = new google.maps.LatLng point.latitude, point.longitude
				path.push coords
				markers[call].setPosition coords
				bounds.extend coords
		if first
			map.fitBounds bounds
	
