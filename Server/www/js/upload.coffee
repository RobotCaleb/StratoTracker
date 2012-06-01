$(document).ready ->
	if navigator.geolocation
		navigator.geolocation.getCurrentPosition locationCallback, error, {maximumAge:300000}

	$('#submitButton').click(uploadData)

locationCallback = (position) ->
	$('#lat').val position.coords.latitude
	$('#lon').val position.coords.longitude

error = (msg) ->
	console.log msg

uploadData = ->
	document.forms['uploadform'].submit()