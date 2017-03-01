(function() {
	
	var camera, scene, renderer;
	var clock;
	var objects;
	var players;
	var socket;
	var temp;
	var user;
	var clientKeys;

	
	init();
	animate();
	
	function init() {
		
		var geometry, material, mesh,
				gridhelper, axis;
		clock = new THREE.Clock();
		clientKeys = {};
		objects = [];
		players = {};
		temp = 0;
		
		scene = new THREE.Scene();
		scene.bounds = {left: -1000, right: 1000};
		scene.background = new THREE.TextureLoader().load('images/background-x2.jpg');
		var directional = new THREE.DirectionalLight('white', 1);
		directional.position.set(0, 100, 20)
		scene.add(directional)
		var hemisphere = new THREE.HemisphereLight('white', 1);
		hemisphere.position.set(0, 200, 0)
		scene.add(hemisphere)
		
		//camera = new THREE.OrthographicCamera(-1920/6, 1920/6, 1080/6, -1080/6, 30, 500)
		camera= new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 30, 1000)
		camera.position.set(0, 0, 400)
		camera.lookAt(new THREE.Vector3(0, 0, 0))
		
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		
		
		geometry = new THREE.BoxGeometry(50, 40, 100);
		material = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('images/metal.jpg'), side:THREE.DoubleSide})
		mesh = new THREE.Mesh(geometry, material)
		mesh.purpose = 'surface';
		mesh.position.set(-170, -60, 0);
		scene.add(mesh); objects.push(mesh);
		geometry = new THREE.BoxGeometry(50, 40, 100);
		material = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('images/metal.jpg'), side:THREE.DoubleSide})
		mesh = new THREE.Mesh(geometry, material)
		mesh.purpose = 'surface';
		mesh.position.set(170, -60, 0);
		scene.add(mesh); objects.push(mesh);
		geometry = new THREE.BoxGeometry(350, 40, 100);
		material = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('images/metal.jpg'), side:THREE.DoubleSide})
		mesh = new THREE.Mesh(geometry, material)
		mesh.position.y = -170;
		mesh.purpose = 'surface';
		scene.add(mesh); objects.push(mesh)
		geometry = new THREE.BoxGeometry(80, 300, 100);
		material = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('images/metal.jpg'), side: THREE.DoubleSide});
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(0, 270, 0);
		scene.add(mesh); objects.push(mesh);
		geometry = new THREE.BoxGeometry(500, 600, 100);
		mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(-520, 0, 0)
		mesh.purpose = 'surface'
		scene.add(mesh); objects.push(mesh)
		mesh = mesh.clone(true)
		mesh.position.x *= -1;
		mesh.purpose = 'surface'
		scene.add(mesh); objects.push(mesh)
		geometry = new THREE.BoxGeometry(50, 40, 50);
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(-255, 85, 0);
		scene.add(mesh); objects.push(mesh)
		mesh = mesh.clone(true);
		mesh.position.x *= -1;
		mesh.purpose = 'surface';
		scene.add(mesh); objects.push(mesh)
		geometry = new THREE.BoxGeometry(40, 35, 50);
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(0, 0, 0);
		scene.add(mesh); objects.push(mesh)
		geometry = new THREE.BoxGeometry(800, 20, 50);
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(0, 300, 0);
		scene.add(mesh); objects.push(mesh)

		var setup = document.getElementById('setup');
		setup.addEventListener('click', function(e){
			if (e.target.type !== 'button') return;
			var userInput = this.controls.value.toUpperCase();
			if (userInput.length !== 5) return;
			var newPlayer = new X.Player(this.name.value, {
				left: userInput.charCodeAt(0), right: userInput.charCodeAt(1),
				fire: userInput.charCodeAt(2), jump: userInput.charCodeAt(3), dash: userInput.charCodeAt(4)
			});
			newPlayer.position.set(0, 50, 0);
			scene.add(newPlayer); objects.push(newPlayer);
			user = newPlayer;
			scene.add(newPlayer.game.health.mesh)
			this.style.display = 'none';
		})
		var connect = document.getElementById('connect');
		connect.addEventListener('click', function(e) {
			if (e.target.type !== 'button') return;
			this.style.display = 'none';
			var nmsp = this.namespace.value;
			var room = this.room.value;
			socket = io('/'+nmsp);
			socket.on('connect', function(){
				players[socket.id] = user;
				socket.emit('new_player', {player: socket.id, name: user.name, controls: user.controls})
			});
			socket.on('announcement', function(data) {
				console.log(data);
			});
			socket.on('add_player', function(data) {
				if (players[data.player]) return;
				players[data.player] = new X.Player(data.name, data.controls);
				players[data.player].position.set(0, 50, 0);
				scene.add(players[data.player]); objects.push(players[data.player]);
				scene.add(players[data.player].game.health.mesh)
			})
			socket.on('update_user', function(data) {
				players[data.player].keysMap = data.keysMap;
				if (data.player === socket.id) return;
				players[data.player].game.health.next = data.hp;
				players[data.player].position.set(data.position.x, data.position.y, data.position.z);
			});
			socket.on('player_disconnect', function(id) {
				scene.remove(players[id]); scene.remove(players[id].game.health.mesh);
				delete players[id];
			})
		})
		document.addEventListener('keydown', function(e) {
			var key = e.keyCode;
			clientKeys[key] = true;

			/*
			if (key === 39) player1.bones.body.position.x += 1;
			if (key === 37) player1.bones.body.position.x += -1;
			*/
			if (key === 82) {
				if (user && user.game.health.HP<=0) scene.add(user);
				user.game.health.mesh.visible = true;
				user.game.health.HP = user.game.health.full;
				user.dead = null;
				user.position.set(240*Math.sign(1-2*Math.random()), 220, 0)
			}
			/*
			if (key === 76) {
				for (var prop in player1.bones) console.log(player1.bones[prop].quaternion)
			}
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
			*/
		})
		document.getElementById('rotations').addEventListener('click', function(e){
			var target = e.target;
			var angle = target.innerText.toUpperCase();
			var bone = target.parentNode.id;
			//player1.bones[bone]['rotate'+angle](0.1* (keysMap[189]?-1:1));
			//player1.bones[bone].rotation[angle.toLowerCase()] *= -1
		})
		document.addEventListener('keyup', function(e) {
			var key = e.keyCode;
			clientKeys[key] = false;
		})
		document.addEventListener('resize', function() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight );
		})
		
		document.getElementById("audio-background").volume = 0.3
		renderer.render(scene, camera)
		
	}
	
	function updatePlayer(player, delta) {
		if (player.dead) return;
		var keysMap = player.keysMap;
		var g = 1100;
		var Vx = 130;
		var _dashSpd = 260;
		var time = player.game.clock.getElapsedTime();
		var isAirborne = player.game.isAirborne(scene)

		for (bound in player.bounds) player.bounds[bound].ray.origin.copy(player.position);
		player.bounds.rightUp.ray.origin.x += 4;
		player.bounds.leftUp.ray.origin.x -= 4;
		player.bounds.botRight.ray.origin.y -= 29;
		player.bounds.botLeft.ray.origin.y -= 29;
		player.bounds.rightFoot.ray.origin.x += 8; player.bounds.rightFoot.ray.origin.y += 0;
		player.bounds.leftFoot.ray.origin.x += -8; player.bounds.leftFoot.ray.origin.y += 0;

		if (keysMap[player.controls.fire]) {

			if (player.game.fire.timer === null) player.game.fire.timer = time;
			else if (time - player.game.fire.timer> 2.5) {
				player.sfx['charging_done'].play();
				var offset = Math.cos(temp++);
				player.charge.b.scale.set(6.5+offset, 6.5+offset, 6.5+offset)
				player.charge.b.material.uniforms['c'].value = 1;
				player.charge.b.material.uniforms['p'].value = 1.2;
				player.charge.b.material.side = THREE.FrontSide
			}
			else if (time - player.game.fire.timer > 1.25 ) {
				var offset = 2*Math.sin(time+1);
				player.charge.a.scale.set(6, 6, 6)
				player.charge.a.material.uniforms['c'].value = 1;
				player.charge.a.material.uniforms['p'].value = 1.2;
				player.charge.b.scale.addScalar(7/60);
				
			}
			else if (time - player.game.fire.timer>0.5) {
				player.sfx['charging_up'].play()
				player.charge.a.scale.multiplyScalar(1.045);
			}
		} else {
			if (player.game.fire.timer !== null) {
				var projectile;
				if (player.animation) player.animation.fire()
				if (time-player.game.fire.timer>2.5) {
					if (!player.charge2) {
						player.charge2 = new X.Weapon.Charge2(player);
					}
					player.charge2.active = true;
					projectile = player.charge2;
					projectile.sfx.fire.play();
				}
				else if (time - player.game.fire.timer >1.25) {
					projectile = new X.Weapon.Charge1(player);
					projectile.sfx.fire.play();
				}
				else 	projectile = new X.Weapon.Buster(player);
				if (projectile.purpose === 'projectile') {
					scene.add(projectile); //objects.push(projectile);
					player.sfx['x-buster'].pause()
					player.sfx['x-buster'].currentTime = 0;
					player.sfx['x-buster'].play()
				}
				player.charge.a.scale.set(1, 1, 1);
				player.charge.a.material.uniforms['c'].value = 1;
				player.charge.a.material.uniforms['p'].value = 2.7;
				player.charge.b.scale.set(1, 1, 1);
				player.charge.b.material.uniforms['c'].value = 1;
				player.charge.b.material.uniforms['p'].value = 2.7;
				player.sfx['charging_up'].pause();
				player.sfx['charging_up'].currentTime = 0;
				player.sfx['charging_done'].pause();
				player.sfx['charging_done'].currentTime = 0;
				player.game.fire.timer = null;
				
			}
			
		}

		if (keysMap[player.controls.left]) {
			if (!player.game.left && player.game.dashing && !player.game.dashJ) player.game.dashing = false;
			player.game.left = true;
			if (!player.game.dashing && time-player.game.wJump_timer>.16) player.velocity.x = -Vx//Math.max(player.velocity.x-Vx, -Vx)
			if (player.animation && !isAirborne && !player.game.airborne) {
				if (player.game.dashing) player.animation.dash();
				else player.animation.run();
			}
			
		} 
		if (keysMap[player.controls.right]) {
			if (player.game.left && player.game.dashing && !player.game.dashJ) player.game.dashing = false;
			player.game.left = false;
			if (!player.game.dashing && time-player.game.wJump_timer>.16) player.velocity.x = Vx//Math.min(player.velocity.x+Vx, Vx)
			if (player.animation && !isAirborne && !player.game.airborne) {
				if (player.game.dashing) player.animation.dash();
				else player.animation.run();
			}
		}
		
		if (keysMap[player.controls.dash] && player.game.can_dash) {
				player.game.can_dash = false
				if (!isAirborne) {
					player.animation.dash();
					player.game.dashing = true;
					player.sfx['dash'].play()
					player.game.dash_prev = time;
			}
		}
		if (player.game.dashing) {
			if (player.game.dashJ || time-player.game.dash_prev<0.6) {
				//if (time-player.game.wJump_timer>.16) player.velocity.x = Math.min(Math.abs(player.velocity.x)+_dashSpd,_dashSpd) * (player.game.left?-1:1);
				if (time-player.game.wJump_timer>.16) player.velocity.x = _dashSpd * (player.game.left?-1:1);
			}
			else {
				player.game.dashing = false;
				player.game.dash_prev = time;
			}
		}
		if (!player.game.dashJ && !keysMap[player.controls.dash]) {
			player.game.dashing = false;
			player.game.can_dash = true;
		}

		
		if (keysMap[player.controls.jump]) {
			if (!isAirborne && player.game.can_jump) {
				player.velocity.y = 430; player.game.airborne = true;
				player.game.can_jump = false;
				player.sfx['jump'].play();
				if(player.game.dashing) player.game.dashJ = true;
				if (player.animation) player.animation.jump();
			} else if (player.game.airborne) player.can_jump = false;
		}
		else {
			player.velocity.y = Math.min(0, player.velocity.y);
			if (!player.game.airborne) player.game.can_jump = true;
		}
			
		if (isAirborne && player.animation) {
			if (player.velocity.y<=0 && player.velocity.y+delta*(g)>=0 && !player.game.onWall) player.animation.fall()
			if (keysMap[player.controls.left]) player.animation.turn_left();
			else if (keysMap[player.controls.right]) player.animation.turn_right();
		}
		
		if (!keysMap[player.controls.left] && !keysMap[player.controls.right]) {
			if((player.game.dashJ || (!player.game.dashing)) && time-player.game.wJump_timer>.16) player.velocity.x = 0
			if (player.animation && !player.game.isAirborne(scene)) {
				if (keysMap[player.controls.dash] && player.game.can_dash) player.animation.dash();
				else if (!player.game.dashing && player.game.left) player.animation.stop_left();
				else if (!player.game.dashing && !player.game.left) player.animation.stop_right();
			}
		}
		
		var intersections = [];
		intersections.push(player.bounds.botRight.intersectObjects(scene.children));
		for (var obj in intersections[0]) {
			var intersected = intersections[0][obj]
			if (intersected.object.purpose === 'surface') {
				player.velocity.x = Math.min(0, player.velocity.x);
				player.position.x = intersected.point.x - player.bounds.botRight.far;
				player.game.dashJ = false;
				player.game.dashing = false;
				
				if (isAirborne && !keysMap[player.controls.right] && player.velocity.y<=0) {
					player.game.airborne = true;
					if (player.animation && player.velocity.y+100+g*delta>=0) {
						if (time-player.game.latch_time>.25 && player.game.sliding) {player.animation.turn_left(); player.game.left = true;}
						player.animation.fall();
						
					}
				}
				if (keysMap[player.controls.right]&&isAirborne) player.game.onWall = true; 
				else {player.game.onWall = false; player.game.sliding = false;}
				if (player.velocity.y<=0 && keysMap[player.controls.right] && (player.game.airborne )) {
					player.game.airborne = false;
					player.game.latch_time = time;
					player.game.can_wJump = true;
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
				player.game.dashJ = false;
				player.game.dashing = false;
				
				if (isAirborne && !keysMap[player.controls.left] && player.velocity.y<=0) {
					player.game.airborne = true;
					if (player.animation && player.velocity.y+100+g*delta>=0) {
						player.animation.fall(); 
						if (time-player.game.latch_time>.25 && player.game.sliding) {player.animation.turn_right(); player.game.left = false;}
					}
				}
				if (keysMap[player.controls.left]&&isAirborne) player.game.onWall = true;
				else {player.game.onWall = false; player.game.sliding = false;}
				if (player.velocity.y<=0 && keysMap[player.controls.left] && player.game.airborne) {
					player.game.latch_time = time;
					player.game.airborne = false;
					player.game.can_wJump = true;
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
				player.game.dashJ = false;
				player.game.dashing = false;
				
				if (isAirborne && !keysMap[player.controls.right] && player.velocity.y<=0) {
					player.game.airborne = true;
					if (player.animation && player.velocity.y+100+g*delta>=0) {
						if (time-player.game.latch_time>.25 && player.game.sliding) {player.animation.turn_left(); player.game.left = true;}
						player.animation.fall(); 
					}
				}
				if (keysMap[player.controls.right]&&isAirborne) player.game.onWall = true; 
				else {player.game.onWall = false; player.game.sliding = false;}
				if (player.velocity.y<=0 && keysMap[player.controls.right] && player.game.airborne) {
					player.game.latch_time = time;
					player.game.airborne = false;
					player.game.can_wJump = true;
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
				player.game.dashJ = false;
				player.game.dashing = false;
				
				if (isAirborne && !keysMap[player.controls.left] && player.velocity.y<=0) {
					player.game.airborne = true;
					if (player.animation && player.velocity.y+100+g*delta>=0) {
						player.animation.fall(); 
						if (time-player.game.latch_time>.25 && player.game.sliding) {player.animation.turn_right(); player.game.left = false;}
					}
				}
				if (keysMap[player.controls.left]&&isAirborne) player.game.onWall = true;
				else {player.game.onWall = false; player.game.sliding = false;}
				if (player.velocity.y<=0 && keysMap[player.controls.left] && player.game.airborne) {
					player.game.latch_time = time;
					player.game.airborne = false;
					player.game.can_wJump = true;
				}
				break;
			}
		}
		
		if (intersections[0].length === 0 && intersections[1].length === 0 && 
				intersections[2].length === 0 && intersections[3].length === 0) {
			player.game.can_wJump = false;
			player.game.onWall = false;
			player.game.sliding = false;
			if (player.game.airborne) player.game.can_jump = false;
			if (player.velocity.y<0 && isAirborne && player.animation && player.velocity.y+100+g*delta>=0) {player.animation.fall();}
		}
		if ((player.game.can_wJump||player.game.onWall) && player.velocity.y<=0) {
			if (player.game.can_wJump&&player.game.can_jump && keysMap[player.controls.jump] && player.game.wJump_cast === null) player.game.wJump_cast = time;
			if (player.game.can_wJump && player.game.can_jump && player.game.wJump_cast && time-player.game.wJump_cast>0.0) {
				if (intersections[1].length>0 || intersections[3].length>0) player.game.left = true;
				else player.game.left = false;
				if (player.animation) player.animation.jump()
				player.game.airborne = true;
				if (keysMap[player.controls.dash]) {
					player.velocity.x = (player.game.left?1:-1)*(_dashSpd)
					player.game.dashJ = true;
					player.game.dashing = true;
					player.game.can_dash = false;
					player.sfx['dash_wJump'].play()
				}
				else {
					player.velocity.x = (player.game.left?1:-1)*(Vx);
					player.sfx['jump'].play()
				}
				player.game.wJump_timer = time;
				player.velocity.y = 400; 
				player.game.can_jump = false;
				player.game.wJump_cast = null;
				player.game.can_wJump = false
				player.game.onWall = false
			} 
			else if (player.game.wJump_cast && time-player.game.wJump_cast<=.08) player.velocity.y = 0;
			else if (player.game.onWall && time - player.game.latch_time <= .08) player.velocity.y = 0;
			else if (player.game.onWall && time - player.game.latch_time > .08){
				if (player.animation && time-player.game.latch_time-delta<.08) player.animation.slide();
				player.velocity.y = -100;
				if (isAirborne && time - player.game.latch_time > .12) 
					player.game.sliding = true;
			}
			else player.velocity.y -= g * delta
		}
		else player.velocity.y -= g * delta;
		player.velocity.y = Math.max(-450, player.velocity.y)
		if (time-player.game.flinch.timer<.2) {
			player.velocity.x = player.game.flinch.vx;
			player.game.can_jump = false;
		}
		else player.game.flinch.status = false;
		if (time-player.game.flinch.timer<.05) player.velocity.y = player.game.flinch.vy
		else if (time-player.game.flinch.timer-delta<.05) player.velocity.y = 0;
		
		if (player === user) {
			player.position.x += player.velocity.x * delta;
			player.position.y += player.velocity.y * delta;
		}
		
		intersections.push(player.bounds.rightFoot.intersectObjects(scene.children))
		for (var obj in intersections[4]) {
			if (player.velocity.y<0 && intersections[4][obj].object.purpose === 'surface') {
				if (player.game.airborne) {
					player.sfx['land'].play();
					player.game.airborne = false;
					player.game.dashJ = false;
					player.game.dashing = false;
				}
				player.position.y = player.bounds.rightFoot.y+intersections[4][obj].point.y;
				player.velocity.y = 0;
				break;
			}
		}
		intersections[5] = player.bounds.leftFoot.intersectObjects(scene.children)
		for (var obj in intersections[5]) {
			if (player.velocity.y<0 && intersections[5][obj].object.purpose === 'surface') {
				if (player.game.airborne) {
					player.sfx['land'].play();
					player.game.airborne = false;
					player.game.dashJ = false;
					player.game.dashing = false;
				} 
				player.position.y = player.bounds.leftFoot.y+intersections[5][obj].point.y;
				player.velocity.y = 0;
				break;
			}
		}
		if (intersections[4].length!==0 || intersections[5].length!==0) flag = true;
		else flag = false;
		
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

		
		if (!player.game.can_wJump && !player.game.onWall) {
			player.game.wJump_cast = null;
			if (player.velocity.y<0) player.game.airborne = true;
		}

		if (player.animation) player.animation.update(delta);
		
		var health = player.game.health;
		health.mesh.position.copy(player.position);
		if (player !== user) health.HP = health.next;
		if (player.position.y<-300 || health.HP <= 0) {
			player.sfx['death'].play()
			// scene.remove(player);
			player.game.fire.timer = null;
			player.charge.a.scale.set(1, 1, 1); player.charge.b.scale.set(1, 1, 1);
			player.position.set(600, 600, 0);
			health.HP = 0; health.mesh.visible = false;
			for (var plyr in players) if (players[plyr] === player) 
				{players[plyr].dead = time; break;}
		}
		else health.mesh.scale.y = (health.HP/health.full<1/100?1/100:health.HP/health.full);
		if (time - health.prev > .3) {
			if (health.mesh.scale.y > 0.5) health.mesh.material.color.set(0x00ff00);
			else if (health.mesh.scale.y > 0.2) health.mesh.material.color.set(0xffff00);
			else health.mesh.material.color.set(0xff6600);
		}
		health.mesh.position.y += 20;
		
		
		for (var level in player.charge) {
			if (player.charge[level].type === 'Group') continue;
			player.charge[level].position.copy(player.bones.body.position)
			player.charge[level].position.y -= 3
			player.charge[level].material.uniforms.viewVector.value = new THREE.Vector3().subVectors( camera.position, player.charge[level].getWorldPosition() );
		}
	}
	
	function animate() {
		var delta = clock.getDelta();
		

		for (var plyr in players) {
			if (players[plyr].game.health.HP<=0 && players[plyr].dead && players[plyr].game.clock.getElapsedTime()-players[plyr].dead>5) {
				//scene.add(players[plyr]);
				players[plyr].game.health.mesh.visible = true;
				players[plyr].game.health.HP = players[plyr].game.health.full;//scene.add(players[plyr].game.health.mesh);
				players[plyr].dead = null;
				players[plyr].velocity.set(0, 0, 0)
				players[plyr].position.set(plyr%2==0?-240:240, 180, 0)
			}
		}
		if (socket && socket.id) {
			socket.emit('update', {player: socket.id,
														 hp: user.game.health.HP, 
														 keysMap: clientKeys,
														 position: {x:user.position.x, y:user.position.y, z:user.position.z}
														});
		}
		for (var plyr in players) updatePlayer(players[plyr], delta);
		for (var ob=0 ; ob<scene.children.length ; ob++) if (scene.children[ob].update_game) {
			if (scene.children[ob].update_game({delta:delta, scene:scene}) === -1) {
				scene.remove(scene.children[ob]);
			}
		}
		/*
		for (var ob=0 ; ob<objects.length ; ob++) if (objects[ob].update_game) {
			if (objects[ob].update_game({delta: delta, scene:scene}) === -1) {
				scene.remove(objects[ob]);
				objects[ob] = objects[objects.length-1];
				objects.pop();
			}
		}
		
		var blockObjs = [];
		for (var plyr=0 ; plyr<players.length ; plyr++) if (!players[plyr].dead) blockObjs = blockObjs.concat(viewCheck(players[plyr]));
		function viewCheck(player) {
			var camPosition = camera.position.clone()
			var playerPosition = player.position.clone()
			playerPosition.sub(camPosition);
			playerPosition.normalize();
			var rayc = new THREE.Raycaster(camera.position.clone(), 
																		 playerPosition
																		)
			var ret = [];
			var intersections = rayc.intersectObjects(scene.children);
			for (var obj=0 ; obj<intersections.length ; obj++) {
				if (intersections[obj].object === player) break;
				ret.push(intersections[obj].object);
				intersections[obj].object.material.transparent = true;
				intersections[obj].object.material.opacity = 0.6;
			}
			return ret;
		}
		for (var i=0 ; i<scene.children.length ; i++) {
			inner: {
				for (var j=0 ; j<blockObjs.length ; j++) {
					if (scene.children[i] === blockObjs[j]) break inner;
				}
				if (!scene.children[i].material) break inner;
				scene.children[i].material.transparent = false;
				scene.children[i].material.opacity = 1;
			}
		}
		*/
		
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
	function addPlayer(id, name, controls) {
		players[id] = new X.Player(name, controls);
		scene.add(players[id]); //objects.add(players[id]);
		scene.add(players[id].game.health.mesh)
	}
	
})()