(function(){
	var camera, scene, renderer;
	var mesh;
	var floor;
	var rotateVal = 0;
	var moveUp, moveDown, moveLeft, moveRight;
	var prevTime;
	
	init();
	animate();

	
	function init() {
		
		
		//	camera
		camera = new THREE.PerspectiveCamera( 70, window.innerWidth/window.innerHeight, 1, 2000 );
		camera.position.set( 0, -400, 450);
		camera.lookAt( new THREE.Vector3(0, 120, 0) );
		
		//	create scene
		scene = new THREE.Scene();
		scene.background = new THREE.TextureLoader().load('images/screw-logo3.jpg');
		
		var planeGeo = new THREE.PlaneGeometry( 900, 450 );
		var geometry = new THREE.BoxBufferGeometry( 900, 450, 25 );
		var texture = new THREE.TextureLoader().load( 'images/battlefield2-top.jpg' );
		var material = new THREE.MeshBasicMaterial( {map: texture} );
		
		//	create floor
		floor = new THREE.Mesh( geometry, material );
		floor.position.z = -12.5;
		scene.add( floor );
		
		//	target
		geometry = new THREE.BoxBufferGeometry( 100, 100, 150);
		material = new THREE.MeshBasicMaterial({color: 0x42f44b});
		mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(375, 0, 75);
		scene.add( mesh );
		
		//	temp box
		geometry = new THREE.BoxBufferGeometry( 100, 100, 150);
		material = new THREE.MeshBasicMaterial({color: 0x42cef4});
		mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(-225, 0, 75);
		scene.add( mesh );
		
		//	renderer
		renderer = new THREE.WebGLRenderer();
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );
		
		prevTime = performance.now();
		window.addEventListener( 'resize', onWindowResize, false );
		
	}
	
	$(window).on('keydown', function(e) {
		var key = String.fromCharCode(e.keyCode);
		switch(key) {
			case 'G':
				moveLeft = true;
				break;
			case 'Y':
				moveUp = true;
				break;
			case 'J':
				moveRight = true;
				break;
			case 'H':
				moveDown = true;
				break;
		}
	})

	$(window).on('keyup', function(e) {
		var key = String.fromCharCode(e.keyCode);
		switch(key) {
			case 'G':
				moveLeft = false;
				break;
			case 'Y':
				moveUp = false;
				break;
			case 'J':
				moveRight = false;
				break;
			case 'H':
				moveDown = false;
				break;
		}
	})

	
	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}
	
	function animate() {
		
		var time = performance.now();
		if (time - prevTime >= 160) {
			if (moveLeft && mesh.position.x>-375) {mesh.translateX(-150);prevTime = time;}
			else if (moveUp && mesh.position.y<150) {mesh.translateY(150); prevTime = time;}
			else if (moveRight && mesh.position.x<-75) {mesh.translateX(150); prevTime = time;}
			else if (moveDown && mesh.position.y>-150) {mesh.translateY(-150); prevTime = time;}

		}
		//	swivel the plane
		/*
		if (rotateVal > 2 * Math.PI) rotateVal = 0;
		floor.rotation.x += Math.sign(Math.sin(rotateVal))*.00025;
		rotateVal += .03;
		*/
		
		renderer.render( scene, camera );
		requestAnimationFrame( animate );
	}
	
})();