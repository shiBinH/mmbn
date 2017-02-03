(function(){
	
	var player1, player2;
	var camera, scene, renderer;
	var leftBound, rightBound;
	var platforms;
	var prevTime;
	var sfx;
	var dashSpeed;
	
	init();
	
	function init() {
		var geometry, material, mesh;
		
		dashSpeed = 300;
		sfx = {};
		platforms = [];
		player1 = new THREE.Group(), player2 = new THREE.Group();
		player1.position.set(-100, 10, 0); player2.position.set(100, 10, 0);
		leftBound = -200; rightBound = 200;
		
		//	sound effects
		sfx["x-buster"] = newSFX('audio/x-buster.wav');
		sfx["defeat"] = newSFX('audio/defeat.wav', 0.5);
		sfx["jump"] = newSFX('audio/jump.wav', .5);
		sfx["land"] = newSFX('audio/land.wav', .75);
		sfx["hit"] = newSFX('audio/hit2.wav', .35);
		sfx["dash"] = newSFX('audio/dash.wav');
		
		//	initiate camera, scene, renderer
		camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 30, 500);
		//	camera = new THREE.OrthographicCamera(-250, 250, 200, -200, 30, 500)
		camera.position.set(0, 100, 200);
		scene = new THREE.Scene();
		scene.background = new THREE.TextureLoader().load('images/background-x2.jpg');
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		
		//	ruler
		geometry = new THREE.Geometry();
		geometry.vertices.push(new THREE.Vector3(-200, 0, 0));
		geometry.vertices.push(new THREE.Vector3(200, 0, 0));
		geometry.vertices.push(new THREE.Vector3(200, 200, 0))
		material = new THREE.LineBasicMaterial({color: new THREE.Color('white')});
		scene.add(new THREE.Line(geometry, material));
		
		//	players
		material = new THREE.MeshBasicMaterial({color: 0x0040ff, wireframe: true})
		geometry = new THREE.SphereGeometry(10);
		player1.add(new THREE.Mesh(geometry, material));
		material = new THREE.MeshBasicMaterial({color: 0xff1a1a})
		geometry = new THREE.SphereGeometry(3);
		player1.add(new THREE.Mesh(geometry, material));
		player1.coreColor = 0xff1a1a;
		player1.shellColor = 0x0040ff;
		player1.velocity = new THREE.Vector3();
		player1.controls = {'U': 84, 'D': 71, 'L': 70, 'R': 72, 'JUMP': 90, 'FIRE': 88, 'DASH': 83, 'ENABLED': true};
		player1.moving = {'up': false, 'down': false, 'left': false, 'right': false};
		player1.canJump = true;
		player1.facingLeft = false;
		player1.RAY = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
		player1.projectiles = {buster: []};
		player1.HP = 5;
		player1.firing = false;
		player1.fireStart = performance.now();
		player1.airborne = false;
		player1.canDash = performance.now();
		player1.hpBars = [];
		player1.dashing = false;
		player1.dashStart = performance.now();
		player1.dashJumping = false;
		player1.dashable = true;
		player1.dashJumpTimer = null;
		scene.add(player1);
		
		material = new THREE.MeshBasicMaterial({color: 0x0066ff, wireframe: true})
		geometry = new THREE.SphereGeometry(10);
		player2.add(new THREE.Mesh(geometry, material));
		material = new THREE.MeshBasicMaterial({color: 0x3399ff})
		geometry = new THREE.SphereGeometry(3);
		player2.add(new THREE.Mesh(geometry, material));
		player2.velocity = new THREE.Vector3();
		player2.coreColor = 0x3399ff;
		player2.shellColor = 0x0066ff;
		player2.controls = {'U': 38, 'D': 40, 'L': 37, 'R': 39 , 'JUMP': 188, 'FIRE': 190, 'DASH': 76, 'ENABLED': true};
		player2.moving = {'up': false, 'down': false, 'left': false, 'right': false};
		player2.canJump = true;
		player2.facingLeft = false;
		player2.RAY = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
		player2.projectiles = {buster: []};
		player2.HP = 5;
		player2.firing = false;
		player2.fireStart = performance.now();
		player2.airborne = false;
		player2.canDash = performance.now();
		player2.hpBars = [];
		player2.dashing = false;
		player2.dashStart = performance.now();
		player2.dashJumping = false;
		player2.dashable = true;
		player2.dashJumpTimer = null;
		scene.add(player2);
		
		//	hp bars
		for (var i=0 ; i<5 ; i++) {
			material = material = new THREE.LineBasicMaterial({color: new THREE.Color('green')});
			geometry = new THREE.Geometry();
			var height = 200 - 4*i;
			geometry.vertices.push(new THREE.Vector3(-212, height, 0));
			geometry.vertices.push(new THREE.Vector3(-205, height, 0));
			mesh = new THREE.Line(geometry, material);
			scene.add(mesh);
			player1.hpBars.push(mesh);
		}
		
		for (var i=0 ; i<5 ; i++) {
			material = material = new THREE.LineBasicMaterial({color: new THREE.Color('yellow')});
			geometry = new THREE.Geometry();
			var height = 200 - 4*i;
			geometry.vertices.push(new THREE.Vector3(212, height, 0));
			geometry.vertices.push(new THREE.Vector3(205, height, 0));
			mesh = new THREE.Line(geometry, material);
			scene.add(mesh);
			player2.hpBars.push(mesh);
		}
		
		//	generate map
		for (var i=1 ; i<8 ; i++) {
			material = new THREE.LineBasicMaterial({color: new THREE.Color('white')});
			geometry = new THREE.Geometry();
			var left = Math.floor(200 - Math.random() * 400);
			var length = 80 + Math.floor(Math.random() * 60);
			var right = left + length > 200 ? 200 : left + length;
			var height = i * 40 + Math.ceil(5 - 10 * Math.random());
			geometry.vertices.push(new THREE.Vector3(left, height, 0))
			geometry.vertices.push(new THREE.Vector3(right, height, 0));
			mesh = new THREE.Line(geometry, material);
			platforms.push(mesh);
			scene.add(mesh);
		}
		
		//	events
		window.addEventListener( 'resize', onWindowResize, false );
		window.addEventListener('keydown', function(e) {
			key = e.keyCode;
			if (player1.controls.ENABLED) {
				switch(key) {
					case player1.controls.L:
						player1.moving.left = true; player1.facingLeft = true; break;
					case player1.controls.R:
						player1.moving.right = true; player1.facingLeft = false; break;
					case player1.controls.JUMP:
						if (player1.canJump) {
							if (player1.dashJumpTimer === null) player1.dashJumpTimer = performance.now();
							else if (performance.now() - player1.dashJumpTimer < 250) player1.dashJump = true;
							player1.velocity.y += 350;	//	350
							sfx['jump'].play();
							player1.airborne = true;
							if (player1.dashing) player1.dashJump = true;
						}
						player1.canJump = false; break;
					case player1.controls.FIRE:
						player1.firing = true;
						break;
					case player1.controls.DASH:
						if (player1.airborne && performance.now()-player1.dashJumpTimer<50) {
							sfx['dash'].play()
							player1.dashJump = true;
							player1.dashing = true;
							player1.dashable = false;
						}
						else if (!player1.airborne && player1.dashable && !player1.dashing) {
							if (player1.dashJumpTimer === null) player1.dashJumpTimer = performance.now();
							sfx['dash'].play()
							player1.dashStart = performance.now();
							player1.dashing = true;
							player1.dashable = false;
						}
				}
			}
			if (player2.controls.ENABLED) {
				switch(key) {
					case player2.controls.L:
						player2.moving.left = true; player2.facingLeft = true; break;
					case player2.controls.R:
						player2.moving.right = true; player2.facingLeft = false; break;
					case player2.controls.JUMP:
						if (player2.canJump) {
							if (player2.dashJumpTimer === null) player2.dashJumpTimer = performance.now();
							else if (performance.now() - player2.dashJumpTimer < 250) player2.dashJump = true;
							player2.velocity.y += 350;	//	350
							sfx['jump'].play();
							player2.airborne = true;
							if (player2.dashing) player2.dashJump = true;
						}
						player2.canJump = false; break;
					case player2.controls.FIRE:
						player2.firing = true;
						break;		
					case player2.controls.DASH:
						if (player2.airborne && performance.now()-player2.dashJumpTimer<50) {
							sfx['dash'].play()
							player2.dashing = true;
							player2.dashable = false;
						}
						else if (!player2.airborne && player2.dashable && !player2.dashing) {
							if (player2.dashJumpTimer === null) player2.dashJumpTimer = performance.now();
							sfx['dash'].play()
							player2.dashStart = performance.now();
							player2.dashing = true;
							player2.dashable = false;
						}
				}
			}
			if (key === 80) {
					var audio = document.getElementById('audio-background');
					if (audio.paused) audio.play();
					else audio.pause();
				}
		})
		window.addEventListener('keyup', function(e) {
			key = e.keyCode;
			switch(key) {
				case player1.controls.L:
					player1.moving.left = false;  
					player1.velocity.x = 0; break;
				case player1.controls.R:
					player1.moving.right = false; 
					player1.velocity.x = 0; break;
				case player1.controls.FIRE:
					player1.firing = false;
				case player1.controls.JUMP:
					if (player1.velocity.y > 0 ) player1.velocity.y = 0;
					break;
				case player1.controls.DASH:
					if (player1.dashJumpTimer === null) player1.dashJumpTimer = performance.now();
					player1.dashing = false;
					player1.velocity.x = 0;
					player1.dashable = true;
					break;
				case player2.controls.L:
					player2.moving.left = false;  
					player2.velocity.x = 0; break;
				case player2.controls.R:
					player2.moving.right = false; 
					player2.velocity.x = 0; break;
				case player2.controls.FIRE:
					player2.firing = false;
				case player2.controls.JUMP:
					if (player2.velocity.y > 0 ) player2.velocity.y = 0;
					break;
				case player2.controls.DASH:
					if (player2.dashJumpTimer === null) player2.dashJumpTimer = performance.now();
					player2.dashing = false;
					player2.velocity.x = 0;
					player2.dashable = true;
					break;
			}
		})
		
		//	initiate
		prevTime = performance.now();
		renderer.render(scene, camera);
		animate();
	}
	
	function updatePlayer(player, time) {
		var g = 1100;	//	980
		var deceleration = 10;
		var acceleration = 1500;
		var delta = (time - prevTime)/1000;
		var Vx = 150;
		
		player.velocity.y -= g * delta;
		
		player.RAY.ray.origin.copy(player.position);
		
		if (player.RAY.intersectObjects(platforms).length > 0) {
			player.velocity.y = Math.max(player.velocity.y, 0);
			if (player.velocity.y === 0) {
				player.canJump = true;
				if (player.airborne) {
					sfx['land'].play();
					player.airborne = false;
					player.dashJump = false;
					player.dashJumpTimer = null;
				}
			}
		}
		
		if (player.moving.left) player.velocity.x = -Vx;
		if (player.moving.right) player.velocity.x = Vx;
		if (!player.moving.left && !player.moving.right && player.velocity.x!= 0) player.velocity.x = 0;
		if  (player.dashJump) {
			if (player.moving.left||player.moving.right) player.velocity.x = dashSpeed * (player.facingLeft?-1:1);
			else player.velocity.x = 0;
		}
		else if (player.dashing) {
			if (time - player.dashStart < 300) player.velocity.x = dashSpeed * (player.facingLeft?-1:1);
			else {
				/*
				if (player.moving.left || player.moving.right) player.velocity.x = (player.facingLeft?-1:1)*Vx;
				else player.velocity.x = 0;
				*/
				player.velocity.x = 0;
				player.dashing = false;	
			}
		}

		player.translateX(player.velocity.x * delta);
		player.translateY(player.velocity.y * delta);
		
		if (player.position.x<leftBound) player.position.x = leftBound;
		else if (player.position.x>rightBound) player.position.x = rightBound;
		
		if (player.position.y-10 < 0) {
			player.canJump = true;
			player.velocity.y = 0;
			player.position.y = 10;
			if (player.airborne) {
				sfx['land'].play();
				player.airborne = false;
				player.dashJump = false;
				player.dashJumpTimer = null;
			}
		}
		
		if (time - player.hitStart >= 1000) {
			player.hitStart = undefined;
			player.children[0].material.color = new THREE.Color(player.shellColor)
		}
	}
	
	function updateProjectiles(player, time) {
		var delta = (time - prevTime)/1000;
		var target = player === player1 ? player2 : player1;
		var busters = player.projectiles.buster;
		
		if (player.firing && time - player.fireStart >= 350) {
			var busterMesh = newBuster(player);
			player.projectiles.buster.push({
				raycaster: new THREE.Raycaster(new THREE.Vector3(0, 0, 0), new THREE.Vector3((player.faceLeft?-1:1), 0, 0), 0, 7),
				obj: busterMesh
			})
			scene.add(busterMesh);
			player.fireStart = time;
			sfx['x-buster'].play();
		}
		
		for (var i=0 ; i<busters.length ; i++) {
			busters[i].obj.translateX(busters[i].obj.velocity.x * delta);
			busters[i].raycaster.ray.origin.copy(busters[i].obj.position);
			var targetObj = scene.getObjectById(target.id) ;
			var targets = busters[i].raycaster.intersectObjects(targetObj ? targetObj.children : []);
			if (targets.length > 0) {
				var id = busters.shift().obj.id;
				scene.remove(scene.getObjectById(id));
				if (target.hitStart === undefined) {
					sfx['hit'].play();
					target.hpBars[5-target.HP].material.color = new THREE.Color('grey')
					//	scene.remove(target.hpBars.shift())
					target.HP--;
					target.hitStart = time;
					target.children[0].material.color = new THREE.Color('red');
					if (target.HP === 0) {
						target.controls.ENABLED = false;
						scene.remove(target);
						sfx["defeat"].play();
					}
				}
			}
			else if (busters[i].obj.position.x > rightBound+10 || busters[i].obj.position.x < leftBound-10) {
				var id = busters.shift().obj.id;
				scene.remove(scene.getObjectById(id));
			}
		}
	}
	
	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}
	
	function animate() {
		var time = performance.now();
		updateProjectiles(player1, time);
		updatePlayer(player1, time);
		updateProjectiles(player2, time);
		updatePlayer(player2, time);
		prevTime = time;
		
		renderer.render(scene, camera);
		requestAnimationFrame(animate);
	}
	
	function newBuster(player) {
		var geometry = new THREE.SphereGeometry(3);
		var material = new THREE.MeshBasicMaterial({color: 0xffb366});
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(player.position);
		mesh.velocity = new THREE.Vector3((player.facingLeft?-350:350), 0, 0);
		return mesh;
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
	
	
})();