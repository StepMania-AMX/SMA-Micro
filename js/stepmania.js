var default_options = {
		autoPlay: 1,
		scrollBPM: 400,
		theme: "fiesta",
	},
	options = {};

function setOption(option, value) {
	if (typeof value === "undefined") {
		value = default_options[option];
	}

	try {
		localStorage[["smajs-", option].join("")] = options[option] = value;
	} catch (e) {
		console.error("localStorage is disabled.");
	}
}

function getPlayerOption(option) {
	try {
		var value = localStorage[["smajs-", option].join("")];
	} catch (e) {
		console.error("localStorage is disabled.");
	}

	if (typeof value === "undefined") {
		return default_options[option];
	}
	return value;
}

for (var o in default_options) {
	if (default_options.hasOwnProperty(o)) {
		options[o] = getPlayerOption(o);
	}
}
options.touch = "ontouchstart" in window;
if (options.touch) {
	$("#autoplay small").text("Touch the receptors to disable");
}

var autoPlay = parseFloat(options.autoPlay);
var scrollSpeed = Math.round((parseFloat(options.scrollBPM) * 4) / bpm) / 4;
var totalOffset = stepOffset + extraOffset;

var currentTime = 0;
var beatsPerSec = bpm / 60;

function secondToBeat(musicSec) {
	return (musicSec + totalOffset) * beatsPerSec;
}

function beatToSecond(beat) {
	return beat / beatsPerSec - totalOffset;
}

var CANVAS_WIDTH = 640;
var CANVAS_HEIGHT = 480;
var CENTER_X = CANVAS_WIDTH / 2;
var CENTER_Y = CANVAS_HEIGHT / 2;
var CENTER_P1_X = (CANVAS_WIDTH * 1) / 4 + 33;
var CENTER_P2_X = (CANVAS_WIDTH * 3) / 4 - 33;
var targetFps = 60;
var lastDate = new Date();
var uptimeSeconds = 0;
var framesInCurrentSecond = 0;

var targetsY = 48;

var drawOrderTargets = {
	single: [0, 4, 1, 3, 2],
	double: [0, 4, 1, 3, 2, 5, 9, 6, 8, 7],
};

var colInfos = {
	single: [
		{ x: CENTER_X - 100, y: targetsY },
		{ x: CENTER_X - 50, y: targetsY },
		{ x: CENTER_X, y: targetsY },
		{ x: CENTER_X + 50, y: targetsY },
		{ x: CENTER_X + 100, y: targetsY },
	],
	double: [
		{ x: CENTER_P1_X - 100, y: targetsY },
		{ x: CENTER_P1_X - 50, y: targetsY },
		{ x: CENTER_P1_X, y: targetsY },
		{ x: CENTER_P1_X + 50, y: targetsY },
		{ x: CENTER_P1_X + 100, y: targetsY },
		{ x: CENTER_P2_X - 100, y: targetsY },
		{ x: CENTER_P2_X - 50, y: targetsY },
		{ x: CENTER_P2_X, y: targetsY },
		{ x: CENTER_P2_X + 50, y: targetsY },
		{ x: CENTER_P2_X + 100, y: targetsY },
	],
};

var autoPlayCoords = {
	single: [CENTER_X - 132, targetsY - 32, CENTER_X + 132, targetsY + 32],
	double: [
		CENTER_P1_X - 132,
		targetsY - 32,
		CENTER_P2_X + 132,
		targetsY + 32,
	],
};

