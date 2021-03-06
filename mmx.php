<!DOCTYPE html>
<html>
	<head>
		<title>MMX</title>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
		<link rel="stylesheet" href="styles/mmx.css">
	</head>
	<body>
		<form action="" method="" id="connect" style="background-color: grey; border: 1px solid white">
			<label for="namespace">Namespace</label>
			<input name="namespace" type="text">
			<label for="room">Room</label>
			<input name="room" type="text">
			<button type="button">Connect</button>
		</form>
		<form action="" method="" id="setup"  style="background-color: grey">
			<label for="name">Name</label>
			<input name="name" type="text">
			<label for="controls">Controls(L,R,F,J,D)</label>
			<input name="controls" type="text">
			<button type="button">Join</button>
		</form>
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
		<audio id="audio-background" autoplay>
			<!--<source src="audio/zerostart.mp3" type="audio/mpeg" volume="0.1">-->
		</audio>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
		<script src="scripts/three.min.js"></script>
		<script src="scripts/ColladaLoader.js"></script>
		<!-- shader material source: https://stemkoski.github.io/Three.js/Shader-Glow.html -->
		<script id="vertexShader" type="x-shader/x-vertex">
			uniform vec3 viewVector;
			uniform float c;
			uniform float p;
			varying float intensity;
			void main() 
			{
					vec3 vNormal = normalize( normalMatrix * normal );
				vec3 vNormel = normalize( normalMatrix * viewVector );
				intensity = pow( c - dot(vNormal, vNormel), p );

					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
		</script>
		<script id="fragmentShader" type="x-shader/x-vertex">
			uniform vec3 glowColor;
			varying float intensity;
			void main() 
			{
				vec3 glow = glowColor * intensity;
					gl_FragColor = vec4( glow, 1.0 );
			}
		</script>
		<script src="scripts/x_animations.js"></script>
		<script src="scripts/player.js"></script>
		<script src="scripts/mmx2.js"></script>
	</body>
</html>