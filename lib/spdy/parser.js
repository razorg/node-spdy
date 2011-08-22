var EventEmitter = require('events').EventEmitter;
var util = require('util');
var utils = require('./utils.js');
var Frame = require('./frame').Frame;

var Parser = exports.Parser = function (stream) {
	EventEmitter.call(this);
	var parser = this;
	this.buffers = [];
	this.frame = undefined;

	stream.on('data', function (data) {
		if ((parser.frame) && (!parser.frame.completed))  {
			parser.frame.appendData(data);
		}
		else {
			parser.frame = new Frame(data);
		}
		if (parser.frame.completed) {
			if (parser.frame.isControl()) {
				parser.emit('cframe', parser.frame);
				if (parser.frame.isPing()) {
					parser.emit('ping', parser.frame);
				}
			}
			else {
				parser.emit('dframe', parser.frame);
			}
			delete parser.frame;
		}
	});

	stream.on('end', function () {
	});
}

util.inherits(Parser, EventEmitter);