var touchCenter = { x: CENTER_X, y: CANVAS_HEIGHT - 180 };
var touchCenterP1 = { x: CENTER_P1_X - 13, y: CANVAS_HEIGHT - 180 };
var touchCenterP2 = { x: CENTER_P2_X + 13, y: CANVAS_HEIGHT - 180 };
var touchControlCords = {
	single: [
		[
			touchCenter.x - 140,
			touchCenter.y + 20,
			touchCenter.x - 40,
			touchCenter.y + 140,
		],
		[
			touchCenter.x - 140,
			touchCenter.y - 140,
			touchCenter.x - 40,
			touchCenter.y - 20,
		],
		[
			touchCenter.x - 50,
			touchCenter.y - 50,
			touchCenter.x + 50,
			touchCenter.y + 50,
		],
		[
			touchCenter.x + 40,
			touchCenter.y - 140,
			touchCenter.x + 140,
			touchCenter.y - 20,
		],
		[
			touchCenter.x + 40,
			touchCenter.y + 20,
			touchCenter.x + 140,
			touchCenter.y + 140,
		],
	],
	double: [
		[
			touchCenterP1.x - 140,
			touchCenterP1.y + 20,
			touchCenterP1.x - 40,
			touchCenterP1.y + 140,
		],
		[
			touchCenterP1.x - 140,
			touchCenterP1.y - 140,
			touchCenterP1.x - 40,
			touchCenterP1.y - 20,
		],
		[
			touchCenterP1.x - 50,
			touchCenterP1.y - 50,
			touchCenterP1.x + 50,
			touchCenterP1.y + 50,
		],
		[
			touchCenterP1.x + 40,
			touchCenterP1.y - 140,
			touchCenterP1.x + 140,
			touchCenterP1.y - 20,
		],
		[
			touchCenterP1.x + 40,
			touchCenterP1.y + 20,
			touchCenterP1.x + 140,
			touchCenterP1.y + 140,
		],
		[
			touchCenterP2.x - 140,
			touchCenterP2.y + 20,
			touchCenterP2.x - 40,
			touchCenterP2.y + 140,
		],
		[
			touchCenterP2.x - 140,
			touchCenterP2.y - 140,
			touchCenterP2.x - 40,
			touchCenterP2.y - 20,
		],
		[
			touchCenterP2.x - 50,
			touchCenterP2.y - 50,
			touchCenterP2.x + 50,
			touchCenterP2.y + 50,
		],
		[
			touchCenterP2.x + 40,
			touchCenterP2.y - 140,
			touchCenterP2.x + 140,
			touchCenterP2.y - 20,
		],
		[
			touchCenterP2.x + 40,
			touchCenterP2.y + 20,
			touchCenterP2.x + 140,
			touchCenterP2.y + 140,
		],
	],
};

function merge(o1, o2) {
	for (var attr in o2) {
		if (o2.hasOwnProperty(attr)) {
			o1[attr] = o2[attr];
		}
	}
}

function deepCopy(o) {
	var ret = {};
	merge(ret, o);
	return ret;
}

var timingWindowSeconds = [0.025, 0.05, 0.075, 0.1, 0.125];
var timingWindowSecondsTouch = [0.05, 0.1, 0.15, 0.2, 0.25];

var tapNoteJudges = [0, 0, 0, 0, 0, 0];
var tapNotePoints = [3, 3, 2, 1, 0, -5];
var tapNoteScores = [1000, 1000, 500, 100, -200, -500];

var possiblePoints = tapNotePoints[0] * noteData.length;
var judgmentSpecial = ["F", "SS"];
var judgmentLetters = ["D", "C", "B", "A", "S"];
var judmentPercents = [0.6, 0.7, 0.8, 0.9, 0.95];

var actualPoints = 0;
var currentPoints = 0;
var autoPlayPoints = 0;

var currentCombo = 0;
var maxCombo = 0;
var score = 0;

var autoSync = false;
var autoSyncOffByHistory = [];
var autoSyncSampleSize = 20;

var $sm_canvas = $("#sm-canvas");
var $autoplay = $("#autoplay");
var $autosync = $("#autosync");
var $offset = $("#offset");
var $FPS = $("#FPS");
var $stats = $("#stats");

