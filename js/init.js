var songId = (
	/^\?([0-9A-F]{3,8})(?:\/|%2F)((?:[0-9A-Z_-]|%20){2,20})(?:\/|%2F)([0-9A-Za-z_-]{11,})(?:(?:\/|%2F)([0-9.-]+))?/.exec(
		document.location.search
	) || [, "B57", "S16_CRAZY", "UOHyZ-t35_I", "-0.08"]
).splice(1, 4);
var $overlay = null;
var ytPlayer;

$(document).ready(function () {
	var tag = document.createElement("script");
	tag.src = "https://youtube.com/iframe_api";
	document.body.appendChild(tag);
});

function onYouTubeIframeAPIReady() {
	ytPlayer = new YT.Player("youtube_container", {
		height: "480",
		width: "640",
		videoId: songId[2],
		playerVars: { playsinline: 1 },
		events: {
			onReady: function () {
				StepMania();
			},
			onStateChange: function (state) {
				if (state.data === YT.PlayerState.PLAYING) {
					$("#sm-canvas").show();
				} else {
					$("#sm-canvas").hide();
				}
			},
		},
	});
}

function StepMania() {
	var script_ucs = document.createElement("script");
	script_ucs.type = "text/javascript";
	script_ucs.src = "js/ucs.js";
	script_ucs.onload = function () {
		var ucs_path = "step/" + songId[0] + "/" + songId[1] + ".ucs";
		var ucs_offset = songId[3];
		var onUcsLoaded = function () {
			var script_sprite = document.createElement("script");
			script_sprite.type = "text/javascript";
			script_sprite.src = "js/sprite.js";
			script_sprite.onload = function () {
				var script_actor = document.createElement("script");
				script_actor.type = "text/javascript";
				script_actor.src = "js/actor.js";
				script_actor.onload = function () {
					var script_sm = document.createElement("script");
					script_sm.type = "text/javascript";
					script_sm.src = "js/stepmania.js";
					script_sm.onload = function () {
						ytPlayer.playVideo();
					};
					document.body.appendChild(script_sm);
				};
				document.body.appendChild(script_actor);
			};
			document.body.appendChild(script_sprite);
		};
		loadUcs(ucs_path, onUcsLoaded, ucs_offset);
	};
	document.body.appendChild(script_ucs);
}
