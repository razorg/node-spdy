var concatBuffers = exports.concatBuffers = function (bufs, n) {
	var totalLength = 0;
	for (var i = 0; i < bufs.length; i++) {
		if (i == n)
			break;
		totalLength += bufs[i].length;
	}
	var buffer = new Buffer(totalLength);
	var start = 0;
	for (var i = 0; i < bufs.length; i++) {
		if (i == n)
			break;
		bufs[i].copy(buffer, start);
		start += bufs[i].length;
	}
	return buffer;
}

exports.totalBuffersLength = function (buffers) {
	var total = 0;
	for (var i = 0; i < buffers.length; i++) {
		total += buffers[i].length;
	}
	return total;
}

exports.firstBytes = function(n, buffers) {
	var length = 0;
	for (var i = 0; i < buffers.length; i++) {
		length += buffers[i].length;
		if (length >= n) {
			return concatBuffers(buffers, i + 1);
		}
	}
	throw new Error('cannot grab so much bytes!!');
}

exports.freeBuffers = function (buffers) {
	for (var i = 0; i < buffers.length; i++) {
		delete buffers[i];
	}
}

exports.inverseObject = function (o) {
	var new_o = { };
	for (var k in o) {
		new_o[o[k]] = k;
	}
	return new_o;
}