function handleTapNoteScore(tapNoteScore) {
	if (tapNoteScore < 3) {
		// < Good
		currentCombo++;
	} else if (tapNoteScore > 3) {
		// > Good
		currentCombo = 0;
	}

	if (autoPlay > 0) {
		autoPlayPoints += tapNotePoints[tapNoteScore];
	} else {
		actualPoints += tapNotePoints[tapNoteScore];
	}
	currentPoints += 3;

	var percent = (actualPoints / possiblePoints) * 100;
	var currentPercent = actualPoints / currentPoints;
	var letter = judgmentLetters[0];
	if (!autoPlay) {
		tapNoteJudges[tapNoteScore]++;
		maxCombo = currentCombo > maxCombo ? currentCombo : maxCombo;
		score += tapNoteScores[tapNoteScore];
		if (currentCombo > 50) {
			score += tapNoteScores[tapNoteScore] + 2000;
		} else if (currentCombo > 4) {
			score += 1000;
		}

		if (score < 0) {
			score = 0;
		}
	}

	if (autoPlayPoints == 0) {
		letter = judgmentSpecial[0];
		for (var i = 0; i < judmentPercents.length; i++) {
			if (currentPercent < judmentPercents[i]) {
				break;
			}
			letter = judgmentLetters[i];
		}

		// Ajuste para A o SS
		if (letter == judgmentLetters[4]) {
			if (tapNotePoints[5] > 0) {
				letter = judgmentLetters[3];
			} else if (actualPoints == currentPoints) {
				letter = judgmentSpecial[1];
			}
		}
	}
	$stats.text(
		[
			"Combo: ",
			currentCombo,
			" / Score: ",
			score,
			" / ",
			percent.toFixed(2),
			"% (",
			letter,
			")",
		].join("")
	);

	judgment
		.stop()
		.set({ frameIndex: tapNoteScore })
		.animate({ scaleX: 1.4, scaleY: 1.4, alpha: 1 }, 0)
		.animate({ scaleX: 1, scaleY: 1 }, 0.1)
		.animate({ scaleX: 1, scaleY: 1 }, 0.5)
		.animate({ alpha: 0 }, 0.2);
}

targets = {
	single: [],
	double: [],
};
explosions = {
	single: [],
	double: [],
};
["single", "double"].forEach(function (mode) {
	colInfos[mode].forEach(function (colInfo) {
		var target = Actor(
			"theme/" + options.theme + "/receptors.png",
			{ frameWidth: 64, frameHeight: 64, numFrames: 10 },
			colInfo
		);
		targets[mode].push(target);
		var explosion = Actor(
			"theme/" + options.theme + "/explosion.png",
			{ frameWidth: 256, frameHeight: 256, numFrames: 1 },
			colInfo
		);
		explosions[mode].push(explosion);
		explosion.set({ alpha: 0 });
	});
});

var judgment = Actor(
	"theme/" + options.theme + "/judgments.png",
	{ frameWidth: 96, frameHeight: 32, numFrames: 6 },
	{ x: CENTER_X, y: CENTER_Y - (options.touch ? 120 : 60) }
);
judgment.set({ alpha: 0 });
var noteSprite = Sprite("theme/" + options.theme + "/tapnotes.png", {
	frameWidth: 64,
	frameHeight: 64,
	numFrames: 30,
});
var touchControlSprite = Sprite(
	"theme/" + options.theme + "/touch_controls.png",
	{ frameWidth: 280, frameHeight: 280, numFrames: 1 }
);
touchControlSpriteCenter = {
	single: [touchCenter],
	double: [touchCenterP1, touchCenterP2],
};

var canvas = document.getElementById("sm-canvas").getContext("2d");

function toggleAutoPlay() {
	autoPlay ^= 1;
	currentCombo = 0;
	if (autoPlay) {
		$autoplay.show();
	} else {
		$autoplay.hide();
	}
	setOption("autoPlay", autoPlay);
}

function adjustSync(delta) {
	extraOffset += delta;
	totalOffset += delta;
	$offset.text(
		[
			"Step ",
			stepOffset.toFixed(3),
			", Extra ",
			extraOffset.toFixed(3),
			" (",
			Math.round(delta * 100) / 100,
			")",
		].join("")
	);
}

