<!DOCTYPE html>
<html>
	<head>
		<title>MMX</title>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
		<link rel="stylesheet" href="styles/mmx.css">
	</head>
	<body>
		<div id="rotations" style="float:left; color: white; display: none">
			<div id="body">Body <button>x</button><button>y</button><button>z</button></div>
			<div id="head">Head <button>x</button><button>y</button><button>z</button></div>
			<div id="pelvis">Pelvis <button>x</button><button>y</button><button>z</button></div>
			<div id="r_shoulder">R_shoulder <button>x</button><button>y</button><button>z</button></div>
			<div id="r_elbow">R_elbow <button>x</button><button>y</button><button>z</button></div>
			<div id="r_hand">R_hand <button>x</button><button>y</button><button>z</button></div>
			<div id="l_shoulder">L_shoulder <button>x</button><button>y</button><button>z</button></div>
			<div id="l_elbow">L_elbow <button>x</button><button>y</button><button>z</button></div>
			<div id="l_hand">L_hand <button>x</button><button>y</button><button>z</button></div>
			<div id="r_leg">R_leg <button>x</button><button>y</button><button>z</button></div>
			<div id="r_knee">R_Knee <button>x</button><button>y</button><button>z</button></div>
			<div id="r_ankle">R_ankle <button>x</button><button>y</button><button>z</button></div>
			<div id="l_leg">L_leg <button>x</button><button>y</button><button>z</button></div>
			<div id="l_knee">L_knee <button>x</button><button>y</button><button>z</button></div>
			<div id="l_ankle">L_ankle <button>x</button><button>y</button><button>z</button></div>
		</div>
		<audio id="audio-background" volume="0.5">
			<source src="audio/mmx2-zero-theme.mp3" type="audio/mpeg" volume="0.5">
		</audio>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
		<script src="scripts/three.min.js"></script>
		<script src="scripts/ColladaLoader.js"></script>
		<script src="scripts/x_animations.js"></script>
		<script src="scripts/player.js"></script>
		<script src="scripts/mmx2.js"></script>
	</body>
</html>