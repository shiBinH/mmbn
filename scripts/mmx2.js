(function() {
	
	var camera, scene, renderer;
	var floor, leftBound, rightBound;
	var player1, player2;
	var clock;
	var keysMap;
	
	init();
	animate();
	
	function init() {
		var geometry, material, mesh,
				gridhelper, axis;
		//	player1 = new Player(); player2 = new Player();
		floor = 0; leftBound = -200; rightBound = 200;
		clock = new THREE.Clock();
		keysMap = {};
		
		scene = new THREE.Scene();
		scene.background = new THREE.TextureLoader().load('images/background-x2.jpg');
		var directional = new THREE.DirectionalLight('white', 1);
		directional.position.set(0, 100, 20)
		scene.add(directional)
		
		camera = new THREE.OrthographicCamera(-220, 220, 180, -180, 30, 500)
		//camera= new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 30, 500)
		camera.position.set(0, 100, 200)
		camera.lookAt(new THREE.Vector3(0, 50, 0))
		
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		
		gridHelper = new THREE.GridHelper(400, 20, new THREE.Color('yellow'));
		gridHelper.rotateX(Math.PI/2)
		//scene.add(gridHelper)
		
		geometry = new THREE.BoxGeometry(400, 100, 400);
		material = new THREE.MeshPhongMaterial({map: new THREE.TextureLoader().load('images/metal.jpg'), side:THREE.DoubleSide})
		mesh = new THREE.Mesh(geometry, material)
		mesh.position.y -= 100/2;
		scene.add(mesh)
		
		geometry = new THREE.Geometry();
		geometry.vertices.push(new THREE.Vector3(-100, 50, 0), 
													 new THREE.Vector3(100, 50, 0)
													);
		material = new THREE.LineBasicMaterial({color: new THREE.Color('green')});
		scene.add(new THREE.Line(geometry, material))
		
		player1 = new Player({
			jump: 90, left: 70, right: 72, 
		})
		scene.add(player1)
			
		document.addEventListener('keydown', function(e) {
			var key = e.keyCode;
			keysMap[key] = true;
			
			if (key === 76) {
				for (var prop in player1.bones) console.log(player1.bones[prop].quaternion)
			}
			if (key === 75) for(var prop in player1.bones) console.log(player1.bones[prop].position)
			var value = document.getElementById('bone').value;
			if (!player1.bones[value]) return;
			if (key === 81) player1.bones[value].rotateX(0.05 * (keysMap[189]?-1:1))
			if (key === 87) player1.bones[value].rotateY(0.05 * (keysMap[189]?-1:1))
			if (key === 69) player1.bones[value].rotateZ(0.05 * (keysMap[189]?-1:1))
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
		var Vx = 120;
		player.velocity.y -= g * delta;

		if (keysMap[player.user.controls.jump]) {
			if (!player.user.airborne) {player.velocity.y += 350; player.user.airborne = true;}
		} else player.velocity.y = Math.min(0, player.velocity.y);
		if (keysMap[player.user.controls.left]) {
			player.user.left = true;
			player.velocity.x = -Vx;
			if (player.animation) player.animation.run_left();
		}
		if (keysMap[player.user.controls.right]) {
			player.velocity.x = Vx;
			player.user.left = false;
			if (player.animation) player.animation.run_right();
		}
		if (!keysMap[player.user.controls.left] && !keysMap[player.user.controls.right]) {
			player.velocity.x = 0
			if (player.animation) {
				if (player.user.left) player.animation.stop_left();
				else player.animation.stop_right();
			}
		}

		
		player.position.x += player.velocity.x * delta;
		player.position.y += player.velocity.y * delta;
		
		if (player.position.x > rightBound || player.position.x < leftBound) {
			player.position.x = player.position.x<0 ? leftBound : rightBound;
		}
		if (player.position.y - (34) < floor) {	//	-31.568 1.329
			player.user.airborne = false;
			player.position.y = 34;
			player.velocity.y = 0;
		}
		
		if (player.animation) player.animation.update(delta);
	}
	
	function animate() {
		var delta = clock.getDelta();
		updatePlayer(player1, delta);
		//console.log(player1.bones.body.rotation)
		
		renderer.render(scene, camera)
		requestAnimationFrame(animate)
	}
	
})()