function toggleAutoSync() {
	autoSync ^= 1;
	if (autoSync) {
		$autosync.show();
	} else {
		$autosync.hide();
	}
}

function handleAutoSync(offBySec) {
	autoSyncOffByHistory.push(offBySec);
	var len = autoSyncOffByHistory.length;
	if (len < autoSyncSampleSize) {
		return;
	}

	var mean =
		autoSyncOffByHistory.reduce(function (f, e) {
			return f + e;
		}) / len;

	var stddev = Math.sqrt(
		autoSyncOffByHistory.reduce(function (f, e) {
			return f + Math.pow(e - mean, 2);
		}) /
			(len - 1)
	);

	if (stddev < 0.075 && stddev < Math.abs(mean)) {
		adjustSync(-mean);
		console.log(
			[
				"Offset corrected by ",
				mean,
				". Error in steps: ",
				stddev,
				" seconds.",
			].join("")
		);
	} else {
		if (stddev >= 0.075) {
			console.log(
				[
					"Offset NOT corrected. Average offset ",
					mean,
					". Error in steps: ",
					stddev,
					" seconds.",
				].join("")
			);
		}
	}

	autoSyncOffByHistory.length = 0;
}

function step(col, touch) {
	if (autoPlay > 0) {
		return;
	}
	var timingWindow = touch ? timingWindowSecondsTouch : timingWindowSeconds;
	var hit = false;
	var tapNoteScore = 0;
	noteData.forEach(function (note) {
		var noteBeat = note[0];
		var noteCol = note[1];
		var noteProps = note[2];

		if ("tapNoteScore" in noteProps) {
			return;
		}

		if (noteCol != col) {
			return;
		}

		var offBySec = currentTime - beatToSecond(noteBeat);
		var offBySecAbs = Math.abs(offBySec);

		if (offBySecAbs >= timingWindow[timingWindow.length - 1]) {
			return;
		}

		for (var i = 0; i < timingWindow.length; i++) {
			if (offBySecAbs <= timingWindow[i]) {
				noteProps.tapNoteScore = i;
				tapNoteScore = i;
				break;
			}
		}

		if (autoSync) {
			handleAutoSync(offBySec);
		}

		hit = true;
	});
	if (hit) {
		handleTapNoteScore(tapNoteScore);

		var explosion = explosions[mode][col];
		explosion
			.stop()
			.set({ scaleX: 1, scaleY: 1, alpha: 1 })
			.animate({ scaleX: 1.1, scaleY: 1.1 }, 0.1)
			.animate({ alpha: 0 }, 0.1);
	} else {
		var target = targets[mode][col];
		target
			.stop()
			.set({ scaleX: 0.85, scaleY: 0.85 })
			.animate({ scaleX: 1, scaleY: 1 }, 0.2);
	}
}

function touchCanvas(jq_event) {
	var targetTouches = jq_event.originalEvent.targetTouches;
	var targetWidth = jq_event.target.clientWidth / CANVAS_WIDTH;
	var targetHeight = jq_event.target.clientHeight / CANVAS_HEIGHT;
	var targetOffsetX = (jq_event.target.clientWidth - window.screen.width) / 2;
	if (targetTouches) {
		for (var i = 0; i < targetTouches.length; i++) {
			actionCanvas(
				(targetTouches[i].clientX + targetOffsetX) / targetWidth,
				targetTouches[i].clientY / targetHeight
			);
		}
	} else {
		actionCanvas(
			(jq_event.clientX + targetOffsetX) / targetWidth,
			jq_event.clientY / targetHeight
		);
	}
	return !!$overlay;
}

