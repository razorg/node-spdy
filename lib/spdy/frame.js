var utils = require('./utils');

var FrameTypes = {
	1: 'SYN_STREAM',
	2: 'SYN_REPLY',
	3: 'RST_STREAM',
	4: 'SETTINGS',
	6: 'PING',
	7: 'GOAWAY',
	8: 'HEADERS',
	9: 'WINDOW_UPDATE'
};

var FrameTypesInverted = utils.inverseObject(FrameTypes);

if (!Buffer.prototype.readUInt32BE) {
  Buffer.prototype.readUInt8BE = function(offset, noAssert) {
    return this.readUInt8(offset, true);
  };
  Buffer.prototype.readUInt32BE = function(offset, noAssert) {
    return this.readUInt32(offset, true);
  };
  Buffer.prototype.readUInt16BE = function(offset, noAssert) {
    return this.readUInt16(offset, true);
  };
}

function write_common_header(buffer, headers) {
	if (headers.c) {
		buffer.writeUInt16((headers.c << 15) | headers.version, 0, true);
		buffer.writeUInt16(6, 2, true);
	}
	else {
		buffer.writeUInt32((headers.c << 31) | headers.streamID, 0, true);
	}
	buffer.writeUInt32((headers.flags << 24) | headers.length, 4, true);
}

var Frame = exports.Frame = function (data, err_cb) {
	if (!(this instanceof Frame))
		throw Error('call with new');
	
	this.headers = { };
	this.completed = false;
	this.parsedBytes = 0;
	this.receivedBytes = 0;
	this.buffers = [];
	this.err_cb = err_cb;
	if (data) {
		this.appendData(data, err_cb);
	}
}

Frame.prototype.appendData = function (data) {
	this.receivedBytes += data.length;
	this.buffers.push(data);
	if ((this.parsedBytes < 8) && (this.receivedBytes >= 8)) {
		var headersBuffer = utils.firstBytes(8, this.buffers);
		this.readHeader(headersBuffer);
	}
	if (this.receivedBytes - 8 === this.headers.length) {
		this.readData[this.headers.type].call(this);
		this.completed = true;
		//utils.freeBuffers(this.buffers);
		//delete this.buffers;
	}
}

Frame.prototype.data = function () {
	return utils.concatBuffers(this.buffers);
}

Frame.prototype.readHeader = function (data) {
	this.headers.c = ((data.readUInt8(0, true) >> 7) === 1);
	if (this.headers.c) {
		this.headers.version = data.readUInt16BE(0) & 0x7fff;
		this.headers.type = FrameTypes[data.readUInt16BE(2)];
	}
	else {
		this.headers.streamId = data.readUInt32BE(0) & 0x7fffffff;
	}
	this.headers.flags = data.readUInt8BE(4);
	this.headers.length = data.readUInt32BE(4) & 0xffffff;
}

Frame.prototype.readData = {
	PING: function () {
		var buffer = utils.concatBuffers(this.buffers);
		if (buffer.length != 12) {
			this.error(new Error('ping data must be 8 bytes'));
		}
		this.headers.pingId = buffer.readUInt32(8, true);
	}
}

Frame.prototype.error = function (err) {
	if (this.err_cb)
		this.err_cb(err);
	else
		throw err;
}


Frame.prototype.toBuffer = function () {
	var size;
	if (this.headers.c) {
		switch (this.headers.type) {
			case 'PING':
				var buffer = new Buffer(12);
				write_common_header(buffer, this.headers);
				buffer.writeUInt32(this.headers.pingId, 8, true);
				break;
			default:
				throw Error('not implemented');
		}
	}
	else {
		throw Error('not implemented');
	}
	return buffer;
}

Frame.prototype.isPing = function () {
	return (this.headers.type === 'PING');
}

Frame.prototype.isControl = function () {
	return (this.headers.c);
}