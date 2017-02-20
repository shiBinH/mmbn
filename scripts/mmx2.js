(function() {
	
	var camera, scene, renderer;
	var floor, leftBound, rightBound;
	var player1, player2;
	var clock;
	var keysMap;
	var sfx;
	
	init();
	animate();
	
	function init() {
		var geometry, material, mesh,
				gridhelper, axis;
		//	player1 = new Player(); player2 = new Player();
		floor = 0; leftBound = -200; rightBound = 200;
		clock = new THREE.Clock();
		keysMap = {};
		sfx = {};
		
		//	sound effects
		sfx["x-buster"] = newSFX('audio/x-buster.wav', .5);
		sfx["defeat"] = newSFX('audio/defeat.wav', 0.5);
		sfx["jump"] = newSFX('audio/jump.wav', .5);
		sfx["land"] = newSFX('audio/land.wav', .75);
		sfx["hit"] = newSFX('audio/hit2.wav', .35);
		sfx["dash"] = newSFX('audio/dash.wav');
		
		scene = new THREE.Scene();
		scene.background = new THREE.TextureLoader().load('images/background-x2.jpg');
		var directional = new THREE.DirectionalLight('white', 1);
		directional.position.set(0, 100, 20)
		directional.layers.enable(1)
		scene.add(directional)
		var hemisphere = new THREE.HemisphereLight('white', 1);
		hemisphere.position.set(0, 200, 0)
		scene.add(hemisphere)
		
		//camera = new THREE.OrthographicCamera(-300, 300, 150, -150, 30, 500)
		camera= new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 30, 500)
		//camera.position.set(0, 0, 300)
		camera.lookAt(new THREE.Vector3(0, 0, 0))
		
		renderer = new THREE.WebGLRenderer();
		//	renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		
		gridHelper = new THREE.GridHelper(400, 20, new THREE.Color('yellow'));
		gridHelper.rotateX(Math.PI/2)
		//scene.add(gridHelper)
		
		geometry = new THREE.BoxGeometry(400, 400, 100);
		material = new THREE.MeshPhongMaterial({map: new THREE.TextureLoader().load('images/metal.jpg'), side:THREE.DoubleSide})
		mesh = new THREE.Mesh(geometry, material)
		mesh.position.y -= 400/2;
		mesh.purpose = 'surface';
		scene.add(mesh)
		geometry = new THREE.BoxGeometry(80, 300, 100);
		material = new THREE.MeshPhongMaterial({map: new THREE.TextureLoader().load('images/metal.jpg'), side: THREE.DoubleSide});
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(150, 250, 0);
		scene.add(mesh)
		geometry = new THREE.BoxGeometry(30, 30, 30);
		mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(-100, 70, 0)
		mesh.purpose = 'surface'
		scene.add(mesh)

		
		
		player1 = new Player({
			jump: 90, left: 70, right: 72, fire: 88, dash: 83
		})
		player1.position.set(0, 50, 0)
		scene.add(player1)
		console.log(player1)
		
			
		document.addEventListener('keydown', function(e) {
			var key = e.keyCode;
			keysMap[key] = true;
			
			if (key === 39) player1.bones.body.position.x += 1;
			if (key === 37) player1.bones.body.position.x += -1;
			if (key === 82) player1.position.set (0, 50, 0)
			if (key === 76) {
				for (var prop in player1.bones) console.log(player1.bones[prop].quaternion)
			}
			if (key === 75) for (var prop in counts) console.log(prop + ': ' + counts[prop])
			if (key === 67) player1.animation.j1()
			if (key === 66) {
				var x, y, z;
				x = player1.bones.r_shoulder.rotation.x; y = player1.bones.r_shoulder.rotation.y;z = player1.bones.r_shoulder.rotation.z;
				player1.bones.r_shoulder.rotation.x = player1.bones.l_shoulder.rotation.x;
				player1.bones.r_shoulder.rotation.y = player1.bones.l_shoulder.rotation.y;
				player1.bones.r_shoulder.rotation.z = player1.bones.l_shoulder.rotation.z;
				player1.bones.l_shoulder.rotation.x = x;
				player1.bones.l_shoulder.rotation.y = y;
				player1.bones.l_shoulder.rotation.z = z;
				x = player1.bones.r_elbow.rotation.x; y = player1.bones.r_elbow.rotation.y;z = player1.bones.r_elbow.rotation.z;
				player1.bones.r_elbow.rotation.x = player1.bones.l_elbow.rotation.x;
				player1.bones.r_elbow.rotation.y = player1.bones.l_elbow.rotation.y;
				player1.bones.r_elbow.rotation.z = player1.bones.l_elbow.rotation.z;
				player1.bones.l_elbow.rotation.x = x;
				player1.bones.l_elbow.rotation.y = y;
				player1.bones.l_elbow.rotation.z = z;
				x = player1.bones.r_hand.rotation.x; y = player1.bones.r_hand.rotation.y;z = player1.bones.r_hand.rotation.z;
				player1.bones.r_hand.rotation.x = player1.bones.l_hand.rotation.x;
				player1.bones.r_hand.rotation.y = player1.bones.l_hand.rotation.y;
				player1.bones.r_hand.rotation.z = player1.bones.l_hand.rotation.z;
				player1.bones.l_hand.rotation.x = x;
				player1.bones.l_hand.rotation.y = y;
				player1.bones.l_hand.rotation.z = z;
				x = player1.bones.r_leg.rotation.x; y = player1.bones.r_leg.rotation.y;z = player1.bones.r_leg.rotation.z;
				player1.bones.r_leg.rotation.x = player1.bones.l_leg.rotation.x;
				player1.bones.r_leg.rotation.y = player1.bones.l_leg.rotation.y;
				player1.bones.r_leg.rotation.z = player1.bones.l_leg.rotation.z;
				player1.bones.l_leg.rotation.x = x;
				player1.bones.l_leg.rotation.y = y;
				player1.bones.l_leg.rotation.z = z;
				x = player1.bones.r_knee.rotation.x; y = player1.bones.r_knee.rotation.y;z = player1.bones.r_knee.rotation.z;
				player1.bones.r_knee.rotation.x = player1.bones.l_knee.rotation.x;
				player1.bones.r_knee.rotation.y = player1.bones.l_knee.rotation.y;
				player1.bones.r_knee.rotation.z = player1.bones.l_knee.rotation.z;
				player1.bones.l_knee.rotation.x = x;
				player1.bones.l_knee.rotation.y = y;
				player1.bones.l_knee.rotation.z = z;
				x = player1.bones.r_ankle.rotation.x; y = player1.bones.r_ankle.rotation.y;z = player1.bones.r_ankle.rotation.z;
				player1.bones.r_ankle.rotation.x = player1.bones.l_ankle.rotation.x;
				player1.bones.r_ankle.rotation.y = player1.bones.l_ankle.rotation.y;
				player1.bones.r_ankle.rotation.z = player1.bones.l_ankle.rotation.z;
				player1.bones.l_ankle.rotation.x = x;
				player1.bones.l_ankle.rotation.y = y;
				player1.bones.l_ankle.rotation.z = z;
			}
		})
		document.getElementById('rotations').addEventListener('click', function(e){
			var target = e.target;
			var angle = target.innerText.toUpperCase();
			var bone = target.parentNode.id;
			player1.bones[bone]['rotate'+angle](0.1* (keysMap[189]?-1:1));
			//player1.bones[bone].rotation[angle.toLowerCase()] *= -1
		})
		document.addEventListener('keyup', function(e) {
			var key = e.keyCode;
			keysMap[key] = false;
		})
		document.addEventListener('resize', function() {
			//	adjust camera and renderer
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight );
		})

		renderer.render(scene, camera)
		
	}
	
	function updatePlayer(player, delta) {
		var g = 1100;
		var Vx = 110;
		var _dashSpd = 240;
		//player.user.onWall = false;
		var time = player.user.clock.getElapsedTime();
		
		
		for (bound in player.bounds) player.bounds[bound].ray.origin.copy(player.position);
		player.bounds.rightUp.ray.origin.x += 4;
		player.bounds.leftUp.ray.origin.x -= 4;
		player.bounds.botRight.ray.origin.y -= 25;
		player.bounds.botLeft.ray.origin.y -= 25;
		player.bounds.rightFoot.ray.origin.x += 9; player.bounds.rightFoot.ray.origin.y += -20;
		player.bounds.leftFoot.ray.origin.x += -9; player.bounds.leftFoot.ray.origin.y += -20;
		
		if (keysMap[player.controls.fire]) {
			if (player.animation) player.animation.fire();
			sfx['x-buster'].play();
		}

		if (keysMap[player.controls.left]) {
			if (!player.user.left && player.user.dashing && !player.user.dashJ) player.user.dashing = false;
			player.user.left = true;
			if (!player.user.dashing && time-player.user.wJump_timer>.16) player.velocity.x = Math.max(player.velocity.x-Vx, -Vx)
			if (player.animation && !player.user.isAirborne(scene) && !player.user.airborne) {
				if (player.user.dashing) player.animation.dash();
				else player.animation.run();
			}
			
		} 
		if (keysMap[player.controls.right]) {
			if (player.user.left && player.user.dashing && !player.user.dashJ) player.user.dashing = false;
			player.user.left = false;
			if (!player.user.dashing && time-player.user.wJump_timer>.16) player.velocity.x = Math.min(player.velocity.x+Vx, Vx)
			if (player.animation && !player.user.isAirborne(scene) && !player.user.airborne) {
				if (player.user.dashing) player.animation.dash();
				else player.animation.run();
			}
		}
		
		if (keysMap[player.controls.dash] && player.user.can_dash) {
				player.user.can_dash = false
				if (!player.user.isAirborne(scene)) {
					player.animation.dash();
					player.user.dashing = true;
					sfx['dash'].play()
					player.user.dash_prev = time;
			}
		}
		if (player.user.dashing) {
			if (player.user.dashJ || time-player.user.dash_prev<0.6) {
				if (time-player.user.wJump_timer>.16) player.velocity.x = _dashSpd * (player.user.left?-1:1);
			}
			else {
				player.user.dashing = false;
				player.user.dash_prev = time;
			}
		}
		if (!player.user.dashJ && !keysMap[player.controls.dash]) {
			player.user.dashing = false;
			player.user.can_dash = true;
		}

		
		if (keysMap[player.controls.jump]) {
			if (!player.user.isAirborne(scene) && player.user.can_jump) {
				player.velocity.y = 430; player.user.airborne = true;
				player.user.can_jump = false;
				sfx['jump'].play();
				if(player.user.dashing) player.user.dashJ = true;
				if (player.animation) player.animation.jump();
			} 
		} else {
			player.velocity.y = Math.min(0, player.velocity.y);
			player.user.can_jump = true;
		}
			
		if (player.user.isAirborne(scene) && player.animation) {
			if (player.velocity.y<=0 && player.velocity.y+delta*(g)>=0 && !player.user.onWall) player.animation.fall()
			if (keysMap[player.controls.left]) player.animation.turn_left();
			else if (keysMap[player.controls.right]) player.animation.turn_right();
		}
		
		if (!keysMap[player.controls.left] && !keysMap[player.controls.right]) {
			if((player.user.dashJ || (!player.user.dashing)) && time-player.user.wJump_timer>.16) player.velocity.x = 0
			if (player.animation && !player.user.isAirborne(scene)) {
				if (keysMap[player.controls.dash] && player.user.can_dash) player.animation.dash();
				else if (!player.user.dashing && player.user.left) player.animation.stop_left();
				else if (!player.user.dashing && !player.user.left) player.animation.stop_right();
			}
		}

		var intersections = [];
		intersections.push(player.bounds.botRight.intersectObjects(scene.children));
		for (var obj in intersections[0]) {
			var intersected = intersections[0][obj]
			if (intersected.object.purpose === 'surface') {
				player.velocity.x = Math.min(0, player.velocity.x);
				player.position.x = intersected.point.x - player.bounds.botRight.far;
				player.user.dashJ = false;
				player.user.dashing = false;
				
				if (player.user.isAirborne(scene) && !keysMap[player.controls.right] && player.velocity.y<=0) {
					player.user.airborne = true;
					if (player.animation && player.velocity.y+100+g*delta>=0) {
						if (player.user.sliding) {player.animation.turn_left(); player.user.left = true;}
						player.animation.fall();
						
					}
				}
				if (keysMap[player.controls.right]) player.user.onWall = true; 
				else {player.user.onWall = false; player.user.sliding = false;}
				if (player.velocity.y<0 && keysMap[player.controls.right] && (player.user.airborne )) {
					player.user.airborne = false;
					player.user.latch_time = time;
					player.user.can_wJump = true;
				}
				break;
			}
		}
		intersections.push(player.bounds.botLeft.intersectObjects(scene.children))
		for (var obj in intersections[1]) {
			var intersected = intersections[1][obj]
			if (intersected.object.purpose === 'surface') {
				player.velocity.x = Math.max(0, player.velocity.x);
				player.position.x = intersected.point.x + player.bounds.botLeft.far;
				player.user.dashJ = false;
				player.user.dashing = false;
				
				if (player.user.isAirborne(scene) && !keysMap[player.controls.left] && player.velocity.y<=0) {
					player.user.airborne = true;
					if (player.animation && player.velocity.y+100+g*delta>=0) {
						player.animation.fall(); 
						if (player.user.sliding) {player.animation.turn_right(); player.user.left = false;}
					}
				}
				if (keysMap[player.controls.left]) player.user.onWall = true;
				else {player.user.onWall = false; player.user.sliding = false;}
				if (player.velocity.y<0 && keysMap[player.controls.left] && player.user.airborne) {
					player.user.latch_time = time;
					player.user.airborne = false;
					player.user.can_wJump = true;
				}
				break;
			}
		}
		intersections.push(player.bounds.midRight.intersectObjects(scene.children))
		for (var obj in intersections[2]) {
			var intersected = intersections[2][obj]
			if (intersected.object.purpose === 'surface') {
				player.velocity.x = Math.min(0, player.velocity.x);
				player.position.x = intersected.point.x - player.bounds.midRight.far;
				player.user.dashJ = false;
				player.user.dashing = false;
				
				if (player.user.isAirborne(scene) && !keysMap[player.controls.right] && player.velocity.y<=0) {
					player.user.airborne = true;
					if (player.animation && player.velocity.y+100+g*delta>=0) {
						if (player.user.sliding) {player.animation.turn_left(); player.user.left = true;}
						player.animation.fall(); 
					}
				}
				if (keysMap[player.controls.right]) player.user.onWall = true; 
				else {player.user.onWall = false; player.user.sliding = false;}
				if (player.velocity.y<0 && keysMap[player.controls.right] && player.user.airborne) {
					player.user.latch_time = time;
					player.user.airborne = false;
					player.user.can_wJump = true;
				}
				break;
			}
		}
		intersections.push(player.bounds.midLeft.intersectObjects(scene.children))
		for (var obj in intersections[3]) {
			var intersected = intersections[3][obj]
			if (intersected.object.purpose === 'surface') {
				player.velocity.x = Math.max(0, player.velocity.x);
				player.position.x = intersected.point.x + player.bounds.midLeft.far;
				player.user.dashJ = false;
				player.user.dashing = false;
				
				if (player.user.isAirborne(scene) && !keysMap[player.controls.left] && player.velocity.y<=0) {
					player.user.airborne = true;
					if (player.animation && player.velocity.y+100+g*delta>=0) {
						player.animation.fall(); 
						if (player.user.sliding) {player.animation.turn_right(); player.user.left = false;}
					}
				}
				if (keysMap[player.controls.left]) player.user.onWall = true;
				else {player.user.onWall = false; player.user.sliding = false;}
				if (player.velocity.y<0 && keysMap[player.controls.left] && player.user.airborne) {
					player.user.latch_time = time;
					player.user.airborne = false;
					player.user.can_wJump = true;
				}
				break;
			}
		}
		if (intersections[0].length === 0 && intersections[1].length === 0 && 
				intersections[2].length === 0 && intersections[3].length === 0) {
			player.user.can_wJump = false;
			player.user.onWall = false;
			player.user.sliding = false;
			if (player.velocity.y<0 && player.user.isAirborne(scene) && player.animation && player.velocity.y+100+g*delta>=0) {player.animation.fall();}
		}
		if ((player.user.can_wJump||player.user.onWall) && player.velocity.y<=0) {
			if (player.user.can_wJump&&player.user.can_jump && keysMap[player.controls.jump] && player.user.wJump_cast === null) player.user.wJump_cast = time;
			else if (player.user.can_wJump && player.user.can_jump && player.user.wJump_cast && time-player.user.wJump_cast>0.075) {
				if (player.animation) player.animation.jump()
				player.user.airborne = true;
				sfx['jump'].play()
				if (keysMap[player.controls.dash]) {
					player.velocity.x = (player.user.left?1:-1)*(_dashSpd)
					player.user.dashJ = true;
					player.user.dashing = true;
					player.user.can_dash = false;
				}
				else player.velocity.x = (player.user.left?1:-1)*(Vx)
				player.user.wJump_timer = time;
				player.velocity.y = 400; 
				player.user.can_jump = false;
				player.user.wJump_cast = null;
				player.user.can_wJump = false
				player.user.onWall = false
			} 
			else if (player.user.wJump_cast && time-player.user.wJump_cast<=.075) player.velocity.y = 0;
			else if (player.user.onWall && time - player.user.latch_time <= .075) player.velocity.y = 0;
			else if (player.user.onWall && time - player.user.latch_time > .1){
				if (player.animation && time-player.user.latch_time-delta<.1) player.animation.slide();
				player.velocity.y = -100
				player.user.sliding = true;
			}
			else player.velocity.y -= g * delta
		}
		else player.velocity.y -= g * delta;
		player.velocity.y = Math.max(-450, player.velocity.y)
		
		player.position.x += player.velocity.x * delta;
		player.position.y += player.velocity.y * delta;
		
		intersections = player.bounds.rightFoot.intersectObjects(scene.children)
		for (var obj in intersections) {
			if (player.velocity.y<0 && intersections[obj].object.purpose === 'surface') {
				if (player.user.airborne) {
					sfx['land'].play();
					player.user.airborne = false;
					player.user.dashJ = false;
					player.user.dashing = false;
				}
				player.position.y = player.bounds.rightFoot.y+intersections[obj].point.y;
				player.velocity.y = 0;
				break;
			}
		}
		intersections = player.bounds.leftFoot.intersectObjects(scene.children)
		for (var obj in intersections) {
			if (player.velocity.y<0 && intersections[obj].object.purpose === 'surface') {
				if (player.user.airborne) {
					sfx['land'].play();
					player.user.airborne = false;
					player.user.dashJ = false;
					player.user.dashing = false;
				} 
				player.position.y = player.bounds.leftFoot.y+intersections[obj].point.y;
				player.velocity.y = 0;
				break;
			}
		}
		
		intersections = player.bounds.rightUp.intersectObjects(scene.children);
		for (var obj in intersections) {
			var intersected = intersections[obj];
			if (player.velocity.y>0 && intersected.object.purpose === 'surface') {
				player.velocity.y = 0;
				player.position.y = intersected.point.y - player.bounds.rightUp.far;
				break;
			}
		}
		intersections = player.bounds.leftUp.intersectObjects(scene.children);
		for (var obj in intersections) {
			var intersected = intersections[obj];
			if (player.velocity.y>0 && intersected.object.purpose === 'surface') {
				player.velocity.y = 0;
				player.position.y = intersected.point.y - player.bounds.leftUp.far;
				break;
			}
		}

		
		if (!player.user.can_wJump && !player.user.onWall) {
			player.user.wJump_cast = null;
			if (player.velocity.y<0) player.user.airborne = true;
		}
		if (player.position.y < -450) {
			player.velocity.set(0, 0, 0)
			player.position.set(0, player.bounds.rightFoot.y+5, 0)
		}
		if (player.animation) player.animation.update(delta);
	}
	
	function animate() {
		if (Math.abs(camera.position.x-player1.position.x)>20)
			camera.position.x = player1.position.x + 20 * (camera.position.x>player1.position.x?1:-1)
		camera.position.z = 250
		camera.position.y = player1.position.y
		var delta = clock.getDelta();
		updatePlayer(player1, delta);
		
		renderer.render(scene, camera)
		requestAnimationFrame(animate)
	}
	
	function newSFX(src, vol) {
		var audio = document.createElement('audio');
		var source = document.createElement('source');
		source.src = src;
		source.type = 'audio/wav';
		audio.appendChild(source);
		if (vol !== undefined) audio.volume = vol;
		return audio;
	}
})()