function actionCanvas(x, y) {
	touchControlCords[mode].forEach(function (coords, index) {
		if (
			x >= coords[0] &&
			x <= coords[2] &&
			y >= coords[1] &&
			y <= coords[3]
		) {
			step(index, true);
		}
	});
	if (
		x >= autoPlayCoords[mode][0] &&
		x <= autoPlayCoords[mode][2] &&
		y >= autoPlayCoords[mode][1] &&
		y <= autoPlayCoords[mode][3]
	) {
		toggleAutoPlay();
	}
}

$(document).ready(function () {
	if (options.touch) {
		$sm_canvas.on("touchstart mousedown", touchCanvas);
	}

	$(document).keydown(function (event) {
		var keyCode = event.which;

		var col;
		switch (keyCode) {
			case 90: // z
				col = 0;
				break;

			case 81: // q
				col = 1;
				break;

			case 83: // s
				col = 2;
				break;

			case 69: // e
				col = 3;
				break;

			case 67: // c
				col = 4;
				break;

			case 97: // N1
			case 35: // n1
				col = mode === "double" ? 5 : 0;
				break;

			case 103: // N7
			case 36: // n7
				col = mode === "double" ? 6 : 1;
				break;

			case 101: // N5
			case 12: // n5
				col = mode === "double" ? 7 : 2;
				break;

			case 105: // N9
			case 33: // n9
				col = mode === "double" ? 8 : 3;
				break;

			case 99: // N3
			case 34: // n3
				col = mode === "double" ? 9 : 4;
				break;

			case 116: // F5
				if ($overlay) {
					$overlay.click();
					event.preventDefault();
				}
				break;

			case 117: // F6
				toggleAutoSync();
				if ($overlay) {
					$overlay.click();
				}
				event.preventDefault();
				break;

			case 119: // F8
				if ($overlay) {
					autoPlay = 0;
					toggleAutoPlay();
					$overlay.click();
				} else {
					toggleAutoPlay();
				}
				event.preventDefault();
				break;

			case 122: // F11
				adjustSync(-0.01);
				event.preventDefault();
				break;

			case 123: // F12
				adjustSync(0.01);
				event.preventDefault();
				break;

			case 49: // 1
			case 50: // 2
			case 51: // 3
			case 52: // 4
			case 53: // 5
			case 54: // 6
			case 55: // 7
			case 56: // 8
				scrollSpeed = keyCode - 48;
				if (event.ctrlKey) {
					scrollSpeed -= 0.5;
				}
				if (event.altKey || event.metaKey) {
					scrollSpeed -= 0.25;
				}
				setOption(
					"scrollBPM",
					Math.round((bpm * scrollSpeed) / 25) * 25
				);
				event.preventDefault();
				break;
		}

		if (undefined !== col) {
			step(col);
			event.preventDefault();
		}
	});

	if (autoPlay > 0) {
		$autoplay.show();
	}

	$offset.text(
		[
			"Step ",
			stepOffset.toFixed(3),
			", Extra ",
			extraOffset.toFixed(3),
		].join("")
	);
});

setInterval(function () {
	var thisDate = new Date();
	var deltaSeconds = (thisDate.getTime() - lastDate.getTime()) / 1000;
	update(deltaSeconds);
	draw();
	lastDate = thisDate;
	framesInCurrentSecond++;
	var oldSec = Math.floor(uptimeSeconds);
	var newSec = Math.floor(uptimeSeconds + deltaSeconds);
	if (oldSec != newSec) {
		var fps = framesInCurrentSecond / (newSec - oldSec);
		$FPS.text(fps.toFixed(2));
		framesInCurrentSecond = 0;
	}
	uptimeSeconds += deltaSeconds;
}, 1000 / targetFps);

