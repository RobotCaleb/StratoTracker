receivedFirst = false
socket = []

dateFormat.masks.dateMask = 'ddmmmyy HH:MM';

$(document).ready ->
	socket = io.connect '/blog'
	socket.on 'update', (data) ->
		if data
			fillData data
	socket.on 'firstupdate', (data) ->
		if receivedFirst == false
			if data
				fillData data, true

fillData = (data, first = false) ->
	adds = []
	for each in data
		path = "/images/"
		ext = each.ext	
		thumbPath = path + each.image + "-th" + ext
		sized = path + each.image + ext
		full = path + each.image + "-full" + ext

		div = $("<div class='box'>").hide()

		if each.taken
			taken = $("<p class='taken'>" + new Date(each.taken).format("dateMask") + "</p>")
		else
			taken = $("<p class='posted'>" + new Date(each.created).format("dateMask") + "</p>")

		thumb = $("<p class='thumb'/>")
		thumb.css("background-image", "url(" + thumbPath + ")")
		thumb.css("width", each.thumbw)
		thumb.css("height", each.thumbh)

		if each.caption.length > 80
			caption = $("<p class='caption'>" + each.caption.substr(0, 80) + "...</p>")
		else
			caption = $("<p class='caption'>" + each.caption + "</p>")

		thumbLink = $("<a href='" + sized + "' rel='group' class='fancybox' title=\"" + each.caption + "\n" +
			"<a class='fullImage' target='_blank' href='" + full + "'>Full Image</a>\" />")
		thumbLink.append thumb
		thumbLink.fancybox()

		map = $("<p class='map'></p>")
		map.html "<a target='_blank' href='https://maps.google.com/maps?q=" + each.lat + "," + each.lon + "'>Plot on Google Maps</a>"

		div.append taken
		div.append thumbLink
		div.append caption
		div.append map

		adds.push div

		receivedFirst = true

	for add in adds
		$('#updates').prepend(add)
		if first
			add.show()
		else
			add.animate({width:'toggle'},350)

	$(".fancybox").fancybox({
		prevEffect : 'none',
		nextEffect : 'none',
		helpers    : {
			title	: {
				type: 'over'
			},
			overlay    : {
				opacity : 0.8,
				css     : {
					'background-color' : '#000'
				}
			},
			thumbs	: {
				width	: 50,
				height	: 50
			}
		}
	});
		
