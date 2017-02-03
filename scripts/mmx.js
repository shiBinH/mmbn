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
		
		dashSpeed = 500;
		sfx = {};
		platforms = [];
		player1 = new THREE.Group(), player2 = new THREE.Group();
		player1.position.set(-100, 10, 0); player2.position.set(100, 10, 0);
		leftBound = -200; rightBound = 200;
		
		//	sound effects
		sfx["x-buster"] = newSFX('audio/x-buster.wav');
		sfx["defeat"] = newSFX('audio/defeat.wav', 0.5);
		sfx["jump"] = newSFX('audio/jump.wav');
		sfx["land"] = newSFX('audio/land.wav', .75);
		sfx["hit"] = newSFX('audio/hit2.wav', .35);
		
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
		material = new THREE.MeshBasicMaterial({color: new THREE.Color('green'), wireframe: true})
		geometry = new THREE.SphereGeometry(10);
		player1.add(new THREE.Mesh(geometry, material));
		material = new THREE.MeshBasicMaterial({color: new THREE.Color('yellow')})
		geometry = new THREE.SphereGeometry(3);
		player1.add(new THREE.Mesh(geometry, material));
		player1.coreColor = 'yellow';
		player1.shellColor = 'green';
		player1.velocity = new THREE.Vector3();
		player1.controls = {'U': 89, 'D': 72, 'L': 71, 'R': 74, 'JUMP': 90, 'FIRE': 88, 'DASH': 83, 'ENABLED': true};
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
		scene.add(player1);
		
		material = new THREE.MeshBasicMaterial({color: new THREE.Color('lightblue'), wireframe: true})
		geometry = new THREE.SphereGeometry(10);
		player2.add(new THREE.Mesh(geometry, material));
		material = new THREE.MeshBasicMaterial({color: new THREE.Color('orange')})
		geometry = new THREE.SphereGeometry(3);
		player2.add(new THREE.Mesh(geometry, material));
		player2.velocity = new THREE.Vector3();
		player2.coreColor = 'orange';
		player2.shellColor = 'lightblue';
		player2.controls = {'U': 38, 'D': 40, 'L': 37, 'R': 39 , 'JUMP': 188, 'FIRE': 190, 'ENABLED': true};
		player2.moving = {'up': false, 'down': false, 'left': false, 'right': false};
		player2.canJump = true;
		player2.facingLeft = false;
		player2.RAY = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
		player2.projectiles = {buster: []};
		player2.HP = 5;
		player2.firing = false;
		player2.fireStart = performance.now();
		player2.airborne = false;
		scene.add(player2);
		
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
							player1.velocity.y += 350;
							sfx['jump'].play();
							player1.airborne = true;
						}
						player1.canJump = false; break;
					case player1.controls.FIRE:
						player1.firing = true;
						break;
					case player1.controls.DASH:
						var time = performance.now();
						if (time - player1.canDash >= 700) {
							player1.velocity.x += Math.sign(player1.velocity.x) * dashSpeed;
							player1.canDash = time;
						}
						break;
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
							player2.velocity.y += 350;
							sfx['jump'].play();
							player2.airborne = true;
						}
						player2.canJump = false; break;
					case player2.controls.FIRE:
						player2.firing = true;
						break;							
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
					player1.moving.left = false;  break;
				case player1.controls.R:
					player1.moving.right = false; break;
				case player1.controls.FIRE:
					player1.firing = false;
				case player2.controls.L:
					player2.moving.left = false;  break;
				case player2.controls.R:
					player2.moving.right = false; break;
				case player2.controls.FIRE:
					player2.firing = false;
			}
		})
		
		//	initiate
		prevTime = performance.now();
		renderer.render(scene, camera);
		animate();
	}
	
	function updatePlayer(player, time) {
		var g = 980;
		var deceleration = 10;
		var acceleration = 1500;
		var delta = (time - prevTime)/1000;
		
		player.velocity.x -= player.velocity.x * deceleration * delta;
		player.velocity.y -= g * delta;
		
		player.RAY.ray.origin.copy(player.position);
		
		if (player.RAY.intersectObjects(platforms).length > 0) {
			player.velocity.y = Math.max(player.velocity.y, 0);
			if (player.velocity.y === 0) {
				player.canJump = true;
				if (player.airborne) {
				sfx['land'].play();
				player.airborne = false;
			}
			}
		}
		
		if (player.moving.left) player.velocity.x -= acceleration * delta;
		if (player.moving.right) player.velocity.x += acceleration * delta;
		if (Math.abs(player.velocity.x) >= dashSpeed) player.velocity.x = Math.sign(player.velocity.x) * dashSpeed;
		
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
			else if (busters[i].obj.position.x > rightBound || busters[i].obj.position.x < leftBound) {
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
		var material = new THREE.MeshBasicMaterial({color: new THREE.Color(player.coreColor)});
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