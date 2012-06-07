// Generated by CoffeeScript 1.3.3
(function() {
  var displayData, fillData, initialize, map, markers, receivedFirst, socket, vehicleLines;

  receivedFirst = false;

  socket = [];

  map = {};

  vehicleLines = [];

  markers = [];

  dateFormat.masks.dateMask = 'ddmmmyy HH:MM';

  $(window).load(function() {
    return initialize();
  });

  $(document).ready(function() {
    socket = io.connect('/aprs');
    socket.on('update', function(data) {
      if (data) {
        return fillData(data);
      }
    });
    return socket.on('firstupdate', function(data) {
      if (receivedFirst === false) {
        if (data) {
          return fillData(data, true);
        }
      }
    });
  });

  initialize = function() {
    var myOptions;
    myOptions = {
      center: new google.maps.LatLng(40.027614, -76.008911),
      zoom: 8,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    return map = new google.maps.Map($('#map_canvas')[0], myOptions);
  };

  fillData = function(data, first) {
    var arr, call, callsign, each, tracks, _i, _len, _ref;
    if (first == null) {
      first = false;
    }
    tracks = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      each = data[_i];
      callsign = each.callsign;
      if ((_ref = tracks[callsign]) == null) {
        tracks[callsign] = [];
      }
      tracks[callsign].push(each);
    }
    for (call in tracks) {
      arr = tracks[call];
      arr.sort(function(a, b) {
        return a.timestamp - b.timestamp;
      });
    }
    return displayData(tracks, first);
  };

  displayData = function(data, first) {
    var adds, bounds, call, coords, image, path, point, points, _i, _len, _ref, _results;
    if (first == null) {
      first = false;
    }
    adds = [];
    bounds = new google.maps.LatLngBounds();
    _results = [];
    for (call in data) {
      points = data[call];
      if (!(vehicleLines[call] != null)) {
        vehicleLines[call] = new google.maps.Polyline({
          strokeColor: "#00F",
          strokeOpacity: 1.0,
          strokeWeight: 4,
          map: map
        });
      }
      image = new google.maps.MarkerImage('/symbol/' + call, new google.maps.Size(32, 32), new google.maps.Point(0, 0), new google.maps.Point(16, 16));
      if ((_ref = markers[call]) == null) {
        markers[call] = new google.maps.Marker({
          map: map,
          icon: image
        });
      }
      path = vehicleLines[call].getPath();
      for (_i = 0, _len = points.length; _i < _len; _i++) {
        point = points[_i];
        if (call === "KF5PEP-1") {
          $('#altitude').text(point.altitude);
          $('#speed').text(point.speed);
        }
        if (point.latitude !== 0 && point.longitude !== 0) {
          coords = new google.maps.LatLng(point.latitude, point.longitude);
          path.push(coords);
          markers[call].setPosition(coords);
          bounds.extend(coords);
        }
      }
      if (first) {
        _results.push(map.fitBounds(bounds));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

}).call(this);
