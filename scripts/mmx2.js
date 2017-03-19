(function() {
	var TITLE = 'MEGAMAN EX';
	
	var titlescreen,
			SINGLE,
			MULTI;
	
	var camera, scene, renderer;
	var clock;
	var players;
	var socket;
	var temp;
	var user;
	var clientKeys;
	var chat_timer;
	var settingControls;
	var respawn_delay;
	var pathname;
	var color_changed;
	var colorN;
	var Level;
	var level_loaded;
	
	
	startup();
	window.setInterval(update, 1000/60);
	//update();
	//init_single()
	//single_game_update();
	
	function startup() {
		titlescreen = true;
		var geometry, material, mesh;
		scene = new THREE.Scene();
		scene.bounds = {left: -1000, right: 1000, bottom: -500};
		scene.background = new THREE.TextureLoader().load('images/title.jpg');
		
		var hemisphere = new THREE.HemisphereLight('white', 1);
		hemisphere.position.set(0, 200, 0)
		scene.add(hemisphere)
		var directional = new THREE.DirectionalLight('white', 1);
		directional.position.set(0, 0, 100)
		//scene.add(directional)
		var point = new THREE.PointLight('white', 10, 70);
		
		//camera = new THREE.OrthographicCamera(-100, 100, 80, -80, 30, 500)
		camera= new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 1, 2000)
		camera.position.set(0, 0, 100)
		
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		
		
		
		var fontLoader = new THREE.FontLoader();
		fontLoader.load(
			'../fonts/helvetiker_bold.typeface.json',
			function(response) {
				var textGeometry = new THREE.TextGeometry(TITLE, {font: response, size: 10, height: 2});
				textGeometry.computeBoundingSphere();
				var mesh = new THREE.Mesh(textGeometry, new THREE.MeshLambertMaterial({color: new THREE.Color(0x4d88ff)}))
				mesh.position.set(-mesh.geometry.boundingSphere.radius, 20, 0);
				scene.add(mesh)
				point.position.set(mesh.geometry.boundingSphere.radius+10, 60, 50);
				scene.add(point)
			}
		);
		fontLoader.load(
			'../fonts/optimer_regular.typeface.json',
			function(response) {
				var textGeometry = new THREE.TextGeometry('Single', {font: response, size: 6, height: 1});
				textGeometry.computeBoundingSphere();
				var mesh = new THREE.Mesh(textGeometry, new THREE.MeshLambertMaterial({color: new THREE.Color(0xff3333)}))
				mesh.name = 'title_single';
				mesh.selected = true;
				mesh.position.set(-35, -10, 0);
				scene.add(mesh)
				var textGeometry = new THREE.TextGeometry('Multiplayer', {font: response, size: 6, height: 1});
				textGeometry.computeBoundingSphere();
				var mesh = new THREE.Mesh(textGeometry, new THREE.MeshLambertMaterial({color: new THREE.Color('white')}))
				mesh.name = 'title_multi';
				mesh.position.set(-35, -23, 0);
				scene.add(mesh)
			}
		)
		
		$(document).on('keydown', function(e) {
			var key = e.keyCode;
			if (titlescreen) {
				if (key === 38) {
					var single = scene.getObjectByName('title_single');
					single.material.color = new THREE.Color(0xff3333); single.selected = true;
					var multi = scene.getObjectByName('title_multi');
					multi.material.color = new THREE.Color('white'); multi.selected = false;
				} else if (key === 40) {
					var single = scene.getObjectByName('title_single');
					single.material.color = new THREE.Color('white'); single.selected = false;
					var multi = scene.getObjectByName('title_multi');
					multi.material.color = new THREE.Color(0xff3333); multi.selected = true;
				}
				if (key === 13) {
					
					if (scene.getObjectByName('title_multi').selected) {
						titlescreen = false;
						$('#screen_changer').slideDown(1000).delay(1000).queue(function(){
							init_multi();
							MULTI = true;
						}).dequeue()
					} else {
						titlescreen = false;
						$('#screen_changer').slideDown(1000).queue(function(){
							console.log('single player')
							init_single();
							SINGLE = true;
							return;
						});
					}
					while (scene.children.length >1) {
						scene.remove(scene.children[scene.children.length-1])
					}
				}
			}
		})
		
		$('#screen_changer')
			.css('width', window.innerWidth)
			.css('height', window.innerHeight);
		
		renderer.render(scene, camera)
	}
	
	function update() {
		if (titlescreen) {
			renderer.render(scene, camera);
		}
		else if (SINGLE) single_game_update();
		else if (MULTI) multi_game_update();
		//requestAnimationFrame(update);
	}
	
	function init_single() {
		players = [];
		clock = new THREE.Clock();
		clientKeys = {};
		temp = 0;
		
		document.getElementById("audio-background").volume = 0.3
		camera.position.z = 300;
		var grid = new THREE.GridHelper(20000, 20000/100, new THREE.Color('yellow'))
		grid.rotation.x = Math.PI/2
		scene.background = new THREE.Color(0x333333)
		scene.add(grid)
		
		$(document).on('keydown', function(e) {
			var key = e.keyCode;
			if (settingControls) {
				var actions = ['RIGHT', 'FIRE', 'JUMP', 'DASH'];
				if (key === 13 || key === 82) return;
				if (key === 27) $display.click();
				for (var keycode in keys) if (keys[keycode]===key) return;
				document.getElementById('key').innerText = actions[keys.length];
				keys.push(key);
				if (keys.length === 5) {
					settingControls = false;
					$('#set_msg').hide();
					
					var newPlayer = new X.Player('', {
						enabled: false,
						left: keys[0], right: keys[1],
						fire: keys[2], jump: keys[3], dash: keys[4]
					});
					user = newPlayer;
					user.keysMap = clientKeys;
					
					players.push(user)
					Level = new LEVEL[0];
					level_loaded = false;
					
					
				}
				return;
			}
			
			clientKeys[key] = true;
			
			if (key === 82 && user && user.controls.enabled) {
				user.game.health.mesh.visible = true;
				user.game.health.HP = user.game.health.full;
				user.dead = null;
				user.position.set(3600, 950, 0)
			}
		}).on('keyup', function(e) {
			var key = e.keyCode;
			clientKeys[key] = false;
		}).on('wheel', function(e) {
			var dy = e.originalEvent.deltaY;
			camera.position.z += (dy/5)
		})
		
		var $setup = $('#setup');
		var $display = $('#set_display');
		var $set_msg = $('#set_msg');
		$setup.on('click', '#set_controls', function(e) {
			keys = [];
			settingControls = true;

			$set_msg.css('top', window.innerHeight/2-150/2).css('left', window.innerWidth/2-300/2);
			$set_msg.css('z-index', 110).show();
			document.getElementById('key').innerText = 'LEFT';
		})
		
		$setup.find('#set_controls').click()
		
		
	}
	
	function single_game_update() {
		var delta = clock.getDelta();
		var time = clock.getElapsedTime();
		
		if (!(Level && Level.loaded)) return
		if (Level && Level.loaded && level_loaded===false) {
			
			level_loaded = true;
			for (var obj in Level.meshes) scene.add(Level.meshes[obj]);
			scene.bounds = Level.bounds;
			//user.game.health.mesh.position.y += 150; scene.add(user.game.health.mesh);
			$('#screen_changer').dequeue().slideUp(1000);
		}
		
		if (user) updatePlayer(user, delta);
		
		var data = {window: window, camera: camera, delta:Math.min(delta, 1/60), scene:scene, player: user, time: time};
		for (var ob=0 ; ob<scene.children.length ; ob++) if (scene.children[ob].update_game) {
			if (scene.children[ob].update_game(data) === -1) {
				scene.remove(scene.children[ob]);
			}
		}
		if (level_loaded) Level.update_game(data)
		renderer.render(scene, camera);
	}
	
	function init_multi() {
		var keys;
		var geometry, material, mesh,
				gridhelper, axis;
		clock = new THREE.Clock();
		clientKeys = {};
		players = {};
		temp = 0;
		respawn_delay = null;
		pathname = (window.location.href.indexOf('?room=')!==-1?window.location.href.substring(window.location.href.indexOf('room=')+5): '');
		color_changed = false;
		
		scene.background = new THREE.TextureLoader().load('images/background-x2.jpg');
		camera.position.set(0, 0, 30)
		/*
		scene = new THREE.Scene();
		scene.bounds = {left: -1000, right: 1000};
		scene.background = new THREE.TextureLoader().load('images/background-x2.jpg');
		var hemisphere = new THREE.HemisphereLight('white', 1);
		hemisphere.position.set(0, 200, 0)
		scene.add(hemisphere)
		*/
		
		var directional = new THREE.DirectionalLight('white', 1);
		directional.position.set(0, 100, 20)
		scene.add(directional)
		
		/*
		//camera = new THREE.OrthographicCamera(-100, 100, 80, -80, 30, 500)
		camera= new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 1, 1000)
		
		
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		*/
		
		
		geometry = new THREE.BoxGeometry(50, 40, 100);
		material = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('images/metal.jpg'), side:THREE.DoubleSide})
		mesh = new THREE.Mesh(geometry, material)
		mesh.purpose = 'surface';
		mesh.position.set(-170, -60, 0);
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(50, 40, 100);
		mesh = new THREE.Mesh(geometry, material)
		mesh.purpose = 'surface';
		mesh.position.set(170, -60, 0);
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(30, 40, 80);
		mesh = new THREE.Mesh(geometry, material)
		mesh.purpose = 'surface';
		mesh.position.set(-150, 300, 0);
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(30, 40, 80);
		mesh = new THREE.Mesh(geometry, material)
		mesh.purpose = 'surface';
		mesh.position.set(150, 300, 0);
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(350, 40, 100);
		mesh = new THREE.Mesh(geometry, material)
		mesh.position.y = -170;
		mesh.purpose = 'surface';
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(60, 90, 100);
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(0, 160, 0);
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(500, 600, 100);
		mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(-520, 0, 0)
		mesh.purpose = 'surface'
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		mesh = mesh.clone(true)
		mesh.position.x *= -1;
		mesh.purpose = 'surface'
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(50, 40, 80);
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(-255, 85, 0);
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		mesh = mesh.clone(true);
		mesh.position.x *= -1;
		mesh.purpose = 'surface';
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(40, 35, 80);
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(0, 0, 0);
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(1200, 300, 100);
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(0, 450, 0);
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		geometry = new THREE.BoxGeometry(50, 80, 80);
		mesh = new THREE.Mesh(geometry, material);
		mesh.purpose = 'surface';
		mesh.position.set(-100, -340, 0);
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		mesh = mesh.clone(true);
		mesh.purpose = 'surface';
		mesh.position.x *= -1;
		scene.add(mesh); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		
		var $setup = $('#setup');
		var $display = $('#set_display');
		var $set_msg = $('#set_msg');
		var $set_controls = $('#set_controls');
		var $chatbox = $('#chatbox');
		var $chatinput = $('#chatinput');
		var $join_game = $('#join_game');
		var $connect = $('#connect');
		var $announce_center = $('#announce_center');
		var $scoreboard = $('#scoreboard');
		var $infobtn = $('#info-btn')
		var $info = $('#info')
		

		divSetup();
		function divSetup() {
			$setup.css('display', 'inline');
			$announce_center.css('width', window.innerWidth).css('top', window.innerHeight/2 - 200/2);
			
			$scoreboard.css('width', window.innerWidth/2).css('height', window.innerHeight/2);
			$scoreboard.css('left', window.innerWidth/4).css('top', window.innerHeight/4);
			
			$display.on('click', function(e) {
				this.style.display = 'none';
				$set_msg.css('display', 'none');
				$set_controls.css('display', 'inline');
				settingControls = false;
				if (keys.length === 5) $join_game.css('display', 'inline');
				else $join_game.css('display', 'none');

			})
			$setup.css('top',window.innerHeight/2 - 300/2)
			$setup.css('left', (window.innerWidth/2 - 300/2))
			$set_msg.css('top', (window.innerHeight/2 - 150/2))
			$set_msg.css('left', (window.innerWidth/2 - 300/2))
			$display.css('display','none')
			$set_controls.on('click', function(e) {
				$display.focus();
				keys = [];
				e.target.style.display = 'none';
				settingControls = true;

				$display.css('width',window.innerWidth);
				$display.css('height',window.innerHeight)
				$display.css('top', 0); $display.css('left', 0);
				$display.css('display', 'inline');
				$set_msg.css('display', 'inline');
				document.getElementById('key').innerText = 'LEFT';
			});
			$setup.on('click', function(e) {
				if (e.target.id !== 'join_game' || !this.name.value) return;
				var newPlayer = new X.Player(this.name.value, {
					enabled: true,
					left: keys[0], right: keys[1],
					fire: keys[2], jump: keys[3], dash: keys[4]
				});
				newPlayer.position.set(0, 55, 0);
				scene.add(newPlayer);
				newPlayer.name_Group.position.y += 150;scene.add(newPlayer.name_Group);
				user = newPlayer;
				newPlayer.game.health.mesh.position.y += 150; scene.add(newPlayer.game.health.mesh);
				$set_msg.css('display', 'none');
				this.style.display =  'none';
				$display.css('display', 'none');
				if (!socket) $connect.css('display','block');
				$connect.find('button').click()
			})	
			$connect.css('top', (window.innerHeight/2 - 100/2));
			$connect.css('left',(window.innerWidth/2 - 300/2));
			$connect.on('click', function(e) {
				if (e.target.type !== 'button') return;
				this.style.display = 'none';
				//	var roomName = this.room.value + '';
				socket = io();
				socket.on('connect', function(msg){
					if (!pathname) history.pushState(null, null, '/?room=' + socket.id);
					players[socket.id] = user;
					user.socket = socket.id;
					socket.emit('new_player', {room: pathname||socket.id, player: socket.id, name: user.name, controls: user.controls});
					var $newplayer = $('<tr>', {id: socket.id});
					$newplayer.append('<th>'+user.name+'</th>').append('<td data-purpose="current">'+0+'</td>')/*.append('<td data-purpose="total">'+0+'</td>')*/.append('<td data-purpose="wins">'+0+'</td>');
					$newplayer.find('th:first').css('color', 'green');
					$scoreboard.find('tbody').append($newplayer);
					$infobtn.show();
				});
				socket.on('announcement', function(data) {
					console.log(data);
				});
				socket.on('add_player', function(data) {
					if (players[data.player]) return;
					players[data.player] = new X.Player(data.name, data.controls, data.color);
					players[data.player].position.set(0, 50, 0);
					players[data.player].socket = data.player;
					scene.add(players[data.player]);
					scene.add(players[data.player].game.health.mesh)
					scene.add(players[data.player].name_Group);
					var $newplayer = $('<tr>', {id: data.player});
					$newplayer.append('<th>'+data.name+'</th>').append('<td data-purpose="current">'+data.score.current+'</td>')/*.append('<td data-purpose="total">'+data.score.total+'</td>')*/.append('<td data-purpose="wins">'+data.score.wins+'</td>');
					$scoreboard.find('tbody').append($newplayer);
				});
				socket.on('update_user', function(data) {
					players[data.player].keysMap = data.keysMap;
					if (data.player === socket.id) return;
					if (!respawn_delay) players[data.player].game.health.next = data.hp;
					players[data.player].position.set(data.position.x, data.position.y, data.position.z);
				});
				socket.on('player_disconnect', function(id) {
					var $msg = $('<span>');
					$msg.append(players[id].name + ' has disconnected.').css('color', 'red');
					$chatinput.before($msg);
					$chatbox.css('display', 'inline');
					$chatbox.scrollTop(10000);
					chat_timer = clock.getElapsedTime();
					if ($chatbox.children.length > 11) $chatbox.remove($chatbox.children(':first'));
					scene.remove(players[id]); scene.remove(players[id].game.health.mesh); scene.remove(players[id].name_Group)
					$scoreboard.find('#'+id).remove();
					delete players[id];
				});
				socket.on('chat_update', function(msg) {
					var newMsg = document.createElement('span');
					newMsg.appendChild(document.createTextNode(msg));
					$chatinput.before(newMsg);
					$chatbox.css('display', 'inline');
					$chatbox.scrollTop(10000);
					chat_timer = clock.getElapsedTime();
					if ($chatbox.children.length > 11) $chatbox.remove($chatbox.children(':first'));
				});
				socket.on('scoreboard_update', function(data) {
					$scoreboard.find('#'+data.player).find('[data-purpose="current"]').text(data.scores.current);
				});
				socket.on('victory', function(data) {
					$scoreboard.find('#'+data.player).find('[data-purpose="wins"]').text(data.scores.wins);
					$scoreboard.find('[data-purpose="current"]').text(0);
					var $h2 = $('<h2>');
					$h2.text(players[data.player].name + ' WINS!')
					$announce_center.empty();
					$announce_center.append($h2);
					$announce_center.slideDown(250).delay(3000).fadeOut(3000).queue(function(){
						socket.emit('reset_round');
					}).dequeue()
				});
				socket.on('new_round', function() {
					$scoreboard.find('[data-purpose="current"]').text(0);
					user.game.dmg_from = null;
					respawn_delay = clock.getElapsedTime();
					for (plyr in players) {
						players[plyr].game.dmg_from = null;
						players[plyr].game.health.mesh.visible = true;
						players[plyr].game.health.next = players[plyr].game.health.full;
						players[plyr].game.health.HP = players[plyr].game.health.full;//scene.add(players[plyr].game.health.mesh);
						players[plyr].dead = null;
						players[plyr].velocity.set(0, 0, 0)
						
					}
					user.position.set(240-Math.random()*480, 270, 0);
				})
				socket.on('color_change', function(data) {		
					colorN = data.color;
				})
				$info.css('left', window.innerWidth-300);
				$infobtn.css('left', window.innerWidth-20);
				$infobtn.mouseover(function(e){
					$info.show();
				})
				$info.on('mouseout', function(e) {
					$info.hide();
				})
			})
		}

		
		document.addEventListener('keydown', function(e) {
			var key = e.keyCode;

			if (settingControls) {
				var actions = ['RIGHT', 'FIRE', 'JUMP', 'DASH'];
				if (key === 13 || key === 82) return;
				if (key === 27) $display.click();
				for (var keycode in keys) if (keys[keycode]===key) return;
				document.getElementById('key').innerText = actions[keys.length];
				keys.push(key);
				if (keys.length === 5) {
					settingControls = false;
					$display.css('display', 'none');
					set_msg.style.display = 'none';
					$set_controls.css('display', 'inline');
					$join_game.css('display','inline');
				} else $join_game.css('display', 'none');
				return;
			}
			if (user && user.controls.enabled) clientKeys[key] = true;
			
			if (key === 9 && socket) {
				e.preventDefault();
				$scoreboard.show();
			}
			/*
			if (key === 82 && user && user.controls.enabled) {
				if (user && user.game.health.HP<=0) scene.add(user);
				user.game.health.mesh.visible = true;
				user.game.health.HP = user.game.health.full;
				user.dead = null;
				user.position.set(240*Math.sign(1-2*Math.random()), 220, 0)
			}*/
			if (key === 27 && $chatinput.css('display') !== 'none') $chatinput.css('display', 'none');
			if (key === 13 && socket) {
				if ($chatinput.css('display') === 'none') {
					$chatbox.css('display', 'inline');
					$chatinput.css('display', 'inline');
					$chatinput.focus();
					chat_timer = null;
					if (user) user.controls.enabled = false;
				} else {
					var msg = $chatinput.val() + '';
					if (msg.length > 0) {
						msg = user.name + ': ' + msg;
						socket.emit("chat_msg", msg);
					}
					chat_timer = clock.getElapsedTime();
					$chatinput.val('');
					$chatinput.css('display', 'none');
				}
			}
			/*

			if (key === 39) player1.bones.body.position.x += 1;
			if (key === 37) player1.bones.body.position.x += -1;


			if (key === 76) {
				for (var prop in user.bones) console.log(user.bones[prop].quaternion)
			}
			if (key === 67) {
				user.animation.j1();
			}
			if (key === 65) user.rotation.y = (user.rotation.y<0? 0 : -Math.PI/2);
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
			user.bones[bone]['rotate'+angle](0.1* (clientKeys[189]?-1:1));
			//player1.bones[bone].rotation[angle.toLowerCase()] *= -1
		})
		
		document.addEventListener('keyup', function(e) {
			var key = e.keyCode;
			clientKeys[key] = false;
			
			if (key === 9) $scoreboard.hide();
		})
		$chatinput.on('blur', function(e) {
			if (user) user.controls.enabled = true;
			chat_timer = clock.getElapsedTime();
			var chatinput = document.getElementById('chatinput');
			$chatinput.val('');
			$chatinput.css('display', 'none');
		})
		document.addEventListener('resize', function() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight );
		})
		
		chat_timer = null;
		document.getElementById("audio-background").volume = 0.3
		renderer.render(scene, camera)
		var $screen_changer = $('#screen_changer');
		if ($screen_changer.css('display') === 'block') $screen_changer.slideUp(1000);
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
		player.bounds.botRight.ray.origin.y -= 26;
		player.bounds.botLeft.ray.origin.y -= 26;
		player.bounds.rightFoot.ray.origin.x += 7; player.bounds.rightFoot.ray.origin.y += 0;
		player.bounds.leftFoot.ray.origin.x += -7; player.bounds.leftFoot.ray.origin.y += 0;
		if (player.game.dashing && !isAirborne) {
			player.bounds.rightUp.ray.origin.y -= 6;
			player.bounds.leftUp.ray.origin.y -= 6;
		}

		if (player.controls.enabled && keysMap[player.controls.fire]) {
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
		} else if(player.controls.enabled) {
			if (player.game.fire.timer !== null) {
				if (player.animation) player.animation.fire()
				if (time-player.game.fire.timer>2.5) {
					if (!player.charge2) {
						player.charge2 = new X.Weapon.Charge2(player);
						scene.add(player.charge2)
					}
					player.charge2.active = true;
					player.charge2.sfx.fire.play();
				}
				else if (time - player.game.fire.timer >1.25) {
					if (!player.charge1) {
						player.charge1 = new X.Weapon.Charge1(player)
						scene.add(player.charge1);
					}
					player.charge1.active = true;
					player.charge1.sfx.fire.play();
				}
				else 	{
					var buster = new X.Weapon.Buster(player);
					if (buster.purpose === 'projectile') {
						scene.add(buster);
						buster.sfx['fire'].pause()
						buster.sfx['fire'].currentTime = 0;
						buster.sfx['fire'].play()
					}
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

		if (player.controls.enabled && keysMap[player.controls.left]) {
			if (!player.game.left && (player.game.dashing||player.game.tap_dashing) && !player.game.dashJ) {player.game.tap_dashing = false;player.game.dashing = false;}
			player.game.left = true;
			player.game.tap.R.prev = 0;
			if (player.game.tap.L.check) {
				if (time-player.game.tap.L.prev<.2 && !isAirborne) {player.game.tap_dashing = true; player.game.dashing = true;}
				player.game.tap.L.prev = time;
			}
			player.game.tap.L.check = false;
			if (!player.game.dashing && time-player.game.wJump_timer>.16) player.velocity.x = -Vx//Math.max(player.velocity.x-Vx, -Vx)
			if (player.animation && !isAirborne && !player.game.airborne) {
				if (player.game.dashing || player.game.tap_dashing) player.animation.dash();
				else player.animation.run();
			}
			
		} 
		else if (player.controls.enabled && keysMap[player.controls.right]) {
			if (player.game.left && (player.game.dashing||player.game.tap_dashing) && !player.game.dashJ) {player.game.tap_dashing = false;player.game.dashing = false;}
			player.game.left = false;
			player.game.tap.L.prev = 0;
			if (player.game.tap.R.check) {
				if (time-player.game.tap.R.prev<.2 && !isAirborne) {player.game.tap_dashing = true; player.game.dashing = true;}
				player.game.tap.R.prev = time;
			}
			player.game.tap.R.check = false;
			if (!player.game.dashing && time-player.game.wJump_timer>.16) player.velocity.x = Vx//Math.min(player.velocity.x+Vx, Vx)
			if (player.animation && !isAirborne && !player.game.airborne) {
				if (player.game.dashing || player.game.tap_dashing) player.animation.dash();
				else player.animation.run();
			}
		}
		
		if (player.controls.enabled && (player.game.tap_dashing ||keysMap[player.controls.dash]) && player.game.can_dash) {
			player.game.can_dash = false
			if (!isAirborne) {
				player.animation.dash();
				player.game.dashing = true;
				player.sfx['dash'].play()
				player.game.dash_prev = time;
			}
		}
		if (player.game.dashing || player.game.tap_dashing) {
			if (player.game.dashJ || time-player.game.dash_prev<0.6) {
				if (time-player.game.wJump_timer>.16) player.velocity.x = _dashSpd * (player.game.left?-1:1);
			}
			else {
				player.game.tap_dashing = false;
				player.game.dashing = false;
				player.game.dash_prev = time;
			}
		}
		if (!player.game.dashJ && !keysMap[player.controls.dash] && !player.game.tap_dashing) {
			player.game.dashing = false;
			if (!player.game.tap_dashing) player.game.can_dash = true;
		}

		
		if (player.controls.enabled && keysMap[player.controls.jump]) {
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
		
		if (!keysMap[player.controls.left]) player.game.tap.L.check = true;
		if (!keysMap[player.controls.right]) player.game.tap.R.check = true;
		if (!keysMap[player.controls.left] && !keysMap[player.controls.right]) {
			if ((player.game.dashJ || !player.game.dashing || player.game.tap_dashing) && time-player.game.wJump_timer>.16) {
				player.game.tap_dashing = false;
				player.velocity.x = 0;
			}
			if (player.animation && !player.game.isAirborne(scene)) {
				if (keysMap[player.controls.dash] && player.game.can_dash) player.animation.dash();
				else if (!player.game.dashing && player.game.left) player.animation.stop_left();
				else if (!player.game.dashing && !player.game.left) player.animation.stop_right();
			}
		}

		if (!player.controls.enabled) {
			player.velocity.x = 0;
			player.velocity.y = Math.min(player.velocity.y, 0)
			if (player.animation) {
				if (player.game.airborne || isAirborne) {
					if (player.velocity.y+g*delta>=0)player.animation.fall();
				}
				else {
					if (player.game.left) player.animation.stop_left();
					else player.animation.stop_right();
				}
			}
		}
		var intersections = [];
		intersections.push(player.bounds.botRight.intersectObjects((Level&&Level.enemies)?scene.children.concat(Level.enemies):scene.children));
		for (var obj in intersections[0]) {
			var intersected = intersections[0][obj]
			if (intersected.object.purpose === 'surface') {
				player.velocity.x = Math.min(0, player.velocity.x);
				player.position.x = intersected.point.x - player.bounds.botRight.far;
				player.game.dashJ = false;
				player.game.dashing = false;
				player.game.tap_dashing = false;	
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
			} else if (intersected.object.active && intersected.object.purpose === 'enemy' && time-player.game.health.invincible>=1) {
				var enemy = intersected.object;
				player.ondmg(enemy); player.sfx.hit.play()/*var dir = (player.game.left?1:-1)//(enemy.getWorldPosition().x>player.position.x?-1:1);
				if (enemy.DPS>=player.game.flinch.min) {
					player.action.flinch(time, dir, enemy.DPS);
					// player.game.health.invincible = time;
				}
				player.game.health.HP -= enemy.DPS;
				player.game.health.mesh.material.color = new THREE.Color('red');
				player.game.health.prev = time;*/
			}
		}
		intersections.push(player.bounds.botLeft.intersectObjects((Level&&Level.enemies)?scene.children.concat(Level.enemies):scene.children))
		for (var obj in intersections[1]) {
			var intersected = intersections[1][obj]
			if (intersected.object.purpose === 'surface') {
				player.velocity.x = Math.max(0, player.velocity.x);
				player.position.x = intersected.point.x + player.bounds.botLeft.far;
				player.game.dashJ = false;
				player.game.dashing = false;
				player.game.tap_dashing = false;
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
			}else if (intersected.object.active && intersected.object.purpose === 'enemy' && time-player.game.health.invincible>=1) {
				var enemy = intersected.object;
				player.ondmg(enemy); player.sfx.hit.play()/*var dir = (player.game.left?1:-1)//(enemy.getWorldPosition().x>player.position.x?-1:1);
				if (enemy.DPS>=player.game.flinch.min) {
					player.action.flinch(time, dir, enemy.DPS);
					// player.game.health.invincible = time;
				}
				player.game.health.HP -= enemy.DPS;
				player.game.health.mesh.material.color = new THREE.Color('red');
				player.game.health.prev = time;*/
			}
		}
		intersections.push(player.bounds.midRight.intersectObjects((Level&&Level.enemies)?scene.children.concat(Level.enemies):scene.children))
		for (var obj in intersections[2]) {
			var intersected = intersections[2][obj]
			if (intersected.object.purpose === 'surface') {
				player.velocity.x = Math.min(0, player.velocity.x);
				player.position.x = intersected.point.x - player.bounds.midRight.far;
				player.game.dashJ = false;
				player.game.dashing = false;
				player.game.tap_dashing = false;
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
			} else if (intersected.object.active && intersected.object.purpose === 'enemy' && time-player.game.health.invincible>=1) {
				var enemy = intersected.object;
				player.ondmg(enemy); player.sfx.hit.play()/*var dir = (player.game.left?1:-1)//(enemy.getWorldPosition().x>player.position.x?-1:1);
				if (enemy.DPS>=player.game.flinch.min) {
					player.action.flinch(time, dir, enemy.DPS);
					// player.game.health.invincible = time;
				}
				player.game.health.HP -= enemy.DPS;
				player.game.health.mesh.material.color = new THREE.Color('red');
				player.game.health.prev = time;*/
			}
		}
		intersections.push(player.bounds.midLeft.intersectObjects((Level&&Level.enemies)?scene.children.concat(Level.enemies):scene.children))
		for (var obj in intersections[3]) {
			var intersected = intersections[3][obj]
			if (intersected.object.purpose === 'surface') {
				player.velocity.x = Math.max(0, player.velocity.x);
				player.position.x = intersected.point.x + player.bounds.midLeft.far;
				player.game.dashJ = false;
				player.game.dashing = false;
				player.game.tap_dashing = false;
				
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
			} else if (intersected.object.active && intersected.object.purpose === 'enemy' && time-player.game.health.invincible>=1) {
				var enemy = intersected.object;
				player.ondmg(enemy); player.sfx.hit.play()/*var dir = (player.game.left?1:-1)//(enemy.getWorldPosition().x>player.position.x?-1:1);
				if (enemy.DPS>=player.game.flinch.min) {
					player.action.flinch(time, dir, enemy.DPS);
					// player.game.health.invincible = time;
				}
				player.game.health.HP -= enemy.DPS;
				player.game.health.mesh.material.color = new THREE.Color('red');
				player.game.health.prev = time;*/
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
		if (player.controls.enabled && (player.game.can_wJump||player.game.onWall) && player.velocity.y<=0) {
			if (player.game.can_wJump&&player.game.can_jump && keysMap[player.controls.jump] && player.game.wJump_cast === null) player.game.wJump_cast = time;
			if (player.game.can_wJump && player.game.can_jump && player.game.wJump_cast && time-player.game.wJump_cast>0.0) {
				if (intersections[1].length>0 || intersections[3].length>0) player.game.left = true;
				else player.game.left = false;
				if (player.animation) player.animation.wall_jump()
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
				if (player.animation && time-player.game.latch_time-delta<.1) player.animation.slide();
				player.velocity.y = -100;
				if (isAirborne && time - player.game.latch_time > .12) 
					player.game.sliding = true;
			}
			else player.velocity.y -= g * delta
		}
		else player.velocity.y -= g * delta;
		player.velocity.y = Math.max(-450, player.velocity.y)
		
		
		intersections.push(player.bounds.rightFoot.intersectObjects((Level&&Level.enemies)?scene.children.concat(Level.enemies):scene.children))
		for (var obj in intersections[4]) {
			var intersected = intersections[4][obj];
			if (player.velocity.y<0 && intersections[4][obj].object.purpose === 'surface') {
				if (player.game.airborne) {
					player.sfx['land'].play();
					player.game.airborne = false;
					player.game.dashJ = false;
					player.game.dashing = false;
					player.game.tap_dashing = false;
				}
				player.position.y = player.bounds.rightFoot.y+intersections[4][obj].point.y;
				player.velocity.y = 0;
				flag = true;
				break;
			} else if (intersected.object.active && intersected.object.purpose === 'enemy' && time-player.game.health.invincible>=1) {
				var enemy = intersected.object;
				player.ondmg(enemy); player.sfx.hit.play()/*var dir = (player.game.left?1:-1)//(enemy.getWorldPosition().x>player.position.x?-1:1);
				if (enemy.DPS>=player.game.flinch.min) {
					player.action.flinch(time, dir, enemy.DPS);
					// player.game.health.invincible = time;
				}
				player.game.health.HP -= enemy.DPS;
				player.game.health.mesh.material.color = new THREE.Color('red');
				player.game.health.prev = time;*/
			}
		}
		intersections[5] = player.bounds.leftFoot.intersectObjects((Level&&Level.enemies)?scene.children.concat(Level.enemies):scene.children)
		for (var obj in intersections[5]) {
			var intersected = intersections[5][obj];
			if (player.velocity.y<0 && intersections[5][obj].object.purpose === 'surface') {
				if (player.game.airborne) {
					player.sfx['land'].play();
					player.game.airborne = false;
					player.game.dashJ = false;
					player.game.dashing = false;
					player.game.tap_dashing = false;
				} 
				player.position.y = player.bounds.leftFoot.y+intersections[5][obj].point.y;
				player.velocity.y = 0;
				break;
			} else if (intersected.object.active && intersected.object.purpose === 'enemy' && time-player.game.health.invincible>=1) {
				var enemy = intersected.object;
				player.ondmg(enemy); player.sfx.hit.play()/*var dir = (player.game.left?1:-1)//(enemy.getWorldPosition().x>player.position.x?-1:1);
				if (enemy.DPS>=player.game.flinch.min) {
					player.action.flinch(time, dir, enemy.DPS);
					// player.game.health.invincible = time;
				}
				player.game.health.HP -= enemy.DPS;
				player.game.health.mesh.material.color = new THREE.Color('red');
				player.game.health.prev = time;*/
			}
		}

		
		if (time-player.game.flinch.timer<.2) {
			player.velocity.x = player.game.flinch.vx;
			player.game.can_jump = false;
		}
		else player.game.flinch.status = false;
		if (time-player.game.flinch.timer<.05) player.velocity.y = player.game.flinch.vy
		else if (time-player.game.flinch.timer-delta<.05) player.velocity.y = 0;
	
		
		if (player === user) {
			var dx = player.velocity.x * delta;
			var dy = player.velocity.y * delta;
			if (Math.abs(dx)>Math.abs(player.velocity.x*1/60)) player.position.x += player.velocity.x * 1/60
			else player.position.x += dx;
			player.position.y += (Math.abs(dy)>Math.abs(player.velocity.y*1/60)?player.velocity.y*1/60:dy);
		}

		
		intersections = player.bounds.rightUp.intersectObjects((Level&&Level.enemies)?scene.children.concat(Level.enemies):scene.children);
		for (var obj in intersections) {
			var intersected = intersections[obj];
			if (player.velocity.y>0 && intersected.object.purpose === 'surface') {
				player.velocity.y = 0;
				player.velocity.x = 0;
				player.position.y = intersected.point.y - player.bounds.rightUp.far;
				break;
			} else if (intersected.object.active && intersected.object.purpose === 'enemy' && time-player.game.health.invincible>=1) {
				var enemy = intersected.object;
				//while (!enemy.health) enemy = enemy.parent;
				player.ondmg(enemy); player.sfx.hit.play()/*var dir = (player.game.left?1:-1)//(enemy.getWorldPosition().x>player.position.x?-1:1);
				if (enemy.DPS>=player.game.flinch.min) {
					player.action.flinch(time, dir, enemy.DPS);
					// player.game.health.invincible = time;
				}
				player.game.health.HP -= enemy.DPS;
				player.game.health.mesh.material.color = new THREE.Color('red');
				player.game.health.prev = time;*/
			}
		}
		intersections = player.bounds.leftUp.intersectObjects((Level&&Level.enemies)?scene.children.concat(Level.enemies):scene.children);
		for (var obj in intersections) {
			var intersected = intersections[obj];
			if (player.velocity.y>0 && intersected.object.purpose === 'surface') {
				player.velocity.y = 0;
				player.velocity.x = 0;
				player.position.y = intersected.point.y - player.bounds.leftUp.far;
				break;
			} else if (intersected.object.active && intersected.object.purpose === 'enemy' && time-player.game.health.invincible>=1) {
				var enemy = intersected.object;
				player.ondmg(enemy); player.sfx.hit.play()/*var dir = (player.game.left?1:-1)//(enemy.getWorldPosition().x>player.position.x?-1:1);
				if (enemy.DPS>=player.game.flinch.min) {
					player.action.flinch(time, dir, enemy.DPS);
					// player.game.health.invincible = time;
				}
				player.game.health.HP -= enemy.DPS;
				player.game.health.mesh.material.color = new THREE.Color('red');
				player.game.health.prev = time;*/
			}
		}
		

		
		if (!player.game.can_wJump && !player.game.onWall) {
			player.game.wJump_cast = null;
			if (player.velocity.y<0) player.game.airborne = true;
		}

		if (player.animation) player.animation.update(delta);

		
		var health = player.game.health;
		health.mesh.position.copy(player.position);
		if (player !== user) {
			health.HP = health.next;
			if (health.HP > 0) player.dead = null;
		}
		if (!player.dead) {
			if (player.position.y<scene.bounds.bottom || health.HP <= 0) {
				player.sfx['death'].play()
				player.game.fire.timer = null;
				player.charge.a.scale.set(1, 1, 1); player.charge.b.scale.set(1, 1, 1);
				player.position.set(scene.bounds.left-300, 0, 0);
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
		}
		health.mesh.position.y += 20;
		
		
		if (player.name_Group.children.length > 0) {
			player.name_Group.position.copy(player.position);
			player.name_Group.position.x -= player.name_Group.children[0].geometry.boundingSphere.radius;
			player.name_Group.position.y += 24;
			if (player !== user) player.name_Group.children[0].material.color = new THREE.Color('white');
		}
		
		for (var level in player.charge) {
			if (player.charge[level].type === 'Group') continue;
			player.charge[level].position.copy(player.bones.body.position)
			player.charge[level].position.y -= 3
			player.charge[level].material.uniforms.viewVector.value = new THREE.Vector3().subVectors( camera.position, player.charge[level].getWorldPosition() );
		}
	}
	
	function animate() {
		/*
		if (X.Weapon.Saber && user) {
			scene.add(X.Weapon.Saber);
			X.Weapon.Saber.position.y = 30;
			scene.add(X.Weapon.glow)
			X.Weapon.glow.position.y = 50;

			X.Weapon.glow.position.x = 4;
			X.Weapon.glow.rotation.y = Math.PI/-2
			X.Weapon.glow.material.uniforms.viewVector.value = new THREE.Vector3().subVectors( camera.position, X.Weapon.glow.getWorldPosition() );
		}
		*/
		var delta = clock.getDelta();
		if (clock.getElapsedTime()-respawn_delay>=1) respawn_delay = null;

		if (camera.position.z < 400 && user) {
			camera.position.z += 2;
			if (camera.position.y < 55) camera.position.y += .5;
		}
		else if (user) {
			var dif = Math.abs(camera.position.x-user.position.x);
			if (dif>50) {
				if (user.position.x>900) camera.position.x = 0;
				else {
					camera.position.x = user.position.x + 50*(camera.position.x>user.position.x?1:-1);
					camera.position.x = Math.min(camera.position.x, 100);
					camera.position.x = Math.max(camera.position.x, -100);
				}
			}
			dif = Math.abs(camera.position.y-user.position.y);
			if (dif>10) camera.position.y = user.position.y + 10*(camera.position.y>user.position.y?1:-1);
			//camera.position.y = user.position.y;
			camera.position.y = Math.max(camera.position.y, -280)
			camera.position.y = Math.min(camera.position.y, 230)
		}
		

		for (var plyr in players) {
			if (players[plyr].game.health.HP<=0 && players[plyr].dead && players[plyr].game.clock.getElapsedTime()-players[plyr].dead>5) {
				//scene.add(players[plyr]);
				players[plyr].game.dmg_from = null;
				players[plyr].game.health.mesh.visible = true;
				players[plyr].game.health.HP = players[plyr].game.health.full;//scene.add(players[plyr].game.health.mesh);
				players[plyr].dead = null;
				players[plyr].velocity.set(0, 0, 0)
				players[plyr].position.set(240*Math.sign(1-2*Math.random()), 220, 0)
			}
		}
		if (user && user.dead && user.game.dmg_from) {
			socket.emit('death_update', user.game.dmg_from);
			user.game.dmg_from = null;
		}

		if (socket && socket.id) {
			socket.emit('update', {player: socket.id,
														 hp: user.game.health.HP, 
														 keysMap: clientKeys,
														 position: {x:user.position.x, y:user.position.y, z:user.position.z}
														});
		}

		for (var plyr in players) {
			updatePlayer(players[plyr], delta);
		}

		for (var ob=0 ; ob<scene.children.length ; ob++) if (scene.children[ob].update_game) {
			if (scene.children[ob].update_game({delta:delta, scene:scene}) === -1) {
				scene.remove(scene.children[ob]);
			}
		}
		
		
		if (chat_timer !== null && clock.getElapsedTime()-chat_timer>=5) {
			$('#chatbox').css('display', 'none');
			chat_timer = null;
		}

		renderer.render(scene, camera)
		requestAnimationFrame(animate)
	}

	
	
	function multi_game_update() {
		var delta = clock.getDelta();
		
		if (clock.getElapsedTime()-respawn_delay>=1) respawn_delay = null;
		
		if (colorN !== undefined && !color_changed && user && user.bones && Object.keys(user.bones).length===15) {
			user.color_change(colorN);
			color_changed = true;
		}
		
		if (camera.position.z < 400 && user) {
			camera.position.z += 2;
			if (camera.position.y < 55) camera.position.y += .5;
		}
		else if (user) {
			var dif = Math.abs(camera.position.x-user.position.x);
			if (dif>50) {
				if (user.position.x>900) camera.position.x = 0;
				else {
					camera.position.x = user.position.x + 50*(camera.position.x>user.position.x?1:-1);
					camera.position.x = Math.min(camera.position.x, 100);
					camera.position.x = Math.max(camera.position.x, -100);
				}
			}
			dif = Math.abs(camera.position.y-user.position.y);
			if (dif>10) camera.position.y = user.position.y + 10*(camera.position.y>user.position.y?1:-1);
			//camera.position.y = user.position.y;
			camera.position.y = Math.max(camera.position.y, -280)
			camera.position.y = Math.min(camera.position.y, 230)
		}

		for (var plyr in players) {
			if (players[plyr].game.health.HP<=0 && players[plyr].dead && players[plyr].game.clock.getElapsedTime()-players[plyr].dead>5) {
				//scene.add(players[plyr]);
				players[plyr].game.dmg_from = null;
				players[plyr].game.health.mesh.visible = true;
				players[plyr].game.health.HP = players[plyr].game.health.full;//scene.add(players[plyr].game.health.mesh);
				players[plyr].dead = null;
				players[plyr].velocity.set(0, 0, 0)
				players[plyr].position.set(240*Math.sign(1-2*Math.random()), 220, 0)
			}
		}
		if (user && user.dead && user.game.dmg_from) {
			socket.emit('death_update', user.game.dmg_from);
			user.game.dmg_from = null;
		}

		if (socket && socket.id) {
			socket.emit('update', {player: socket.id,
														 hp: user.game.health.HP, 
														 keysMap: clientKeys,
														 position: {x:user.position.x, y:user.position.y, z:user.position.z}
														});
		}

		for (var plyr in players) {
			updatePlayer(players[plyr], delta);
		}

		for (var ob=0 ; ob<scene.children.length ; ob++) if (scene.children[ob].update_game) {
			if (scene.children[ob].update_game({delta:delta, scene:scene}) === -1) {
				scene.remove(scene.children[ob]);
			}
		}
		
		
		if (chat_timer !== null && clock.getElapsedTime()-chat_timer>=5) {
			$('#chatbox').css('display', 'none');
			chat_timer = null;
		}
		renderer.render(scene, camera);
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
		scene.add(players[id]); 
		scene.add(players[id].game.health.mesh)
	}
	
})()