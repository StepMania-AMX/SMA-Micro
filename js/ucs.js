var bpm = 120;
var mode = "single";
var stepOffset = 0;
var extraOffset = 0;
var noteData = [];

function loadUcs(path, onUcsLoaded, ucsOffset) {
	function getSplitEndTime(split, row) {
		if (row == null) {
			row = split.rows;
		}
		return (
			split.time + split.delay + row / split.beatSplit / (split.bpm / 60)
		);
	}

	function getStepOffset(splits) {
		if (splits.length === 0) {
			return 0;
		}
		return splits[0].delay;
	}

	function getStepBpm(splits) {
		if (splits.length === 0) {
			return 120;
		}
		if (splits.length === 1) {
			return splits[0].bpm;
		}
		var bpmsMap = {};
		splits.forEach(function (split) {
			var seconds = getSplitEndTime(split) - split.time;
			if (seconds > 0) {
				seconds = Math.ceil(seconds);
			} else {
				seconds = Math.floor(seconds) * Math.sign(seconds);
			}
			bpmsMap[split.bpm] = bpmsMap[split.bpm] | (0 + seconds);
		});
		var bpms = [];
		for (var bpm in bpmsMap) {
			if (bpmsMap.hasOwnProperty(bpm)) {
				bpms.push([bpm, bpmsMap[bpm]]);
			}
		}
		bpms.sort(function (a, b) {
			var diff = b[1] - a[1];
			if (diff === 0) {
				return b[0] - a[0];
			}
			return diff;
		});
		var weightedBpm = 0;
		var sumTime = 0;
		var totalTime = getSplitEndTime(splits[splits.length - 1]);
		for (var i = 0; i < bpms.length; i++) {
			weightedBpm += bpms[i][0] * bpms[i][1];
			sumTime += bpms[i][1];
			if (sumTime > totalTime * 0.5) {
				break;
			}
		}
		return weightedBpm / sumTime;
	}

	var xhr = new XMLHttpRequest();
	xhr.open("GET", path);
	xhr.onreadystatechange = function () {
		if (xhr.readyState !== XMLHttpRequest.DONE) {
			return;
		}
		if (xhr.status !== 200) {
			return;
		}
		var ucsFile = xhr.responseText.split("\n");
		var isReadingSplit = false;
		var lastSplit = {
			time: 0,
			bpm: 120,
			delay: 0,
			beatSplit: 2,
			rows: 0,
		};
		var notes = [];
		var splits = [];
		ucsFile.forEach(function (line) {
			if (line[0] === ":") {
				if (!isReadingSplit) {
					var split = {};
					split.time = getSplitEndTime(lastSplit);
					split.bpm = lastSplit.bpm;
					split.delay = lastSplit.delay;
					split.beatSplit = lastSplit.beatSplit;
					split.rows = 0;
					splits.push(split);
					lastSplit = split;
					isReadingSplit = true;
				}
				var splitLine = line.toLowerCase().split("=");
				switch (splitLine[0]) {
					case ":mode":
						if (splitLine[1][0] === "D") {
							mode = "double";
						} else {
							mode = "single";
						}
						break;

					case ":bpm":
						lastSplit.bpm = parseFloat(splitLine[1]);
						break;

					case ":delay":
						lastSplit.delay = parseFloat(splitLine[1]) / 1000;
						break;

					case ":split":
						lastSplit.beatSplit = parseInt(splitLine[1], 10);
						break;
				}
			} else {
				isReadingSplit = false;
				var rowLine = line.trim();
				var isEmpty = Array.prototype.every.call(rowLine, function (
					note
				) {
					note !== "X" && note !== "M";
				});
				if (!isEmpty) {
					Array.prototype.forEach.call(rowLine, function (note, col) {
						var isNote = note === "X" || note === "M";
						var isValid = mode === "double" && col <= 9 || col <= 4;
						if (isNote && isValid) {
							notes.push([getSplitEndTime(lastSplit), col, {}]);
						}
					});
				}
				lastSplit.rows++;
			}
		});
		bpm = getStepBpm(splits);
		stepOffset = getStepOffset(splits);
		notes.forEach(function (data) {
			var time = data[0] - stepOffset;
			data.splice(0, 1, (time * bpm) / 60);
		});
		extraOffset = parseFloat(ucsOffset) || 0;
		noteData = notes;
		onUcsLoaded();
	};
	xhr.send();
}