var lastSeenCurrentTime = 0;
function update(deltaSeconds) {
	// currentTime is choppy in Firefox.
	var ytCurrentTime = ytPlayer.getCurrentTime();
	if (lastSeenCurrentTime != ytCurrentTime) {
		lastSeenCurrentTime = ytCurrentTime;
		currentTime = lastSeenCurrentTime;
	} else if (ytPlayer.getPlayerState() == 1) {
		currentTime += deltaSeconds;
		currentTime = Math.min(currentTime, lastSeenCurrentTime + 0.25);
	}

	targets[mode].forEach(function (target) {
		target.update(deltaSeconds);
	});
	explosions[mode].forEach(function (explosion) {
		explosion.update(deltaSeconds);
	});
	judgment.update(deltaSeconds);

	var missIfOlderThanSeconds = currentTime;
	if (options.touch) {
		missIfOlderThanSeconds -=
			timingWindowSeconds[timingWindowSeconds.length - 1];
	} else {
		missIfOlderThanSeconds -=
			timingWindowSecondsTouch[timingWindowSecondsTouch.length - 1];
	}
	var missIfOlderThanBeat = secondToBeat(missIfOlderThanSeconds);
	var currentBeat = secondToBeat(currentTime);

	noteData.forEach(function (note) {
		var noteBeat = note[0];
		var noteCol = note[1];
		var noteProps = note[2];
		if (autoPlay > 0) {
			if (noteBeat < currentBeat) {
				if (!("tapNoteScore" in noteProps)) {
					noteProps.tapNoteScore = 0;
					handleTapNoteScore(1);
					explosions[mode][noteCol]
						.stop()
						.set({ scaleX: 1, scaleY: 1, alpha: 1 })
						.animate({ scaleX: 1.1, scaleY: 1.1 }, 0.1)
						.animate({ alpha: 0 }, 0.1);
				}
			}
		} else if (noteBeat < missIfOlderThanBeat) {
			if (!("tapNoteScore" in noteProps)) {
				noteProps.tapNoteScore = 5;
				handleTapNoteScore(5);
			}
		}
	});
}

function draw() {
	canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

	drawOrderTargets[mode].forEach(function (index) {
		targets[mode][index].draw();
	});
	drawNoteField();
	drawOrderTargets[mode].forEach(function (index) {
		explosions[mode][index].draw();
	});
	if (options.touch) {
		touchControlSpriteCenter[mode].forEach(function (center) {
			touchControlSprite.draw(canvas, 0, center.x, center.y, 1, 1, 0, 1);
		});
	}

	judgment.draw();
}

function drawNoteField() {
	var musicBeat = secondToBeat(currentTime);
	var arrowSize = 54;
	var arrowSpacing = arrowSize * scrollSpeed;
	var distFromNearestBeat = Math.abs(musicBeat - Math.round(musicBeat));
	var lit = distFromNearestBeat < 0.1;
	drawOrderTargets[mode].forEach(function (index) {
		targets[mode][index].props.frameIndex = (2 * index) % 10;
		if (lit) {
			targets[mode][index].props.frameIndex++;
		}
	});
	var animateOverBeats = 4;
	var musicBeatRemainder = musicBeat % animateOverBeats;
	var percentThroughAnimation = musicBeatRemainder / animateOverBeats;
	var numNoteFrames = 6;
	var noteFrameIndex = percentThroughAnimation * numNoteFrames;

	// TODO - Aldo_MX: Calculate first & last displayed beat / iterate & cache first & last noteData rows to display
	noteData.forEach(function (note) {
		var beat = note[0];
		var col = note[1];
		var noteProps = note[2];
		var colInfo = colInfos[mode][col];
		var beatUntilNote = beat - musicBeat;

		var beatFraction = beat - Math.floor(beat);
		var frameOffset = beatFraction * numNoteFrames;
		var thisNoteFrameIndex =
			(col % 5) * numNoteFrames +
			(Math.round(noteFrameIndex + frameOffset) % numNoteFrames);
		var y = targetsY + beatUntilNote * arrowSpacing;
		var alpha = 1;
		if ("tapNoteScore" in noteProps) {
			if (noteProps.tapNoteScore < 5) {
				alpha = 0;
			}
		}
		noteSprite.draw(
			canvas,
			thisNoteFrameIndex,
			colInfo.x,
			y,
			1,
			1,
			colInfo.rotation,
			alpha
		);
	});
}
