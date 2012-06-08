// Generated by CoffeeScript 1.3.3
(function() {
  var TCP, UDP, aprsCollection, aprsIO, auth, blogCollection, blogIO, broadcastBlog, callsignFilter, db, dgram, env, envFile, express, form, fs, http, im, insertCallback, io, localSettingsFile, logEntry, mongojs, net, path, processAPRSPacket, processDecodedAPRSPacket, saveImageData, sendInitialAPRS, sendInitialBlogs, server, settings, udpPort, webroot;

  dgram = require('dgram');

  net = require('net');

  logEntry = require('./logEntry');

  mongojs = require('mongojs');

  form = require('connect-form/lib/connect-form.js');

  im = require('imagemagick');

  path = require('path');

  fs = require('fs');

  io = require('socket.io');

  http = require('http');

  express = require('express');

  callsignFilter = 'KF5PEP';

  localSettingsFile = '/settings.json';

  if (path.existsSync(__dirname + localSettingsFile)) {
    settings = JSON.parse(fs.readFileSync(__dirname + localSettingsFile, 'utf-8'));
  } else {
    console.log("Can't find local settings at %s", localSettingsFile);
    return 1;
  }

  envFile = '/home/dotcloud/environment.json';

  if (path.existsSync(envFile)) {
    console.log("dotcloud config exists");
    env = JSON.parse(fs.readFileSync(envFile, 'utf-8'));
    env.PRESERVE_HOME = '/home/dotcloud/data';
    env.PRESERVE_HOME_IMAGES = env.PRESERVE_HOME + "/images";
    env.DBHOST = env.DOTCLOUD_DATA_MONGODB_HOST;
    env.DBPORT = env.DOTCLOUD_DATA_MONGODB_PORT;
    if (path.existsSync(env.PRESERVE_HOME + localSettingsFile)) {
      settings = JSON.parse(fs.readFileSync(env.PRESERVE_HOME + "/" + localSettingsFile));
    } else {
      fs.writeFileSync(env.PRESERVE_HOME + localSettingsFile, fs.readFileSync(__dirname + localSettingsFile));
      console.log("dotcloud local settings didn't exist in preserve home. Wrote there. Please update.");
      return 1;
    }
  } else {
    console.log("dotcloud config does not exist, running in standalone");
    env = {
      DBHOST: settings.DBHOST,
      DBPORT: settings.DBPORT,
      PORT_WWW: settings.PORT_WWW,
      PRESERVE_HOME: './',
      PRESERVE_HOME_IMAGES: './images'
    };
  }

  env.DBUSER = settings.DBUSER;

  env.DBPASS = settings.DBPASS;

  env.DBDB = settings.DBDB;

  env.BLOGCOLLECTION = settings.BLOGCOLLECTION;

  env.APRSCOLLECTION = settings.APRSCOLLECTION;

  env.UPLOAD_USER = settings.UPLOAD_USER;

  env.UPLOAD_PASS = settings.UPLOAD_PASS;

  db = mongojs.connect(env.DBHOST + ":" + env.DBPORT + "/" + env.DBDB);

  db.authenticate(env.DBUSER, env.DBPASS, function(err, success) {
    console.log("Checking if logged in");
    if (err) {
      console.log("Error: %s", err);
    }
    if (success) {
      console.log("Logged in");
    }
    if (!success) {
      return process.exit;
    }
  });

  aprsCollection = db.collection(env.APRSCOLLECTION);

  blogCollection = db.collection(env.BLOGCOLLECTION);

  UDP = dgram.createSocket('udp4');

  udpPort = 14580;

  UDP.bind(udpPort);

  UDP.on('message', function(msg, rinfo) {
    return processAPRSPacket(msg);
  });

  UDP.on('listening', function(msg, rinfo) {
    var address;
    address = UDP.address();
    return console.log('UDP: Listening on %s:%s', address.address, address.port);
  });

  TCP = net.createConnection(14580, 'texas.aprs2.net');

  TCP.on('connect', function() {
    var login;
    console.log("TCP: Connected");
    TCP.setNoDelay(true);
    login = 'user KF5PEP pass -1 vers custom 0.0 UDP ' + udpPort + ' filter p/' + callsignFilter + '\n';
    console.log('TCP: Login %s', login);
    return TCP.write(login);
  });

  TCP.on('data', function(data) {
    return processAPRSPacket(data);
  });

  TCP.on('end', function() {
    return console.log('TCP: Disconnected');
  });

  process.on('exit', function() {
    console.log('Process: Exiting');
    return TCP.end();
  });

  server = express.createServer(form({
    "keepExtensions": true
  }));

  webroot = __dirname + '/www';

  if (!path.existsSync(env.PRESERVE_HOME)) {
    fs.mkdirSync(env.PRESERVE_HOME, 755);
  }

  if (!path.existsSync(env.PRESERVE_HOME_IMAGES)) {
    fs.mkdirSync(env.PRESERVE_HOME_IMAGES, 755);
  }

  io = io.listen(server);

  io.set('log level', 1);

  aprsIO = io.of('/aprs').on('connection', function(socket) {
    return sendInitialAPRS(socket);
  });

  blogIO = io.of('/blog').on('connection', function(socket) {
    return sendInitialBlogs(socket);
  });

  auth = express.basicAuth(env.UPLOAD_USER, env.UPLOAD_PASS);

  server.get('/upload.html', auth, function(req, res) {
    return res.sendfile(webroot + 'upload.html');
  });

  server.get('/drop.html', auth, function(req, res) {
    aprsCollection.drop();
    blogCollection.drop();
    return res.send("Collections dropped");
  });

  server.use(express["static"](webroot));

  console.log("Starting to listen on %s", env.PORT_WWW);

  server.listen(env.PORT_WWW);

  server.get('/images/:id', function(req, res) {
    var filename;
    filename = env.PRESERVE_HOME_IMAGES + "/" + req.params.id;
    res.contentType(filename);
    return res.sendfile(filename);
  });

  server.get('/symbol/:id', function(req, res) {
    var filename, index;
    index = req.params.id.indexOf('-');
    if (req.params.id.substring(index + 1) === "1") {
      filename = "./www/images/slice/215.png";
    } else {
      filename = "./www/images/slice/410.png";
    }
    res.contentType(filename);
    return res.sendfile(filename);
  });

  server.post('/image/upload', function(req, res, next) {
    return req.form.complete(function(err, fields, files) {
      var base, dir, ext, full, sized, thumb;
      if (err) {
        return next(err);
      } else {
        if (files && files.image && files.image.type && 0 === files.image.type.indexOf('image')) {
          dir = path.dirname(files.image.path);
          ext = path.extname(files.image.path);
          base = path.basename(files.image.path, ext);
          full = env.PRESERVE_HOME_IMAGES + "/" + base + "-full" + ext;
          thumb = env.PRESERVE_HOME_IMAGES + "/" + base + "-th" + ext;
          sized = env.PRESERVE_HOME_IMAGES + "/" + base + ext;
          console.log("Found an image in files.image.path: %s", files.image.path);
          console.log("full: %s", full);
          console.log("sized: %s", sized);
          console.log("thumb: %s", thumb);
          fs.writeFileSync(full, fs.readFileSync(files.image.path));
          fs.unlink(files.image.path);
          return im.resize({
            srcPath: full,
            dstPath: sized,
            width: 800
          }, function(err, stdout, stderr) {
            if (err) {
              res.send({
                Error: "Error in first resize"
              });
            }
            return im.resize({
              srcPath: full,
              dstPath: thumb,
              width: 256
            }, function(err, stdout, stderr) {
              if (err) {
                res.send({
                  Error: "Error in second resize"
                });
              }
              return im.readMetadata(full, function(err, metadata) {
                var dd, deg, lat, lon, min, sec, taken;
                if (err) {
                  res.send({
                    Error: "Error reading metadata"
                  });
                }
                taken = new Date().toUTCString();
                if (metadata.exif) {
                  if (metadata.exif.gpsLatitude) {
                    lat = metadata.exif.gpsLatitude.split(',');
                    deg = eval(lat[0]);
                    min = eval(lat[1]);
                    sec = eval(lat[2]);
                    dd = deg + min / 60 + sec / 3600;
                    if (metadata.exif.gpsLatitudeRef === 'S') {
                      dd *= -1;
                    }
                    fields.lat = dd;
                  }
                  if (metadata.exif.gpsLongitude) {
                    lon = metadata.exif.gpsLongitude.split(',');
                    deg = eval(lon[0]);
                    min = eval(lon[1]);
                    sec = eval(lon[2]);
                    dd = deg + min / 60 + sec / 3600;
                    if (metadata.exif.gpsLongitudeRef === 'W') {
                      dd *= -1;
                    }
                    fields.lon = dd;
                  }
                  if (metadata.exif.dateTimeOriginal) {
                    taken = new Date(metadata.exif.dateTimeOriginal).toUTCString();
                  }
                }
                return im.identify(['-format', '%wx%h', thumb], function(err, features) {
                  var dim, height, width;
                  if (err) {
                    res.send({
                      Error: "Error running identify"
                    });
                  }
                  dim = features.split('x');
                  width = dim[0];
                  height = dim[1];
                  saveImageData(fields.caption, fields.lat, fields.lon, taken, base, width, height, ext);
                  return res.send({
                    Result: "Success"
                  });
                });
              });
            });
          });
        } else {
          return res.send({
            Error: "Not an image"
          });
        }
      }
    });
  });

  saveImageData = function(caption, lat, lon, taken, image, width, height, ext) {
    var created, now;
    now = new Date(new Date().toUTCString());
    created = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
    return blogCollection.insert({
      caption: caption,
      lat: lat,
      lon: lon,
      taken: taken,
      image: image,
      thumbw: width,
      thumbh: height,
      ext: ext,
      created: created
    }, insertCallback);
  };

  insertCallback = function(err, doc) {
    if (err) {
      throw err;
    }
    return broadcastBlog(doc);
  };

  processAPRSPacket = function(packet) {
    var msg, options, packetPath, req;
    msg = packet.toString();
    if (msg.indexOf(callsignFilter) === 0) {
      packetPath = '/packet/?packet=' + msg;
      options = {
        host: env.DOTCLOUD_APRS_HTTP_HOST,
        port: 80,
        method: 'POST',
        path: packetPath
      };
      console.log("Requesting packet from perl with %s", msg);
      req = http.request(options, function(res) {
        return res.on('data', function(packet) {
          console.log("Pkt from perl: %s", packet);
          return processDecodedAPRSPacket(packet);
        });
      });
      return req.on('error', function(err) {
        return console.log("HTTP Request Error: %s", err.message);
      });
    }
  };

  processDecodedAPRSPacket = function(packetData) {
    var log, parsed, str;
    str = packetData.toString();
    parsed = JSON.parse(str);
    log = new logEntry(parsed);
    return log.postReceive(aprsCollection, aprsIO);
  };

  sendInitialAPRS = function(socket) {
    return aprsCollection.find({
      timestamp: {
        $gt: 0
      }
    }, function(err, results) {
      return socket.emit('firstupdate', results);
    });
  };

  sendInitialBlogs = function(socket) {
    return blogCollection.find({
      created: {
        $gt: 0
      }
    }).sort({
      created: 1
    }, function(err, results) {
      return socket.emit('firstupdate', results);
    });
  };

  broadcastBlog = function(data) {
    return blogIO.emit('update', data);
  };

}).call(this);
