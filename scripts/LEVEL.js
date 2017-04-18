var LEVEL = [];


(function(){
	var EnemyData = {};
	
	function Enemy(data) {
		var enemy = new THREE.Group();
		CreateEnemy.call(enemy, data);
		//enemy.health.mesh = enemy.createHPBar();
		
		
		function CreateEnemy(data) {
			this.spawnable = data.spawnable || true
			this.spawnPt = new THREE.Vector3()
			this.location = new THREE.Vector3()
			this.purpose = data.purpose || 'enemy'
			this.DPS = data.DPS || 0
			this.active = data.active || false
			this.health = {
				HP: data.health.HP || data.health.full,
				full: data.health.full,
				mesh: (function(){
					var geometry = new THREE.CylinderGeometry(2, 2, 25);
					var material = new THREE.MeshLambertMaterial({color: new THREE.Color('darkgreen')});
					var mesh = new THREE.Mesh(geometry, material);
					mesh.purpose = 'healthbar'
					mesh.position.y = 25;
					mesh.rotation.z = Math.PI/2
					return mesh;
				})()
			}
			this.update_game = data.update_game || undefined
			this.ondeath = data.ondeath || undefined
			this.ondmg = data.ondmg || undefined
			
			
			this.add(data.mesh());
			this.add((function(){
				var size = 5
				var geometry = new THREE.Geometry();
				geometry.vertices.push(new THREE.Vector3(0, size*Math.sqrt(3)/4, 0),
															 new THREE.Vector3(-size/2, -size*Math.sqrt(3)/4, 0),
															 new THREE.Vector3(size/2, -size*Math.sqrt(3)/4, 0)
															)
				geometry.faces.push( new THREE.Face3(0, 1, 2));
				var material = new THREE.MeshBasicMaterial({color: new THREE.Color('red'), side: THREE.DoubleSide});
				var mesh = new THREE.Mesh(geometry, material);
				mesh.name = 'core';
				return mesh;
			})())
			this.traverse(function(obj) {
				if (obj.material) obj.material.needsUpdate = true;
				obj.active = data.active || false;
				obj.DPS = data.DPS || 0;
				obj.purpose = data.purpose || 'enemy';
			});
			var others = (data.others?data.others(this):undefined)
			this.others = others;
			
			for (var prop in data) {
				if (!this[prop]) this[prop] = clone(data[prop]);
			}
			
			function clone(obj) {
				if (typeof(obj) !== 'object') return obj;
				var ret = {};
				for (var key in obj) {
					ret[key] = clone(obj[key])
				}
				return ret;
			}
			if (data.setup) data.setup(this);
		}
		return enemy;

	}
	
	LEVEL.push(function(){
		this.id = 1;
		this.enemies = [];
		this.meshes = [];
		this.loaded = false;
		this.loadcheck = 0
		this.bounds = {left: -5000, right:10000, bottom: -200, top: 10000}
		this.hearts = []
		this.cleared = false
		var level = this;
		
		var fontLoader = new THREE.FontLoader();
		fontLoader.load(
			'../fonts/helvetiker_bold.typeface.json',
			function(response) {
				var spriteTexture = new THREE.TextureLoader().load('../images/heart.png')
				var spriteMat = new THREE.SpriteMaterial( { map: spriteTexture} );
				var heart = new THREE.Sprite(spriteMat)
				heart.scale.set(8, 8*(1440/1920), 1)
				heart.name = 'lives'
				level.hearts.push(heart)

				
				var textGeometry = new THREE.TextGeometry('READY', {font: response, size: 25, height: 3});
				textGeometry.computeBoundingSphere();
				var msg = new THREE.Mesh(textGeometry, new THREE.MeshPhysicalMaterial({color:new THREE.Color('aqua')}))
				level.meshes.push(msg)
				msg.matrixAutoUpdate = false
				msg.name = 'ready'
				msg.visible = false
				level.loadcheck++;
				if (level.loadcheck === 3) level.loaded = true;
			}
		)
		
		
		
		
		this.events = {
			respawn: {
				spawnPt: new THREE.Vector3(0, 90, 0),
				start: undefined,
				on: true,
				update_game: function(data) {
					var ready = data.scene.getObjectByName('ready')
					if (document.getElementById('screen_changer').style.display!=='none') $('#screen_changer').fadeOut(250)
					
					if (this.start === undefined) {
						this.start = data.time
						
						data.scene.background = new THREE.TextureLoader().load('images/stage1.jpg');
						
						$('#audio-background').empty()
						$('#audio-background').append('<source src="audio/zerostart.mp3" type="audio/mpeg" loop>')
						document.getElementById('audio-background').volume = .3
						document.getElementById('audio-background').currentTime = 0
						document.getElementById('audio-background').load()
						document.getElementById('audio-background').play()
						
						ready.visible = true
						ready.scale.set(1, 1, 1)
						ready.material.transparent = true
						ready.material.opacity = 0
						
						if (level.events.boss.on) {
							level.events.boss.on = false
							level.events.boss.engaged = false
							level.events.boss.start = undefined
							level.events.preboss.on = true
							data.camera.position.set(4150, 850, 200)
							data.player.position.set(4150, 850, 0)
							level.boss.action.spawn.update_game(level.boss, data)
							ready.scale.set(.5, .5, .5)
							ready.position.set(-ready.geometry.boundingSphere.radius*.5+4150, 875, 50)
							for (var enemy in level.enemies) if (level.enemies[enemy].ondeath) level.enemies[enemy].ondeath(data)
						} else {
							ready.position.set(-ready.geometry.boundingSphere.radius, 150, -data.camera.position.z/2)
							data.camera.position.set(0, 55, 200)
							data.player.position.copy(this.spawnPt)
						}

						data.scene.add(data.player)
						data.scene.add(data.player.game.health.mesh); data.player.game.health.mesh.position.y += 150; data.player.game.health.mesh.visible = true
						data.player.dead = null; data.player.game.health.HP = data.player.game.health.full;
						while (level.hearts.length < data.player.game.lives) level.hearts.push(level.hearts[0].clone(true))
						while (level.hearts.length > data.player.game.lives) data.scene.remove(level.hearts.pop())
						for (var i=0 ; i<level.hearts.length ; i++) data.scene.add(level.hearts[i])
						
						data.player.controls.enabled = false
						data.player.game.left = false; 
						if (data.player.animation) data.player.animation.stop_right()
						
						for (var enemy in level.enemies) if (level.enemies[enemy].ondeath && level.enemies[enemy]!==level.boss) level.enemies[enemy].ondeath(data)
					} else if (data.time - this.start > 4) {
						
						data.player.game.health.mesh.visible = true
						//level.events.stage.on = true
						ready.material.opacity -= (0.1);
						if (ready.material.opacity < 0.1) {
							data.player.controls.enabled = true
							if (!level.events.preboss.on) level.events.stage.on = true
							ready.visible = false
							this.on = false
							this.start = undefined
						}
					} else if (data.time - this.start > 2) {
						if (data.camera.position.z < 300 && data.player) {
							data.camera.position.z += 2;
							ready.position.z += 2
							if (data.camera.position.y < 55) data.camera.position.y += .5;
						}
					} else if (data.time - this.start > 1) {
						ready.material.opacity += 0.05
					} 
					
					ready.updateMatrix()
				}
			},
			stage: {
				start: undefined,
				on: false,
				update_game: function(data) {

					if (data.camera.position.z < 300 && data.player) {
						data.camera.position.z += 2;
						if (data.camera.position.y < 55) data.camera.position.y += .5;
					}
					else if (data.player) {
						if (data.player.dead===null) {
			
							var dif = Math.abs(data.camera.position.x-data.player.position.x);

							if (dif>20) {
								data.camera.position.x = data.player.position.x + 20*(data.camera.position.x>data.player.position.x?1:-1);
								//data.camera.position.x += data.player.velocity.x * data.delta //* (data.camera.position.x > data.player.position.x?-1:1)
								data.camera.position.x = Math.min(data.camera.position.x, data.scene.bounds.right);
								data.camera.position.x = Math.max(data.camera.position.x, data.scene.bounds.left+200);
							}
							dif = Math.abs(data.camera.position.y-data.player.position.y);
							if (dif>20) data.camera.position.y = data.player.position.y + 20*(data.camera.position.y>data.player.position.y?1:-1);
							data.camera.position.y = Math.max(data.camera.position.y, data.scene.bounds.bottom+200)
							data.camera.position.y = Math.min(data.camera.position.y, data.scene.bounds.top-200)
							/*
							data.camera.position.x = data.player.position.x
							data.camera.position.y = data.player.position.y
							*/
						}
					}
					
					if ((3990<=data.player.position.x && data.player.position.x<=4360) && (800<data.player.position.y&&data.player.position.y<900)) {
						data.scene.getObjectByName('door1').action.close.on = true
						data.scene.getObjectByName('door1').action.open.on = false
						this.on = false
						this.start = undefined
						level.events.preboss.on = true
						boss.action.spawn.update_game(boss, data)
						for (var enemy in level.enemies) if (level.enemies[enemy].ondeath) level.enemies[enemy].ondeath(data)
					}
				}
			},
			preboss: {
				on: false,
				update_game: function(data) {
					data.camera.position.y = 850;
					data.player.position.x = Math.max(3990, data.player.position.x)
					if (data.camera.position.x<4150) data.camera.position.x += 3
					
					if (data.player.position.x >=4350) {
						data.scene.getObjectByName('door2').action.close.on = true
						data.scene.getObjectByName('door2').action.open.on = false
						this.on = false
						level.events.boss.on = true
					}
				}
			},
			boss: {
				n: 0,
				engaged: false,
				start: undefined,
				on: false,
				update_game: function(data) {
					data.player.position.x = Math.max(4350, data.player.position.x)
					var boss = level.boss
					if (this.start === undefined) this.start = data.time
					else if (!this.engaged) {
						var audio = document.getElementById('audio-background')
						audio.volume = Math.max(0, audio.volume-0.005)
						if (data.camera.position.y !== 875) data.camera.position.y += Math.round(1.5 * (data.camera.position.y>875?-1:1))
						if (data.camera.position.x<4575) data.camera.position.x += 3
						else {
							boss.action.activate.update_game(boss, data)
							if (boss.active) {
								$('#audio-background').empty()
								$('#audio-background').append('<source src="audio/boss.mp3" type="audio/mpeg" loop>')
								document.getElementById('audio-background').volume = .3
								document.getElementById('audio-background').currentTime = 0
								document.getElementById('audio-background').load()
								document.getElementById('audio-background').play()
								this.engaged = true
							}
						}

					} 

				}
			}
		}
		
		
		this.update_game = function(data) {
			if (data.player.dead !== null && data.player.game.elapsed - data.player.dead > 3) {
				this.events.respawn.on = true
			} else if (data.player.dead!==null && data.time-data.player.dead>2 && document.getElementById('screen_changer').style.display==='none') {
				$('#screen_changer').fadeIn(500)
			}
			
			if (this.events.respawn.on) this.events.respawn.update_game(data)
			if (this.events.boss.on) this.events.boss.update_game(data) 
			if (this.events.preboss.on) this.events.preboss.update_game(data) 
			if (this.events.stage.on) this.events.stage.update_game(data) 
			
			if (level.boss.defeated) document.getElementById('audio-background').pause()
			if (level.boss.defeated && level.boss.action.death.complete!==undefined && data.time - level.boss.action.death.complete > 2) {
				//	clear stage action
				var n = 111
				data.player.controls.enabled = false
				var $screen_changer = $('#screen_changer')
				if ($screen_changer.css('display')==='none') $screen_changer.fadeIn(500).queue(function(){
					level.cleared = true
					$(this).dequeue()
				})
			}
			
			var heart = data.scene.getObjectByName('lives')
			var theta = data.camera.fov * Math.PI/180 / 2
			var H = 2 * (data.camera.position.z-50) *  Math.tan(theta)
			var W = H * data.camera.aspect
			for (var i=0 ; i<level.hearts.length; i++) {
				level.hearts[i].position.set(data.camera.position.x-W/2+10, data.camera.position.y+H/2-10 - i*10, 50)
			}

		}
		
		var loader = new THREE.ColladaLoader();
		
		loader.load(
			'collada/levels.dae',
			function(collada) {
				var turretMesh = collada.scene.children[0];
				EnemyData.turret = {
					mesh: function() {
						var turret = turretMesh.clone(true)
						turret.position.y += (17/40)*77
						turret.scale.set(80, 80, 80);
						turret.traverse(function(obj) {
							if (obj.material) {
								obj.material = new THREE.MeshBasicMaterial({wireframe: true, color: new THREE.Color('yellow')})
							}
						})
						return turret;
					},
					DPS: 30,
					health: {full: 110},
					ondmg: function(src, data) {
						this.health.HP -= src.DPS;
						if (this.health.HP <= 0) {
							this.ondeath(data)
							this.action.death.on = true
							return;
						}
						
						this.health.prev = data.time;
						this.health.mesh.material.color = new THREE.Color('red')
					},
					update_game: function(data) {
						var core = this.getObjectByName('core')
						
						if (this.action.death.on) {
							this.action.death.update_game(this, data)
							return;
						}
						if (!this.active && this.spawnable && this.location.distanceTo(data.player.position)<400) {
							this.action.spawn.update_game(this, data)
						} else if (!this.active && this.location.distanceTo(data.player.position)>=400) this.spawnable = true;
						if ((data.player.dead && data.time-data.player.dead>3) || (!data.player.dead && data.player.position.distanceTo(this.position)>800)) {
							this.action.death.update_game(this, data)
							this.ondeath(data)
							//this.traverse(function(obj){obj.active = false;})
						}
						
						if (!this.active) return;
						
						this.scale.set(1, 1, 1);
						core.scale.set(2, 2, 2)
						core.rotation.y += 0.1
						this.health.mesh.scale.y = (this.health.HP/this.health.full<1/100?1/100:this.health.HP/this.health.full)
						if (data.time - this.health.prev > .75) {
							if (this.health.mesh.scale.y > 0.5) this.health.mesh.material.color.set(new THREE.Color('darkgreen'));
							else if (this.health.mesh.scale.y > 0.2) this.health.mesh.material.color.set(0xffff00);
							else this.health.mesh.material.color.set(0xff6600);
						}
						
						if (data.time - this.timers.fire > .3 && data.player.position.distanceTo(this.position)<=250) {
							for (var obj in this.others.proj1) {
								if (!this.others.proj1[obj].active) {
									var proj = this.others.proj1[obj];
									proj.position.copy(this.getObjectByName('core').getWorldPosition())
									var dif = data.player.position.clone();
									dif.sub(proj.position);
									dif.normalize();
									proj.raycs.ray.direction.copy(dif)
									dif.multiplyScalar(200);
									proj.velocity.copy(dif)
									
									this.sfx.fire.pause()
									this.sfx.fire.currentTime = 0
									this.sfx.fire.play()
									proj.active = true;	
									this.timers.fire = data.time;
									break;
								}
							}
						}
					},
					action: {
						death: {
							on: false,
							update_game: function(turret, data) {
								var core = turret.getObjectByName('core')
								if (turret.scale.x > 0.01) {
									if (core.scale.x > 0.01) core.scale.subScalar(.04)
									else {
										turret.scale.subScalar(0.05)
										if (turret.scale.x <= 0.01) {
											turret.position.x = data.scene.bounds.left - 300
											this.on = false
										}
									}
								}
							}
						},
						spawn: {
							on: false,
							update_game: function(turret, data) {
								turret.getObjectByName('core').scale.set(2, 2, 2)
								turret.getObjectByName('core').material.color = new THREE.Color('red')
								turret.health.mesh.visible = true
								turret.health.HP = turret.health.full
								turret.health.mesh.material.color = new THREE.Color('darkgreen')
								turret.spawnable = false;
								turret.position.copy(turret.spawnPt);
								turret.traverse(function(obj) {
									obj.active = true;
								})
							}
						}
					},
					ondeath: function(data) {
						this.getObjectByName('core').material.color = new THREE.Color('pink')
						this.health.mesh.visible = false
						this.traverse(function(obj) {
							obj.active = false;
						})
					},
					sfx: undefined,
					setup: function(turret) {
						turret.sfx = {
							fire: newSFX('audio/enemy/turret_fire.wav', 0.2)
						}
					},
					others: function(source){
						var objects = {}
						
						objects.proj1 = []
						for (var i=0 ; i<3 ; i++) objects.proj1.push(new projectile(source))
						function projectile(source) {
							var obj = new THREE.Mesh(new THREE.SphereGeometry(4, 8),
																			 new THREE.MeshBasicMaterial({color: new THREE.Color('lightgreen')})
																			)
							obj.matrixAutoUpdate = false;
							sub.call(obj, source)
							obj.position.set(level.bounds.left-300, 0, 0)
							obj.updateMatrix()
							return obj;
							function sub(source) {
								this.source = source;
								this.DPS = 20
								this.purpose = 'projectile'
								this.active = false
								this.velocity = new THREE.Vector3()
								this.raycs = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 10)

								this.update_game = function(data) {
									if (!this.active) return;
									
									this.raycs.ray.origin.copy(this.position)
									this.position.x += this.velocity.x*data.delta; this.position.y += this.velocity.y*data.delta;
									var intersections = this.raycs.intersectObject(data.player, true);
									
									if (intersections.length!==0) { 
										var player = intersections[0].object;
										while (player.purpose !== 'player') player = player.parent;
										if (this.sfx && this.sfx.hit) this.sfx.hit.play();
										else {
											player.sfx['hit'].pause();
											player.sfx['hit'].currentTime = 0;
											player.sfx['hit'].play()
										}
										if (player.ondmg) player.ondmg(this, data)
										else {
											if (!player.game.left&&player.game.sliding) dir = -1;
											else if (player.game.left&&player.game.sliding) dir = 1;
											else if (this.velocity.x<0) dir = -1;
											else dir = 1;
											player.action.flinch(player.game.clock.getElapsedTime(), dir, this.DPS);
											player.game.health.HP -= this.DPS;
											player.game.health.mesh.material.color = new THREE.Color('red');
											player.game.health.prev = player.game.clock.getElapsedTime();
										}
										this.active = false;
										this.position.set(data.scene.bounds.left-300)
									} else if (this.position.distanceTo(source.position)>500) {
										this.active = false;
										this.position.set(data.scene.bounds.left-300)
									}
									//	call ondeath
									
									intersections = this.raycs.intersectObjects(data.scene.children)
									for (var obj in intersections) {
										if (intersections[obj].object.purpose === 'surface') {
											this.active = false;
											this.position.set(data.scene.bounds.left - 300)
											break;
										}
									}
									this.updateMatrix();
								}

								this.sfx = {

								}
							}
						}
						
						return objects;
					}
				}
				
				
				function Turret (pos) {
					var turret = new Enemy(EnemyData.turret);
					turret.traverse(function(obj){
						level.enemies.push(obj)
					})
					turret.position.x = level.bounds.left - 300;
					turret.location.copy(pos)
					turret.spawnPt.copy(pos)
					turret.add(turret.health.mesh)
					turret.health.mesh.position.y += 45
					turret.getObjectByName('core').position.y += 28
					turret.timers = {};
					turret.timers.fire = 0;
					for (var i=0 ; i<turret.others.proj1.length ; i++) {
						level.meshes.push(turret.others.proj1[i])
						turret.others.proj1[i].position.x = level.bounds.left - 300;
					}
					return turret;
				}

				var turret1 = new Turret(new THREE.Vector3(400, 0, 0))
				level.meshes.push(turret1)
				var turret2 = new Turret(new THREE.Vector3(850, -70, 0))
				level.meshes.push(turret2)
				var turret3 = new Turret(new THREE.Vector3(1750, 0, 0))
				level.meshes.push(turret3)
				/*
				var turret4 = new Turret(new THREE.Vector3(-100, 150, 0))
				level.meshes.push(turret4)
				*/


				level.loadcheck++;
				if (level.loadcheck === 3) level.loaded = true;
			}
		)

		
		
		var geometry, material, mesh;
		var directional = new THREE.DirectionalLight('white', .5);
		directional.position.set(0, 100, 200);
		this.meshes.push(directional)

		
		this.meshes.push(newBlock(-100, 600, 0, 500, 50));
		this.meshes.push(newBlock(600, 330, -70, 500, 50));
		this.meshes.push(newBlock(1000, 140, -70, 500, 50));
		this.meshes.push(newBlock(1100, 400, 0, 500, 50))
		this.meshes.push(newBlock(1650, 150, 0, 500, 50))
		this.meshes.push(newBlock(1900, 100, 70, 50, 50))
		this.meshes.push(newBlock(2100, 80, 150, 60, 50))
		this.meshes.push(newBlock(2400, 50, 50, 50, 50))
		this.meshes.push(newBlock(2600, 1100, 50, 500, 50))
		this.meshes.push(newBlock(3100, 500, 300, 350, 50))
		this.meshes.push(newBlock(3250, 350, 900, 600, 50))
		this.meshes.push(newBlock(3100, 150, 600, 200, 50))
		this.meshes.push(newBlock(3080, 170, 900, 200, 50))
		this.meshes.push(newBlock(3600, 150, 750, 300, 50))
		this.meshes.push(newBlock(3950, 400, 800, 700, 50))
		this.meshes.push(newBlock(3950, 400, 1300, 400, 50))
		this.meshes.push(newBlock(4350, 500, 750, 300, 50))
		this.meshes.push(newBlock(4350, 500, 1300, 300, 50));
		this.meshes.push(newBlock(4800, 300, 1300, 800, 50))
		
		var door = new Door(new THREE.Vector3(3970, 850, 0), -1, 'door1')
		for (var part in door.meshes) this.meshes.push(door.meshes[part])
		door = new Door(new THREE.Vector3(4330, 850, 0), -1, 'door2')
		for (var part in door.meshes) this.meshes.push(door.meshes[part])
		
		function Door (pos, front, name) {
			var door, mid, top, bot;
			mid = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 51, 32), new THREE.MeshPhysicalMaterial({color: new THREE.Color('silver')}))
			mid.rotation.x = Math.PI/2
			top = new THREE.Mesh(new THREE.BoxGeometry(40, 50, 50), new THREE.MeshPhongMaterial({color: new THREE.Color('silver')}))
			bot = new THREE.Mesh(new THREE.BoxGeometry(40, 50, 50), new THREE.MeshPhongMaterial({color: new THREE.Color('silver')}))
			mid.matrixAutoUpdate = false; top.matrixAutoUpdate = false; bot.matrixAutoUpdate = false
			top.purpose = bot.purpose = 'surface'
			
			door = {meshes: [mid, top, bot], position: pos}
			mid.position.copy(pos); mid.originalpos = mid.position.clone();
			top.position.copy(pos); top.position.y += 25; top.originalpos = top.position.clone();
			bot.position.copy(pos); bot.position.y -= 25; bot.originalpos = bot.position.clone();
			bot.velocity = new THREE.Vector3(0, -30, 0)
			bot.down = new THREE.Vector3(0, -30, 0)
			
			mid.name = name
			mid.top = top; mid.bot = bot;
			mid.opened = false
			mid.raycs = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(front, 0, 0), 0, 25)
			mid.action = {
				open: {
					on: false,
					update_game: function(data) {
						if (mid.scale.y > .01) {
							mid.scale.y -= 0.05
						} else if (top.position.distanceTo(mid.position)<25+50+22+50) {
							bot.velocity.y = -30
							mid.visible = false
							if (top.position.distanceTo(top.originalpos)<50) top.position.y += 0.5
							if (mid.position.distanceTo(mid.originalpos)<22+50) mid.position.y += bot.velocity.y * data.delta
							if (bot.position.distanceTo(bot.originalpos)<22+50) bot.position.y += bot.velocity.y * data.delta
						} else {
							mid.action.open.on = false
							mid.opened = true
							bot.velocity.y = 0
						}
					}
				},
				close: {	
					on: false,
					update_game: function(data) {
						if (top.position.distanceTo(mid.position)>25) {
							bot.velocity.y = -30
							if (top.position.distanceTo(top.originalpos)>0) top.position.y -= 0.5
							if (mid.position.distanceTo(mid.originalpos)>0) mid.position.y -= bot.velocity.y * data.delta
							if (bot.position.distanceTo(bot.originalpos)>0) bot.position.y -= bot.velocity.y * data.delta
						} else if (mid.scale.y < 1) {
							mid.visible = true
							mid.scale.y += 0.05
						} else{
							mid.action.close.on = false
							mid.opened = false
							bot.velocity.y = 0
						}
					}
				}
			}
			mid.update_game = function(data) {
				if (!(mid.action.open.on||mid.action.close.on) && data.player.position.distanceTo(mid.position)>100) return;

				mid.raycs.ray.origin.copy(mid.position)
				if (!mid.opened && mid.raycs.intersectObject(data.player, true).length>0) mid.action.open.on = true
				
				if (mid.action.open.on) mid.action.open.update_game(data)
				if (mid.action.close.on) mid.action.close.update_game(data)
				
				mid.updateMatrix(); top.updateMatrix(); bot.updateMatrix();
			}
			
			mid.updateMatrix(); top.updateMatrix(); bot.updateMatrix();
			return door;
		}
		
		EnemyData.flying = {
			mesh: function(){
				var geometry = new THREE.SphereGeometry(20, 3)
				var material = new THREE.MeshPhongMaterial({wireframe: true, color: new THREE.Color('yellow')})
				var mesh = new THREE.Mesh(geometry, material)
				return mesh;
			},
			DPS: 30,
			health: {full: 70},
			update_game: function(data){
				var offset = this.radiusOffset || 0;
				var core = this.getObjectByName('core');
				if (this.action.death.on) this.action.death.update_game(this, data)
				else if (!this.active && this.spawnable && this.location.distanceTo(data.player.position)<400-offset) {
					this.action.spawn.update_game(this, data)
				}
				else if (!this.active && this.location.distanceTo(data.player.position)>400-offset) this.spawnable = true;
				
				if ((data.player.dead && data.time-data.player.dead>3) || this.position.distanceTo(data.player.position)>800) {
					this.action.death.update_game(this, data)
					this.ondeath(data)
				}
				
				if (!this.active) return;
				this.sfx.fly.play()
				core.rotation.z += .1;
				var diff = data.player.position.clone();
				core.scale.set(1, 1, 1);
				this.scale.set(1, 1, 1)
				diff.sub(this.position);
				diff.normalize();
				diff.multiplyScalar(50*data.delta)
				this.position.add(diff)

				var health = this.health
				health.mesh.scale.y = (health.HP/health.full<1/100?1/100:health.HP/health.full)
				if (health.HP<=0) {
					this.ondeath()
					this.action.death.on = true
				}
				else if (data.time - health.prev > .3) {
					if (health.mesh.scale.y > 0.5) health.mesh.material.color.set(new THREE.Color('darkgreen'));
					else if (health.mesh.scale.y > 0.2) health.mesh.material.color.set(0xffff00);
					else health.mesh.material.color.set(0xff6600);
				}
			},
			sfx: undefined,
			setup: function(flying) {
				flying.sfx = {
					fly: newSFX('audio/enemy/flying.wav', 0.1, true)
				}
			},
			ondeath: function() {
				this.sfx.fly.pause()
				this.sfx.fly.currentTime = 0
				this.traverse(function(obj) {
					obj.active = false;
				})
				this.health.mesh.visible = false;
				this.getObjectByName('core').material.color = new THREE.Color('pink')
			},
			action: {
				death: {
					on: false,
					update_game: function(flying, data) {
						var core = flying.getObjectByName('core');
						if (flying.scale.x>.01) {
							if (core.scale.x>.01) core.scale.subScalar(0.03);
							else if (flying.scale.x>.01) {
								flying.scale.subScalar(0.05);
								if (flying.scale.x <= 0.01) {
									this.on = false
									flying.position.x = data.scene.bounds.left - 300;
								}
							}
						}
					}
				},
				spawn: {
					on: false,
					update_game: function(flying, data) {
						var core = flying.getObjectByName('core');
						core.material.color = new THREE.Color('red')
						flying.health.HP = flying.health.full;
						flying.health.mesh.visible = true;
						flying.spawnable = false;
						flying.position.copy(flying.spawnPt);
						flying.traverse(function(obj){
							obj.active = true;
						})
					}
				}
			}
		}
		
		function Flying(loc, spawn, offset) {
			var enemy = new Enemy(EnemyData.flying)
			enemy.position.set(level.bounds.left-300, 0, 0)
			enemy.traverse(function(obj){level.enemies.push(obj);})
			enemy.spawnPt.copy(spawn)
			enemy.location.copy(loc)
			enemy.add(enemy.health.mesh)
			enemy.radiusOffset = offset;
			return enemy
		}
		var fly2 = new Flying(new THREE.Vector3(2100, 400, 0), new THREE.Vector3(2100, 350, 0))
		level.meshes.push(fly2)
		var fly2 = new Flying(new THREE.Vector3(2100, 400, 0), new THREE.Vector3(1800, 350, 0));
		level.meshes.push(fly2)
		var fly3 = new Flying(new THREE.Vector3(3100, 100, 0), new THREE.Vector3(2700, 500, 0), 300)
		level.meshes.push(fly3)
		var fly4 = new Flying(new THREE.Vector3(3100, 780, 0), new THREE.Vector3(3100, 1400, 0), 300)
		level.meshes.push(fly4)
		
		EnemyData.worm = {
			mesh: function() {
				var geometry = new THREE.SphereGeometry(20, 6);
				var material = new THREE.MeshStandardMaterial({color:new THREE.Color('yellow'), wireframe: true})
				var body = new THREE.Mesh(geometry, material);
				var left = new THREE.Mesh(new THREE.SphereGeometry(10, 6), 
																	new THREE.MeshStandardMaterial({color:new THREE.Color('yellow'), wireframe: true}));
				left.position.set(-20, 0, 0)
				body.add(left);
				right = new THREE.Mesh(new THREE.SphereGeometry(10, 6), 
																	new THREE.MeshStandardMaterial({color:new THREE.Color('yellow'), wireframe: true}));
				right.position.set(20, 0, 0)
				body.add(right)
				return body;
			},
			active: true,
			velocity: new THREE.Vector3(-100, 0, 0),
			DPS: 40,
			health: {full: 1},
			ondmg: function(src, data) {
				
			},
			update_game: function(data) {
				if (this.position.distanceTo(data.player.position)>600) return;
				var g = 1100;
				var core = this.getObjectByName('core')
				this.raycs.foot.ray.origin.copy(this.position)
				this.raycs.detect.ray.origin.copy(this.position)
				
				this.velocity.y -= g * data.delta;
				core.rotation.z += 0.1
				
				var intersections = this.raycs.foot.intersectObjects(data.scene.children);
				var onsurface = false;
				for (var obj in intersections) {
					if (intersections[obj].object.purpose === 'surface') {
						this.position.y = intersections[obj].point.y + 20
						this.velocity.y = 0;
						this.prev.pos.copy(this.position)
						this.prev.airborne = false;
						onsurface = true;
						break;
					}
				}
				
				if (!this.prev.airborne && !onsurface) {
					this.position.copy(this.prev.pos)
					this.velocity.y = 0;
					this.velocity.x *= -1;
				}
				
				
				if (this.velocity.x<0) this.raycs.detect.ray.direction.x = -1;
				else if (this.velocity.x>0) this.raycs.detect.ray.direction.x = 1;
				if (!this.action.atk.on && this.raycs.detect.intersectObject(data.player, true).length>0) this.action.atk.on = true;
				
				this.position.y += (this.velocity.y*data.delta)
				if (this.action.atk.on) {this.action.atk.update(this, data);}
				
				this.position.x += (this.velocity.x * data.delta)
				
			},
			sfx: undefined,
			setup: function(worm){
				worm.sfx = {
					compress: newSFX('audio/enemy/worm_charge.wav', 0.1),
					attack: {
						played: false,
						sfx: newSFX('audio/enemy/worm_attack.wav', 0.2)
					}
				}
			},
			prev: {
				airborne: true,
				pos: new THREE.Vector3()
			},
			raycs: {
				foot: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 20),
				detect: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 170)
			},
			action: {
				atk: {
					on: false,
					start: undefined,
					update: function(obj, data) {
						
						if (!this.start) {
							this.start = data.time;
						}
						if (data.time - this.start < 2) {
							obj.sfx.compress.play()
							obj.scale.x *= 0.99;
							obj.velocity.x = 0;
						} else if (data.time - this.start < 6) {
							obj.sfx.compress.pause()
							if (!obj.sfx.attack.played) {
								obj.sfx.attack.played = true
								obj.sfx.attack.sfx.play()
							}
							obj.scale.x = 1.5
							obj.velocity.x = 500 * obj.raycs.detect.ray.direction.x
						} else {
							obj.sfx.compress.pause()
							obj.sfx.compress.currentTime = 0
							obj.sfx.attack.played = false
							obj.sfx.attack.sfx.pause()
							obj.sfx.attack.sfx.currentTime = 0
							
							obj.scale.set(1, 1, 1)
							obj.velocity.x = 100 * (obj.velocity.x<0?-1:1)
							this.start = undefined;
							this.on = false
						}
					}
				}
			}
		};
		
		var worm1 = new Worm(new THREE.Vector3(1300, 100, 0))
		this.meshes.push(worm1)
		var worm2 = new Worm(new THREE.Vector3(2700, 200, 0))
		this.meshes.push(worm2)
		var worm3 = new Worm(new THREE.Vector3(3300, 1000, 0))
		this.meshes.push(worm3)
		//var worm4 = new Worm(new THREE.Vector3(-300, 200, 0))
		//this.meshes.push(worm4)
		
		function Worm(pos) {
			var worm = new Enemy(EnemyData.worm);
			worm.position.copy(pos)
			worm.traverse(function(obj){level.enemies.push(obj)})
			return worm;
		}

		EnemyData.boss1 = {
			mesh: function() {
				var mesh, geo, mat;
				var r = 30,
						r1 = 3;
				geo = new THREE.IcosahedronGeometry(r, 1);
				mat = new THREE.MeshBasicMaterial({color: new THREE.Color('yellow'), wireframe: true})
				mesh = new THREE.Mesh(geo, mat)
				mesh.name = 'main'
				var anchor1 = new THREE.Group(),
						anchor2 = new THREE.Group(),
						anchor3 = new THREE.Group();
				anchor1.name = 'anchor1';anchor2.name = 'anchor2'; anchor3.name = 'anchor3'
				var ball1 = new Shot('shot0'),
						ball2 = new Shot('shot1')
				anchor1.add(ball1); ball1.position.x += r+r1+2;
				anchor1.add(ball2); ball2.position.x -= r+r1+2;
				ball1.updateMatrix(); ball2.updateMatrix();
				ball1 = new Shot('shot2')
				ball2 = new Shot('shot3')
				anchor2.add(ball1); ball1.position.y += r+r1+2;
				anchor2.add(ball2); ball2.position.y -= r+r1+2;
				ball1.updateMatrix(); ball2.updateMatrix();
				ball1 = new Shot('shot4')
				ball2 = new Shot('shot5')
				anchor3.add(ball1); ball1.position.z += r+r1+2;
				anchor3.add(ball2); ball2.position.z -= r+r1+2;
				ball1.updateMatrix(); ball2.updateMatrix();
				mesh.add(anchor1); mesh.add(anchor2); mesh.add(anchor3)
				
				function Shot(name) {
					var mesh, geo, mat;
					geo  = new THREE.IcosahedronGeometry(r1); mat = new THREE.MeshBasicMaterial({color: new THREE.Color('orange'), wireframe: true})
					mesh = new THREE.Mesh(geo, mat)
					
					mesh.velocity = new THREE.Vector3()
					mesh.purpose = 'enemy'
					mesh.active = true
					mesh.name = name
					mesh.matrixAutoUpdate = false
					mesh.raycs = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 18)
					mesh.dr = new THREE.Vector3()
					mesh.sfx = {
						reattach: newSFX('audio/enemy/boss1_reattach.wav', 0.1)
					}
					mesh.action = {
						death:{
							on: false,
							start: undefined,
							update_game: function(shot, data) {
								if (this.start === undefined) {
									this.start = data.time
									shot.material.color = new THREE.Color('grey')
								} else if (shot.scale.x > 0.01) {shot.scale.subScalar(0.05); shot.updateMatrix()}
								else {
									this.on = false
									return -1
								}
								return 0;
							}
						},
						spin: {
							update_game: function(shot, data) {
								shot.rotation.z += 0.1
							}
						},
						retract: {
							attached: false,
							check: 0,
							on: false,
							a: new THREE.Vector3(),
							update_game: function(shot, data) {
								if (!this.attached && shot.src.position.distanceTo(shot.position) <= 35) {
									shot.sfx.reattach.pause()
									shot.sfx.reattach.currentTime = 0
									shot.sfx.reattach.play()
									this.attached = true
									var n = shot.name.charAt(shot.name.length-1)
									var anchor = shot.src.getObjectByName('anchor' + (1+Math.floor(n/2)))
									anchor.add(shot)
									shot.position.set(0, 0, 0)
									switch(parseInt(n)) {
										case 0: shot.position.x -= 35; break;
										case 1: shot.position.x += 35; break;
										case 2: shot.position.y -= 35; break;
										case 3: shot.position.y += 35; break;
										case 4: shot.position.z -= 35; break;
										case 5: shot.position.z += 35; break;
									}
									
									this.check++;
								} else if (!this.attached) {	
									this.a.copy(shot.src.position)
									this.a.sub(shot.position)
									this.a.normalize()
									//this.a.multiplyScalar(250)
									var dist = shot.src.position.distanceTo(shot.position)
									this.a.multiplyScalar(1000*(1/Math.pow(1.001,dist))*(1/Math.pow(1.001,dist)))
									var dv = this.a.multiplyScalar(data.delta)
									shot.velocity.add(dv)
									shot.velocity.x = (Math.abs(shot.velocity.x)<400?shot.velocity.x:Math.sign(shot.velocity.x)*300)
									shot.velocity.y = (Math.abs(shot.velocity.y)<260?shot.velocity.y:Math.sign(shot.velocity.y)*200)

									var fromBot = shot.position.y - 750;
									var fromLeft = shot.position.x - 4350;
									
									shot.velocity.y += (700*((250-fromBot)/250)*((250-fromBot)/250)) * data.delta
									shot.velocity.y -= (700*((fromBot)/250)*((fromBot)/250)) * data.delta
									shot.velocity.x += (1000*((450-fromLeft)/450)*(450-fromLeft)/450) * data.delta;
									shot.velocity.x -= (1000*((fromLeft)/450)*(fromLeft)/450) * data.delta;
									
									
									
									var dr = shot.velocity.clone()
									dr.multiplyScalar(data.delta)
									shot.position.add(dr)
									
								} else if (shot.scale.x > 1) {
									shot.scale.subScalar(0.05)
									if (shot.scale.x <= 1) this.check++;
								} 
								
								if (this.check === 2) {
									this.on = false
									this.check = 0
									this.attached = false
								}
								
								shot.updateMatrix()
							}
						},
						fire: {
							dr: new THREE.Vector3(),
							on: false,
							update_game: function(shot, data) {
								shot.position.add(this.dr)
								shot.raycs.ray.origin.add(this.dr)
								var intersections = shot.raycs.intersectObjects(data.scene.children)
								for (var obj in intersections) {
									if (intersections[obj].object.purpose === 'surface') {
										shot.active = false
										this.on = false
										shot.material.color = new THREE.Color('grey')
										break;
									}
								}
							}
						}
					}
					mesh.update_game = function(data) {
						if (mesh.action.fire.on) mesh.action.fire.update_game(mesh, data);
						mesh.position.x = Math.min(4800, mesh.position.x); mesh.position.x = Math.max(4350, mesh.position.x)
						mesh.position.y = Math.min(1000, mesh.position.y); mesh.position.y = Math.max(750, mesh.position.y)
						mesh.updateMatrix()
					}
					
					return mesh;
				}
				
				return mesh;
			},
			defeated: undefined,
			health: {full: 750},
			active: false,
			DPS: 35,
			velocity: new THREE.Vector3(),
			ondmg: function(src, data) {
				this.health.HP -= src.DPS;
				if (this.health.HP <= 0) {
					this.defeated = true
					this.ondeath(data)
					return;
				}

				this.health.mesh.scale
				this.health.prev = data.time;
				this.health.mesh.material.color = new THREE.Color('red')
			},
			setup: function(boss) {
				boss.traverse(function(obj){
					if (obj.name.substring(0, 4) === 'shot') obj.src = boss;
				})
				
				boss.sfx = {
					fire: newSFX('audio/enemy/boss1_fire.wav', 0.1),
					hone: newSFX('audio/enemy/boss1_hone.wav', 0.1),
					retract: newSFX('audio/enemy/boss1_retract.wav', 0.1)
				}
			},
			sfx: undefined,
			update_game: function(data) {
				boss.health.mesh.position.copy(this.position);
				boss.health.mesh.position.y += 33
				var core = this.core	
				core.position.copy(this.position)
				if (this.action.death.on && this.defeated && this.action.death.complete===undefined) this.action.death.update_game(this, data)
				if (!this.active) return;
				
				core.scale.set(1.5+Math.sin(data.time*6)/2, 1.5+Math.sin(data.time*6)/2, 1.5+Math.sin(data.time*6)/2)
				var anc1 = this.getObjectByName('anchor1'),
						anc2 = this.getObjectByName('anchor2'),
						anc3 = this.getObjectByName('anchor3');
				var random = .03,//Math.random()/20,
						random2 = Math.random()/20;
				anc1.rotation.x += random; anc1.rotation.y += random; 
				anc2.rotation.y += random; anc2.rotation.z += random;
				anc3.rotation.x += random; anc3.rotation.z += random;
				
				
				this.health.mesh.scale.y = 2 * (this.health.HP/this.health.full<1/100?1/100:this.health.HP/this.health.full)
				if (data.time - this.health.prev > .75) {
					if (this.health.mesh.scale.y > 2 * 0.5) this.health.mesh.material.color.set(new THREE.Color('darkgreen'));
					else if (this.health.mesh.scale.y > 2 * 0.2) this.health.mesh.material.color.set(0xffff00);
					else this.health.mesh.material.color.set(0xff6600);
				}
				
				
				if (data.player.dead) this.action.levitate.update_game(this,data) 
				else if (this.action.fire.on) {
					if (this.action.fire.start === undefined) this.action.fire.start = data.time;
					this.action.fire.update_game(this, data);
				} else if (this.action.retract.on){
					this.action.retract.update_game(this, data)
				} else if (this.action.tackle.on) {
					if (this.action.tackle.start === undefined) this.action.tackle.start = data.time;
					this.action.tackle.update_game(this, data);
				} else {
					this.action.lockon.update_game(this, data);
				}
				
				boss.position.x = Math.max(boss.position.x, 4350); boss.position.x = Math.min(boss.position.x, 4800);
				boss.position.y = Math.max(boss.position.y, 750); boss.position.y = Math.min(1000, boss.position.y)
				this.prev.time = data.time;
			},
			ondeath: function(data) {
				this.traverse(function(obj){obj.active = false})
				this.health.mesh.visible = false
				this.action.death.on = true
			},
			action: {
				death: {
					complete: undefined,
					check: 0,
					shots: undefined,
					start: undefined,
					on: false,
					n: 100,
					vy: 0,
					update_game: function(boss, data) {
						
						if (this.start === undefined) {
							this.shots = []
							this.check = 0
							this.start = data.time
							boss.core.material.color = new THREE.Color('pink')
							for (var i=0 ; i<6 ; i++) {
								var shot = data.scene.getObjectByName('shot' + i)
								this.shots.push(shot)
								shot.action.death.on = true
							}
						} else if (this.check<6) {
							for (var i=0 ; i<6 ; i++) {
								if (this.shots[i].action.death.on && this.shots[i].action.death.update_game(this.shots[i], data)) {
									this.check++
								}
							}
						}	else if (this.n>0) {
							boss.core.scale.set(1.5+(this.n/100)*Math.sin(data.time*6)/2, 1.5+(this.n/100)*Math.sin(data.time*6)/2, 1.5+(this.n/100)*Math.sin(data.time*6)/2)
							this.n -= 0.5;
						} else if (boss.position.y-30>750) {
							this.vy -= 1100 * data.delta
							boss.position.y += this.vy * data.delta
						} else {
							boss.position.y = 750 + 30
							boss.getObjectByName('main').material.color = new THREE.Color('grey')
							this.complete = data.time
						}
						
					}
				},
				spawn: {
					update_game: function(boss, data) {
						boss.defeated = false
						boss.position.set(4700, 940, 0)
						boss.scale.set(0.5, 0.5, 0.5)
						boss.core.visible = false; boss.core.scale.set(1.5, 1.5, 1.5)
						boss.health.HP = boss.health.full
						boss.health.mesh.scale.y = 2; boss.health.mesh.visible = false
						boss.action.levitate.on = boss.action.lockon.on = false
					
						boss.action.retract.on = false
						boss.action.retract.prev = {scale: undefined}; boss.action.retract.expand = boss.action.retract.contract = boss.action.retract.finish = false; boss.action.retract.shots = boss.action.retract.start = undefined
						
						boss.action.tackle.on = false
						boss.action.tackle.move = false; boss.action.n = 0; boss.action.start = undefined, boss.action.prev = {atk: 0, dist: undefined}
						
						boss.action.fire.locked = false; boss.action.fire.n = 0; boss.action.fire.start = undefined; boss.action.fire.current = undefined; boss.action.fire.on = true
						for (var i=0 ; i<6 ; i++) {
							var shot = data.scene.getObjectByName('shot' + i)
							shot.action.retract.attached = false; shot.action.retract.check = 0
							var anchor = data.scene.getObjectByName('anchor' + (1+Math.floor(i/2)))
							anchor.rotation.x = anchor.rotation.y = anchor.rotation.z = 0
							anchor.add(shot)
							shot.scale.set(1, 1, 1); shot.position.set(0, 0, 0); shot.material.color = new THREE.Color('orange')
							var n = shot.name.charAt(shot.name.length-1)
							
							switch(parseInt(n)) {
								case 0: shot.position.x = -35; break;
								case 1: shot.position.x = 35; break;
								case 2: shot.position.y = -35; break;
								case 3: shot.position.y = 35; break;
								case 4: shot.position.z = -35; break;
								case 5: shot.position.z = 35; break;
							}
							shot.updateMatrix()
						}
						
						boss.action.death.complete = undefined

					}
				},
				activate: {
					on: false,
					update_game: function(boss, data) {
						if (boss.core.visible === false) {
							boss.core.visible = true
							boss.core.visible = true; boss.core.material.transparent = true; boss.core.material.opacity = 0
							boss.health.mesh.scale.y = 0
						} else if (boss.core.material.opacity < 1) {
							boss.core.material.opacity += 0.04
							boss.core.material.opacity = Math.max(1, boss.core.material.opacity)
						} else if (boss.scale.x < 1) {
							boss.scale.multiplyScalar(1.005)
							if (boss.scale.x > 1) boss.scale.set(1, 1, 1)
							boss.core.scale.set(1.5+Math.sin(data.time*6)/2, 1.5+Math.sin(data.time*6)/2, 1.5+Math.sin(data.time*6)/2)
						} else if (boss.health.mesh.scale.y < 2) {
							boss.health.mesh.visible = true
							boss.health.mesh.scale.y += 0.05
							this.start = data.time
						} else if (data.time - this.start > 1) {
							level.boss.traverse(function(obj){obj.active = true;})
						}
					}
				},
				levitate: {
					n: 0,
					update_game: function(boss, data) {
						boss.rotation.y += .02
						boss.position.y += 1.25*Math.sin(this.n);
						this.n += .1;
					}
				},
				lockon: {
					r: 125,
					velocity: new THREE.Vector3(),
					update_game: function(boss, data) {
						var dist = boss.position.distanceTo(data.player.position);
						var a = boss.position.clone();
						a.sub(data.player.position);
						a.normalize();
						a.x *= (500*data.delta); a.y *= 300*5/6 * data.delta
						if (boss.position.distanceTo(data.player.position)>this.r) boss.velocity.sub(a);
						else {
							a.x *= (2.5);
							boss.velocity.add(a)
						}

						var fromBot = boss.position.y - 750;
						var fromLeft = boss.position.x - 4350;
						boss.velocity.x = (Math.abs(boss.velocity.x)<500?boss.velocity.x:Math.sign(boss.velocity.x)*500)
						boss.velocity.y = (Math.abs(boss.velocity.y)<500?boss.velocity.y:Math.sign(boss.velocity.y)*500)
						boss.velocity.y += (600*((250-fromBot)/250)*((250-fromBot)/250)) * data.delta
						boss.velocity.y -= (400*((fromBot)/250)*((fromBot)/250)) * data.delta
						boss.velocity.x += (500*((450-fromLeft)/450)*(450-fromLeft)/450) * data.delta;
						boss.velocity.x -= (500*((fromLeft)/450)*(fromLeft)/450) * data.delta;
						var dx = boss.velocity.clone();
						dx.multiplyScalar(data.delta)
						boss.position.add(dx);
					}
				},
				fire: {
					locked: false,
					current: undefined,
					n: 0,
					start: undefined,
					on: true,
					prev: {
						pos: undefined
					},
					update_game: function(boss, data) {
						boss.rotation.y += .02
						boss.action.lockon.update_game(boss, data)
						
						if (this.current === undefined) {
							this.current = boss.getObjectByName('shot' + this.n)
							var pos = this.current.getWorldPosition(); 
							data.scene.add(this.current)
							this.current.color = new THREE.Color('orange')
							this.current.position.copy(pos);
							this.prev.pos = boss.position.clone();
							this.current.updateMatrix()
						} else if (this.current.scale.x < 3) {
							this.current.rotation.z += 0.1
							var dr = boss.position.clone();
							dr.sub(this.prev.pos)
							this.current.position.add(dr)
							var dest = data.player.position.clone();
							dest.sub(boss.position)
							dest.normalize()
							var r = boss.getObjectByName('main').geometry.boundingSphere.radius;
							dest.multiplyScalar(r+10)
							dest.add(boss.position)
							
							if (this.locked) {
								this.current.position.copy(dest)
								this.current.scale.addScalar(0.03)
								this.current.material.color = new THREE.Color('red')
							} else if (!this.locked && this.current.position.distanceTo(dest)<1) {
								this.locked = true;
							} else if (!this.locked) {
								dest.sub(this.current.position)
								dest.normalize()
								dest.multiplyScalar(75 * data.delta)
								this.current.position.add(dest)
							}
							this.prev.pos.copy(boss.position)
							this.current.updateMatrix();
						} else {
							var dir = data.player.position.clone()
							dir.sub(boss.position)
							dir.normalize()
							this.current.raycs.ray.direction.copy(dir)
							this.current.raycs.ray.origin.copy(this.current.position)
							var offset = dir.clone(); offset.multiplyScalar(this.current.geometry.boundingSphere.radius)
							this.current.raycs.ray.origin.sub(offset)
							dir.multiplyScalar(400 * data.delta)
							this.current.action.fire.dr.copy(dir)
							this.current.action.fire.on = true
							boss.sfx.fire.pause()
							boss.sfx.fire.currentTime = 0
							boss.sfx.fire.play()
							
							this.n++;
							this.locked = false;
							this.current = undefined;
						}
						
						
						if (this.n === 6) {
							this.n = 0;
							this.on = false;
							boss.action.tackle.on = true;
						}
					}
				},
				tackle: {
					velocity: new THREE.Vector3(),
					from: new THREE.Vector3(),
					to: new THREE.Vector3(),
					moving: false,
					n: 0,
					start: undefined,
					prev: {
						atk: 0,
						dist: undefined,
					},
					on: false,
					update_game: function(boss, data) {
						
						if (data.time-this.start<.33) return;
						if (!this.moving) {
							this.moving = true
							this.from.copy(boss.position)
							this.to.copy(data.player.position)
							var dif = data.player.position.clone()
							dif.sub(boss.position)
							dif.normalize()
							dif.multiplyScalar(300 + ((this.n+1)*(this.n+1)*10))
							this.velocity.copy(dif)
							this.prev.dist = boss.position.distanceTo(this.to);
							
							boss.sfx.hone.pause()
							boss.sfx.hone.currentTime = 0
							boss.sfx.hone.play()
						} else if (boss.position.distanceTo(this.to)>0 && boss.position.distanceTo(this.to)<=this.prev.dist) {
							//data.scene.getObjectByName('bosscore').rotation.z += .1
							this.prev.dist = boss.position.distanceTo(this.to)
							boss.position.x += this.velocity.x * data.delta; boss.position.y += this.velocity.y * data.delta;
							this.prev.atk = data.time;
						} else if (data.time-this.prev.atk < (1-this.n/5)) {
							this.velocity.x *= 0.85;
							this.velocity.y *= .9
							boss.position.x += this.velocity.x * data.delta; //boss.position.y += this.velocity.y * data.delta;
							boss.action.levitate.update_game(boss, data)
						} else {
							this.n++;
							this.moving = false;
						}

						if (this.n === 5) {
							this.n = 0
							this.on = false
							this.start = undefined
							boss.action.retract.on = true

						}
					}
				},
				retract: {
					prev: {scale: undefined},
					expand: false,
					contract: false,
					finish: false,
					shots: undefined,
					start: undefined,
					on: false,
					update_game: function(boss, data) {
						if (this.expand || this.contract) ;//boss.action.levitate.update_game(boss, data)
						else boss.action.lockon.update_game(boss, data)
						
						if (this.start === undefined) {
							this.start = data.time
							this.shots = []
							for (var i=0 ; i<6 ; i++) {
								var shot = data.scene.getObjectByName('shot'+i)
								shot.material.color = new THREE.Color('orange')
								shot.active = true
								shot.action.retract.on = true
								boss.core.material.color = new THREE.Color('orange')
								this.prev.scale = 1
								this.shots.push(shot)
							}
							this.expand = true
							boss.sfx.retract.pause()
							boss.sfx.retract.currentTime = 0
							boss.sfx.retract.play()
						} else if (this.expand) {
							for (var i=0 ; i<6 ; i++) this.shots[i].action.spin.update_game(this.shots[i], data)
							var r = this.prev.scale
							boss.core.scale.set(r, r, r)
							boss.core.scale.multiplyScalar(1.04)
							if (boss.core.scale.x >= 4) {
								this.expand = false
								this.contract = true
							}
							this.prev.scale = boss.core.scale.x
						}	else if (this.contract) {
							for (var i=0 ; i<6 ; i++) this.shots[i].action.spin.update_game(this.shots[i], data)
							var r = this.prev.scale
							boss.core.scale.set(r, r, r)
							boss.core.scale.multiplyScalar(.96)
							if (boss.core.scale.x <= 1) {
								this.contract = false
							}
							this.prev.scale = boss.core.scale.x
						}	else if (!this.finish) {
							this.finish = true
							for (var i=0 ; i<6 ; i++) {
								if (!this.shots[i].action.retract.on) continue;
								this.shots[i].action.spin.update_game(this.shots[i], data)
								this.shots[i].action.retract.update_game(this.shots[i], data)
								this.finish = false
							}
						} else {
							boss.core.material.color = new THREE.Color('red')
							this.start = undefined
							this.finish = false
							this.on = false
							boss.action.fire.on = true
						} 
					}
				}
			},
			prev: {
				time: 0
			}
		}
		
		var boss = new Enemy(EnemyData.boss1);
		boss.traverse(function(obj){level.enemies.push(obj)})
		boss.core = boss.getObjectByName('core')
		boss.core.name = 'bosscore'; boss.core.rotation.z = Math.PI; 
		boss.add(boss.health.mesh); 
		boss.position.set(this.bounds.left - 300)
		this.boss = boss;
		this.meshes.push(boss)
		this.meshes.push(boss.core)
		this.meshes.push(boss.health.mesh)
		
		
		this.loadcheck++;
		if (this.loadcheck === 3) this.loaded = true;
		
		
		
	})
	//	LEVEL 2
	LEVEL.push(function(){
		this.id = 1
		this.enemies = []
		this.meshes = []
		this.loaded = false
		this.loadcheck = 0
		this.loadcheck_max = 4
		this.meshloaded = false
		this.bounds = {left: -5000, right:10000, bottom: -10000, top: 10000}
		this.hearts = []
		this.cleared = false
		this.flags = {
			wall1: true
		}
		var level = this
		
		
		this.update_game = function(data) {
			
			if (data.player.dead !== null && data.player.game.elapsed - data.player.dead > 3) {
				this.events.respawn.on = true
			} else if (data.player.dead!==null &&data.player.game.elapsed - data.player.dead>2 && document.getElementById('screen_changer').style.display==='none') {
				$('#screen_changer').fadeIn(500)
			}
			
			if (this.events.setup.on) this.events.setup.update_game(data)
			else if(this.loadcheck >= this.loadcheck_max) {
				
				if (this.events.respawn.on) this.events.respawn.update_game(data)
				if (this.events.stage.on) this.events.stage.update_game(data)
				if (this.loaded) {
					var heart = data.scene.getObjectByName('lives')
					var theta = data.camera.fov * Math.PI/180 / 2
					var H = 2 * (data.camera.position.z-200) *  Math.tan(theta)
					var W = H * data.camera.aspect
					for (var i=0 ; i<level.hearts.length; i++) {
						//level.hearts[i].position.set(0, 15*(1+i), 0)
						level.hearts[i].position.set(data.camera.position.x-W/2+3, data.camera.position.y+H/2-3 - i*4, 200)
					}
				}
			}
			

		}
		this.events = {
			setup: {
				on: true,
				start: undefined,
				progress: 0,
				update_game: function(data) {
					
					if (this.progress === 0) updateA(data)
					else updateB(data)
					
					function updateA(data) {
						level.events.setup.progress = 1
						var fontLoader = new THREE.FontLoader()
						fontLoader.load(
							'../fonts/helvetiker_bold.typeface.json',
							function(response) {
								var spriteTexture = new THREE.TextureLoader().load('../images/heart.png')
								var spriteMat = new THREE.SpriteMaterial( { map: spriteTexture, useScreenCoordinates: true} );
								var heart = new THREE.Sprite(spriteMat)
								heart.scale.set(3, 3*(1440/1920), 1)
								heart.name = 'lives'
								level.hearts.push(heart)

								var textGeometry = new THREE.TextGeometry('READY', {font: response, size: 25, height: 3});
								textGeometry.computeBoundingSphere();
								var msg = new THREE.Mesh(textGeometry, new THREE.MeshPhysicalMaterial({color:new THREE.Color('aqua')}))
								level.meshes.push(msg)
								msg.matrixAutoUpdate = false
								msg.name = 'ready'
								msg.visible = false

								level.loadcheck++;
							}
						)

						var loader = new THREE.ColladaLoader();
						loader.load(
							'collada/stage2.dae',
							function(collada) {
								//console.log(collada)
								var mesh;
								var moving3Pos = new THREE.Vector3(4300, -480, 0)
								for (var i=0 ; i<collada.scene.children.length ; i++) {				
									mesh = collada.scene.children[i].children[0]
									if (mesh.parent.name) mesh.name = mesh.parent.name
									if (mesh.name === 'entrance') mesh.material.side = THREE.DoubleSide
									else if (mesh.name.substring(0, 5) === 'spike') {
										mesh.purpose = 'enemy'
										mesh.DPS = 500
										mesh.active = true
										level.enemies.push(mesh)
									} else if (mesh.name.substring(0, 6) === 'moving') {
										let moving = mesh;
										console.log(moving.name)
										if (moving.name !== 'moving3') {
											moving.x0 = moving.position.x
											moving.velocity = new THREE.Vector3(75, 0, 0)
											if (moving.name === 'moving1') moving.velocity.x *= -1
											moving.update_game = function(data) {
												if (moving.name !== 'moving2' && Math.abs(data.player.position.x - 700) > 800) return;
												else if (moving.name === 'moving2' && Math.abs(data.player.position.distanceTo(moving3Pos)>600)) return;
												if (Math.abs(moving.position.x-moving.x0)>75) {
													moving.velocity.x *= -1
													moving.position.x = moving.x0 + (moving.position.x>moving.x0?75:-75)
												}
												moving.position.x += moving.velocity.x * data.delta
												moving.updateMatrix()
											}
										}
									} else if (mesh.name === 'button0') {
										let button = mesh
										button.material = new THREE.MeshPhysicalMaterial({color: new THREE.Color('lightgreen')})
										button.state = 'up'
										button.position.set(6742, -1661, 0)
										button.y0 = -1661
										button.updateMatrix()
										button.raycs = {
											up: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0, 30)
										}
										button.raycs.up.ray.origin.set(6742, -1661, 0)
										button.update_game = function(data) {
											if (data.player.position.distanceTo(this.position)>1000) return;
											
											if (this.state === 'up' && this.position.y<this.y0) {
												this.position.y += 30 * data.delta
												if (this.position.y >=0) {
													this.position.y = 0
												}
												this.updateMatrix()
												return;
											}
											if (this.state === 'down') return;
											if (Math.abs(data.player.position.x-this.position.x)<=15 && data.player.position.y-this.position.y < 50) {
												this.temp = data.time
												this.position.y -= (10)
												this.state = 'down'
												data.scene.getObjectByName('moving3').action.move.on = true
											}
											this.updateMatrix()
										}
									} 
									if (mesh.name === 'moving3') {
										let moving = mesh
										moving.velocity = new THREE.Vector3()
										moving.update_game = function(data) {
											if (this.action.move.on) this.action.move.update_game(data)
										}
										moving.action = {
											move: {
												phase: undefined,
												time: undefined,
												on: false,
												update_game: function(data) {
													if (!this.phase) {
														moving.velocity.y = -100
														this.phase = 1
													} else if (this.phase === 1) {
														moving.position.y += moving.velocity.y * data.delta
														if (moving.position.y < -100) {
															moving.position.y = -100
															moving.velocity.y = 0
															this.phase = 2
															this.time = data.time
														}
													} else if (this.phase === 2) {
														if (data.time - this.time < 2) return;
														moving.velocity.y = 100
														moving.position.y += moving.velocity.y * data.delta
														if (moving.position.y >= 100) {
															moving.position.y = 100
															moving.velocity.y = 0
															this.phase = 3
															this.time = data.time
														} 
													} else if (this.phase === 3) {
															if (data.time - this.time < 1.5) return;
															moving.velocity.y = -50
															moving.position.y += moving.velocity.y * data.delta
															if (moving.position.y <= 0) {
																moving.position.y = 0
																moving.velocity.y = 0
																this.phase = undefined
																this.on = false
																this.time = undefined
																data.scene.getObjectByName('button0').state = 'up'
															}
														}
													moving.updateMatrix()
												}
											}
										}
									}

									if (!mesh.purpose) mesh.purpose = 'surface'
									mesh.geometry.computeBoundingSphere()
									mesh.down = new THREE.Vector3(0, -10, 0)
									level.meshes.push(mesh)
									mesh.matrixAutoUpdate = false
								}

								level.loadcheck++;
							}
						)
						loader.load(
							'collada/stage2_enemies.dae',
							function(collada) {
								var soldierA_proto = new THREE.Group()
								var grenade_launcher_proto = new THREE.Group()
								var bird_proto = new THREE.Group()
								for (var i=0 ; i<collada.scene.children.length ; i++) {
									var mesh = collada.scene.children[i].children[0];
									mesh.name = mesh.parent.name
									if (mesh.parent.name.substring(0, 8) === 'soldierA') soldierA_proto.add(mesh) 
									else if (mesh.parent.name.substring(0, 16) === 'grenade_launcher') grenade_launcher_proto.add(mesh)
									else if (mesh.parent.name.substring(0, 4) === 'bird') bird_proto.add(mesh)
								}
								EnemyData.bird  = {
									mesh: function() {
										var bird = bird_proto.clone(true)
										return bird;
									},
									DPS: 40,
									health: {full: 70},
									external: {
										v: new THREE.Vector3()
									},
									velocity: new THREE.Vector3(),
									v0: new THREE.Vector3(0, -400, 0),
									raycs: {
										up: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0, 15),
										down: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 15),
										left: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(-1, 0, 0), 0, 15),
										right: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 15),
										detect: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 1000)
									},
									ondmg: function(src, data) {
										this.health.HP -= src.DPS;
										this.health.mesh.scale.y = this.health.HP/this.health.full<1/100?1/100:this.health.HP/this.health.full
										if (this.health.HP <= 0) {
											this.ondeath(data)
											this.action.death.on = true
											return;
										}

										this.health.prev = data.time;
										this.health.mesh.material.color = new THREE.Color('red')
									},//@bird
									update_game: function(data) {
										if (this.action.death.on) {
											this.action.death.update_game(this, data)
											return;
										}
										if (!this.active && this.spawnable && this.location.distanceTo(data.player.position)<600) {
											this.action.respawn.update_game(this, data)
										} else if (!this.active && this.location.distanceTo(data.player.position)>=800) this.spawnable = true;
										if ((data.player.dead && data.player.game.elapsed - data.player.dead > 3) || (!data.player.dead && data.player.position.distanceTo(this.position)>800)) {
											this.action.death.update_game(this, data)
											this.ondeath(data)
										}
										if (!this.active) return;
										
										if (!this.action.attack.on && !this.action.land.on) {
											this.raycs.detect.ray.origin.copy(this.position);
											var dir = data.player.position.clone()
											dir.sub(this.raycs.detect.ray.origin); dir.normalize()
											this.raycs.detect.ray.direction.copy(dir)
											
											var surfaceIntersection = this.raycs.detect.intersectObjects(data.scene.children)
											var playerIntersection = this.raycs.detect.intersectObject(data.player, true)
											let detected = false
											if (surfaceIntersection.length && playerIntersection.length) {
												let dist1;
												for (var c=0 ; c<surfaceIntersection.length ; c++) {
													if (surfaceIntersection[c].object.purpose === 'surface') {
														dist1 = surfaceIntersection[c].distance
														break;
													}
												}
												
												let dist2 = playerIntersection[0].distance
												if (dist2 <= dist1) detected = true
											} else if (playerIntersection.length) detected = true
											if (detected) this.action.attack.on = true
										}
										if (this.action.attack.on) this.action.attack.update_game(this, data)
										
										if (this.action.land.on) this.action.land.update_game(this, data)
										
										if (data.time - this.health.prev > .75) {
											if (this.health.mesh.scale.y > 0.5) this.health.mesh.material.color.set(new THREE.Color('darkgreen'));
											else if (this.health.mesh.scale.y > 0.2) this.health.mesh.material.color.set(0xffff00);
											else this.health.mesh.material.color.set(0xff6600);
										}
										
										
										this.traverse(function(obj){obj.updateMatrix()})
									},
									action: {
										respawn: {
											on: false,
											update_game: function(bird, data) {
												bird.spawnable = false
												bird.health.HP = bird.health.full
												bird.health.mesh.scale.set(1, 1, 1); bird.health.mesh.visible = true; bird.health.mesh.material.color = new THREE.Color('darkgreen')
												bird.scale.set(1, 1, 1)
												bird.visible = true
												bird.position.copy(bird.spawnPt)
												bird.traverse(function(obj){
													obj.active = true
												})
												this.on = false
												
												bird.action.xrotated = 0; bird.action.xrotate = 200; bird.action.yrotate = 0
												
												bird.action.attack.check = 0
												bird.action.attack.angle = undefined
												
												bird.action.land.check1 = bird.action.land.on = false
												bird.action.land.start = bird.action.land.orientation = undefined
												
												bird.velocity.copy(bird.v0)
												bird.action.attack.on = true
												bird.parts.head.rotation.x = 1
												bird.parts.body.rotation.set(0, 0, 0)
												bird.parts.left.rotation.z = 10 * Math.PI/180; bird.parts.right.rotation.z = -10 * Math.PI/180
											}
										},
										death: {
											on: false,
											update_game: function(bird, data) {
												bird.visible = false
												bird.position.set(data.scene.bounds.left - 300, 0, 0)
												
												this.on = false
											}
										},
										attack: {
											xrotated: 0,
											xrotate: 200,
											yrotate: 0,
											check: 0,
											angle: undefined,
											on: true,
											update_game: function(bird, data) {
												if (bird.external.v) {
													bird.position.x += bird.external.v.x * data.delta
													bird.position.y += bird.external.v.y * data.delta
												}
												if (bird.parts.head.rotation.x > 0) {
													bird.parts.head.rotation.x -= Math.PI/6 * data.delta
													bird.parts.right.rotateZ(-this.xrotate*Math.PI/180 * data.delta)
													bird.parts.left.rotateZ(this.xrotate*Math.PI/180 * data.delta)
													this.xrotate += Math.sign(this.xrotate) * 2
													this.xrotated += this.xrotate*Math.PI/180*data.delta
													if (this.xrotated*180/Math.PI>10 || this.xrotated*180/Math.PI<0) {
														this.xrotated = this.xrotated>0? 10*Math.PI/180 : 0
														this.xrotate *= -1	
													}
													if (bird.parts.head.rotation.x <= 0) {
														bird.parts.head.rotation.x = 0
														bird.external.v = undefined
														if (bird.velocity.x === 0 && bird.velocity.y === 0) {
															bird.velocity.copy(data.player.position)
															bird.velocity.sub(bird.position); bird.velocity.normalize()
															bird.velocity.multiplyScalar(400)
														}
														
														var dir = bird.parts.head.getWorldPosition().clone()
														dir.sub(bird.parts.body.getWorldPosition())
														dir.normalize()
														var vel = bird.velocity.clone(); vel.normalize()
														var angle = dir.angleTo(vel)
														this.angle = angle
														bird.parts.body.rotation.z += angle
														bird.traverse(function(obj){obj.updateMatrix()})
														this.xrotated = 0; this.xrotate = 200
														this.check++
														
													}
													else return;
												} else if (this.check === 1) {
													var dir = bird.parts.head.getWorldPosition().clone()
													dir.sub(bird.parts.body.getWorldPosition())
													dir.normalize()
													var vel = bird.velocity.clone(); vel.normalize()
													var angle = dir.angleTo(vel)
													if (angle>this.angle) bird.parts.body.rotation.z -= 2 * this.angle
													bird.parts.head.rotation.x = -Math.PI/ 2 * .8
													bird.parts.left.rotation.x = bird.parts.right.rotation.x = Math.PI/6
													bird.parts.left.rotation.z = 10 * Math.PI/180
													bird.parts.right.rotation.z = -10 * Math.PI/180
													this.check++
													this.angle = undefined
													
													
													if (bird.position.x < data.player.position.x) {
														this.yrotate = Math.PI/2
														bird.parts.body.rotateY(Math.PI/2)
													} else {
														this.yrotate = -Math.PI/2
														bird.parts.body.rotateY(-Math.PI/2)
													}
													
													return;
												}
												if (this.check < 2) return;
												var intersections;
												bird.position.x += bird.velocity.x * data.delta
												bird.position.y += bird.velocity.y * data.delta		
												
												for (var rayc in bird.raycs) bird.raycs[rayc].ray.origin.copy(bird.position)
												for (var rayc in bird.raycs) {
													if (rayc === 'detect') continue;
													intersections = bird.raycs[rayc].intersectObjects(data.scene.children)
													if (intersections.length && intersections[0].object.purpose === 'surface') {
														bird.velocity.set(0, 0, 0)
														bird.position.copy(intersections[0].point)
														if (intersections[0].object.velocity) bird.external.v = intersections[0].object.velocity

														switch(rayc) {
															case 'up':
																bird.position.y -= bird.raycs[rayc].far; break;
															case 'down':
																bird.position.y += bird.raycs[rayc].far; break;
															case 'left':
																bird.position.x += bird.raycs[rayc].far; break;
															case 'right':
																bird.position.x -= bird.raycs[rayc].far; break;
														}
														
														this.check = 0;
														this.on = false
														bird.action.land.orientation = rayc
														bird.action.land.on = true
														break;
													}
												}
											}
										},
										land: {
											check1: false,
											on: false,
											start: undefined,
											orientation: undefined,
											update_game: function(bird, data) {
												if (bird.external.v) {
													bird.position.x += bird.external.v.x * data.delta;
													bird.position.y += bird.external.v.y * data.delta
												}
												
												if (!this.check1) {
													this.check1 = true
													bird.parts.body.rotation.x = 0
													bird.parts.body.rotation.z = 0
													bird.parts.body.rotation.y = 0//bird.parts.body.rotateY(-bird.action.attack.yrotate)
													bird.parts.head.rotation.x = 0
													bird.parts.left.rotation.x = bird.parts.right.rotation.x = 0
												}
												if (bird.parts.head.rotation.x < Math.PI/ 6) {
													
													if (this.orientation === 'down') bird.parts.body.rotation.z = 0
													else if (this.orientation === 'up') bird.parts.body.rotation.z = Math.PI
													else if (this.orientation === 'left') bird.parts.body.rotation.z = Math.PI/-2
													else if (this.orientation === 'right') bird.parts.body.rotation.z = Math.PI/2
													bird.parts.head.rotation.x += Math.PI/3 * data.delta
													if (bird.parts.head.rotation.x >= Math.PI/6) {
														this.start = data.time
														bird.parts.head.rotation.x = Math.PI/6
													}
												} else if (this.start && data.time - this.start > 1) {
													this.orientation = undefined
													this.start = undefined
													this.check1 = false
													this.on = false
												}
											}
										}
									},
									ondeath: function(data) {
										this.health.mesh.visible = false
										this.traverse(function(obj) {
											obj.active = false;
										})
									},
									sfx: undefined,
									setup: function(bird) {
										bird.parts = {
											body: bird.getObjectByName('bird_body'),
											head: bird.getObjectByName('bird_head'),
											right: bird.getObjectByName('bird_right'),
											left: bird.getObjectByName('bird_left'),
											foot: bird.getObjectByName('bird_foot')
										}
										bird.add(bird.getObjectByName('bird_body'))
										bird.parts.body.add(bird.getObjectByName('bird_head'))
										bird.parts.body.add(bird.getObjectByName('bird_right'))
										bird.parts.body.add(bird.getObjectByName('bird_left'))
										bird.parts.body.add(bird.getObjectByName('bird_foot'))
										bird.remove(bird.getObjectByName('core'))
										for (var p in bird.parts) bird.parts[p].matrixAutoUpdate = false
										
										bird.parts.right.position.set(-4, 20, 0); bird.parts.right.rotateZ(-Math.PI/180 * 10)
										bird.parts.left.position.set(4, 20, 0); bird.parts.left.rotateZ(Math.PI/180 * 10)
										bird.parts.head.position.set(0, 17, 0)
										bird.add(bird.health.mesh)
										bird.health.mesh.position.set(0, 30, 0)
										
										
									},

								}
								EnemyData.grenade_launcher = {
									mesh: function() {
										var g_launcher = grenade_launcher_proto.clone(true)
										return g_launcher;
									},
									DPS: 30,
									health: {full: 100},
									velocity: new THREE.Vector3(),
									raycs: {
										foot: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0 , 10)
									},
									ondmg: function(src, data) {
										this.health.HP -= src.DPS;
										this.health.mesh.scale.y = this.health.HP/this.health.full<1/100?1/100:this.health.HP/this.health.full
										if (this.health.HP <= 0) {
											this.ondeath(data)
											this.action.death.on = true
											return;
										}

										this.health.prev = data.time;
										this.health.mesh.material.color = new THREE.Color('red')
									},
									update_game: function(data) {
										var g = 1100;
										var intersections;
										
										
										if (this.action.death.on) {
											this.action.death.update_game(this, data)
											return;
										}
										if (!this.active && this.spawnable && this.location.distanceTo(data.player.position)<600) {
											this.action.respawn.update_game(this, data)
										} else if (!this.active && this.location.distanceTo(data.player.position)>=600) this.spawnable = true;
										if ((data.player.dead && data.player.game.elapsed - data.player.dead>3) || (!data.player.dead && data.player.position.distanceTo(this.position)>800)) {
											this.action.death.update_game(this, data)
											this.ondeath(data)
										}
										
										if (!this.active) return;
										this.velocity.y -= 1100 * data.delta
										this.position.y += this.velocity.y * data.delta
										
										for (var rayc in this.raycs) {
											this.raycs[rayc].ray.origin.copy(this.position)
										}
										this.raycs.foot.ray.origin.y += this.raycs.foot.far
										intersections = this.raycs.foot.intersectObjects(data.scene.children)
										for (var i=0 ; i<intersections.length ; i++) {
											if (intersections[i].object.purpose === 'surface') {
												this.velocity.y = 0
												this.position.y = intersections[i].point.y
												break;
											}
										}
										
										if (data.time - this.health.prev > .75) {
											if (this.health.mesh.scale.y > 0.5) this.health.mesh.material.color.set(new THREE.Color('darkgreen'));
											else if (this.health.mesh.scale.y > 0.2) this.health.mesh.material.color.set(0xffff00);
											else this.health.mesh.material.color.set(0xff6600);
										}
										
										if (this.action.attack.on) this.action.attack.update_game(this, data)
										
										this.traverse(function(obj){obj.updateMatrix()})
									},
									action: {
										attack: {
											prev: 0,
											on: true,
											update_game: function(g_launcher, data) {
												var g = -1100
												if (g_launcher.position.distanceTo(data.player.position) > 220) return;
												
												if (g_launcher.position.x<data.player.position.x) {
													if (g_launcher.parts.cannon.rotation.z > -Math.PI/4) {
														g_launcher.parts.cannon.rotation.z -= 360 * Math.PI/180 * data.delta
														return;
													}
													g_launcher.parts.cannon.rotation.z = -Math.PI/4
												} else if ( g_launcher.position.x > data.player.position.x) {
													if (g_launcher.parts.cannon.rotation.z < Math.PI/4) {
														g_launcher.parts.cannon.rotation.z += 360 * Math.PI/180 * data.delta
														return;
													}
													g_launcher.parts.cannon.rotation.z = Math.PI/4
												}
												
												if (data.time - this.prev < .25 && g_launcher.parts.tip.position.y>25) {
													g_launcher.parts.tip.position.y -= 60 * data.delta
												} else if (data.time - this.prev < .5 && g_launcher.parts.tip.position.y < 30) {
													g_launcher.parts.tip.position.y += 60 * data.delta
												} else if (data.time - this.prev > 3) {
													g_launcher.parts.tip.position.y = 30
													for (var set=0 ; set<3 ; set++) {
														if (g_launcher.others.proj.ready[set] === 3) {
															this.prev = data.time
															var launchPt = g_launcher.parts.tip.getWorldPosition()
															var deltaX = data.player.position.x-launchPt.x
															if (deltaX<0) deltaX *= -1
															var deltaY = data.player.position.y-launchPt.y
															var v = Math.sqrt((g * deltaX*deltaX) / (2 * (deltaY-deltaX)))
															if (isNaN(v)) return;

															g_launcher.action.fire.update_game(g_launcher, data, v, set);
															break;
														}
													}
												}
											}
										},
										fire: {
											on: false,
											update_game: function(g_launcher, data, v, set) {
												var proj = g_launcher.others.proj
												for (var b=0 ; b<proj['set'+set].length ; b++) {
													var vel = v
													if (b === 1) vel *= 0.8
													else if (b === 2) vel *= 1.2
													proj['set'+set][b].action.startup.update_game(proj['set'+set][b], data, vel*(g_launcher.position.x<data.player.position.x?1:-1), vel)
												}
												
												proj.ready[set] = 0
											}
										},
										respawn: {
											on: false,
											update_game: function(g_launcher, data) {
												g_launcher.spawnable = false
												g_launcher.health.HP = g_launcher.health.full
												g_launcher.health.mesh.scale.set(1, 1, 1); g_launcher.health.mesh.visible = true; g_launcher.health.mesh.material.color = new THREE.Color('darkgreen')
												g_launcher.scale.set(1, 1, 1)
												g_launcher.visible = true
												g_launcher.position.copy(g_launcher.spawnPt)
												g_launcher.traverse(function(obj){
													obj.active = true
												})
												
												g_launcher.action.attack.prev = 0
												for (var i=0 ; i<3 ; i++) g_launcher.others.proj.ready[i] = 3
												this.on = false
											}
										},
										death: {
											on: false,
											update_game: function(g_launcher, data) {
												if (!this.on) return;
												g_launcher.position.set(data.scene.bounds.left-300, 0, 0)
												this.on = false
											}
										}
									},
									ondeath: function(data) {
										this.health.mesh.visible = false
										this.traverse(function(obj) {
											obj.active = false;
										})
									},
									sfx: undefined,
									setup: function(g_launcher) {
										g_launcher.add(g_launcher.getObjectByName('grenade_launcher0'))
										g_launcher.add(g_launcher.getObjectByName('grenade_launcher1'))
										g_launcher.add(g_launcher.getObjectByName('grenade_launcher2'))
										g_launcher.parts = {
											cannon: g_launcher.getObjectByName('grenade_launcher0'),
											body: g_launcher.getObjectByName('grenade_launcher1'),
											tip: g_launcher.getObjectByName('grenade_launcher2')
										}
										for (var c in g_launcher.children)
											if (g_launcher.children[c].name.substring(0, 16) !== 'grenade_launcher') 
												g_launcher.remove(g_launcher.children[c])
										for (var p in g_launcher.parts) g_launcher.parts[p].matrixAutoUpdate = false
										g_launcher.remove(g_launcher.getObjectByName('core'))
										
										g_launcher.parts.cannon.position.y = 15
										g_launcher.parts.cannon.add(g_launcher.parts.tip)
										g_launcher.parts.tip.position.y = 30
										
										g_launcher.add(g_launcher.health.mesh); g_launcher.health.mesh.position.y = 55
										g_launcher.position.set(level.bounds.left-300, 0, 0)
									},
									others: function(g_launcher) {
										
										var others = {}
										others.proj = {
											ready: [3, 3, 3],
											set0: [],
											set1: [],
											set2: []
										}
										
										for (var s=0 ; s<3 ; s++) {
											for (var i=0 ; i<3 ; i++) {
												others.proj['set'+s].push(new CannonBall(g_launcher, 's'+s+'b'+i))
											}
										}
										
										function CannonBall(source, name) {
											var mesh = new THREE.Mesh(new THREE.SphereGeometry(10, 8),
																								new THREE.MeshPhysicalMaterial({color: new THREE.Color('silver')})
																							 )
											sub.call(mesh)
											mesh.matrixAutoUpdate = false
											
											function sub() {
												this.src = source
												this.name = name
												this.purpose = 'enemy'
												this.active = false
												this.DPS = 50
												this.velocity = new THREE.Vector3()
												this.raycs = {
													dir: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 20),
													down: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 20)
												}
												this.update_game = function(data) {
													if (!this.active) return;
													var g = -1100
													var intersections;
													
													this.velocity.y += g * data.delta
													this.position.y += this.velocity.y * data.delta
													for (var rayc in this.raycs) this.raycs[rayc].ray.origin.copy(this.position)
														this.raycs.down.ray.origin.y += 10
														intersections = this.raycs.down.intersectObjects(data.scene.children)
														for (var i=0 ; i<intersections.length ; i++) {
															if (intersections[i].object.purpose === 'surface') {
																this.velocity.y = 0
																this.position.y = intersections[i].point.y + this.raycs.down.far/2
																this.velocity.x *= .95
															}
														}
													
													if (this.action.attack.on) this.action.attack.update_game(this, data)
													else if (this.action.death.on) this.action.death.update_game(this, data)
													
													this.updateMatrix()
												}
												this.action = {
													startup: {
														update_game: function(ball, data, vx, vy) {
															ball.velocity.set(vx, vy, 0)
															ball.active = true
															ball.action.attack.on = true
															ball.position.copy(ball.src.parts.tip.getWorldPosition())
															ball.updateMatrix()
														}
													},
													attack: {
														on: false,
														update_game: function(ball, data) {
															var g = 1100
																										
															ball.position.x += ball.velocity.x * data.delta
															
															if (Math.abs(ball.velocity.x) < .1 || ball.position.distanceTo(ball.src.spawnPt)>800) {
																this.on = false
																ball.action.death.on = true
																ball.action.death.start = data.time
																ball.velocity.x = 0
															}
														}
													},
													death: {
														on: false,
														start: undefined,
														update_game: function(ball, data) {
															if (data.time - this.start > 1) {
																ball.position.set(data.scene.bounds.left - 300, 0, 0)
																ball.src.others.proj.ready[+ball.name.charAt(1)]++;
																
																this.active = false
																this.on = false
																this.start = undefined
																
															}
														}
													}
												}
												this.ondeath = function(data) {
													this.position.set(data.scene.bounds.left - 300, 0, 0)
													this.active = false
													this.action.attack.on = this.action.death.on = false
													this.action.death.start = undefined
													this.src.others.proj.ready[+this.name.charAt(1)]++
													this.updateMatrix()
												}
											}
											
											return mesh;
										}
										return others;
									}
								}
								EnemyData.soldierA = {
									mesh: function() {
										var soldierA = soldierA_proto.clone(true)
										return soldierA;
									},
									DPS: 30,
									health: {full: 100},
									velocity: new THREE.Vector3(-50, 0, 0),
									raycs: {
										down: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 34)
										//left: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(-1, 0, 0), 0, 200),
										//right: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 200)
									},
									prev: {
										pos: new THREE.Vector3()
									},
									landed: false,
									ondmg: function(src, data) {
										this.health.HP -= src.DPS;
										this.health.mesh.scale.y = this.health.HP/this.health.full<1/100?1/100:this.health.HP/this.health.full
										if (this.health.HP <= 0) {
											this.ondeath(data)
											this.action.death.on = true
											return;
										}

										this.health.prev = data.time;
										this.health.mesh.material.color = new THREE.Color('red')
									},
									update_game: function(data) {
										//	@soldier
										var g = -1100
										var intersections
										var airborne = true
										if (this.action.death.on) {
											this.action.death.update_game(this, data)
											return;
										}
										if (!this.active && this.spawnable && this.location.distanceTo(data.player.position)<300) {
											this.action.respawn.update_game(this, data)
										} else if (!this.active && this.location.distanceTo(data.player.position)>=600) this.spawnable = true;
										if ((data.player.dead && data.player.game.elapsed-data.player.dead>3) || (!data.player.dead && data.player.position.distanceTo(this.position)>800)) {
											this.action.death.update_game(this, data)
											this.ondeath(data)
										}
										
										if (!this.active) return;
									
										
										this.velocity.y += g * data.delta

										this.raycs.down.ray.origin.copy(this.position)
										intersections = this.raycs.down.intersectObjects(data.scene.children)
										for (var i=0 ; i<intersections.length ; i++) {
											if (intersections[i].object.purpose === 'surface') {
												airborne = false
												this.prev.pos.copy(this.position)
												this.velocity.y = 0
												this.position.y = intersections[i].point.y + this.raycs.down.far
												this.landed = true
												break;
											}
										}
										if (this.landed && !this.action.attack.on) {
											if (data.player.position.y<=this.position.y && Math.abs(data.player.position.x-this.position.x)<=200 && Math.abs(data.player.position.y-this.position.y)<50) {
												this.action.attack.on = true
											}
										}
										if (airborne && this.landed) {
											this.position.copy(this.prev.pos)
											this.velocity.y = 0
										}
										if (this.action.attack.on) this.action.attack.update_game(this, data, airborne)
										else if (this.action.walk.on && this.landed) this.action.walk.update_game(this, data, airborne)
										this.position.y += this.velocity.y * data.delta
													
										if (data.time - this.health.prev > .75) {
											if (this.health.mesh.scale.y > 0.5) this.health.mesh.material.color.set(new THREE.Color('darkgreen'));
											else if (this.health.mesh.scale.y > 0.2) this.health.mesh.material.color.set(0xffff00);
											else this.health.mesh.material.color.set(0xff6600);
										}

										this.traverse(function(obj){obj.updateMatrix()})
									},
									action: {
										walk: {
											on: false,
											update_game: function(soldierA, data, airborne) {
												if (airborne) {
													soldierA.position.copy(soldierA.prev.pos)
													soldierA.velocity.y = 0
													soldierA.velocity.x *= -1
												}
												if (soldierA.velocity.x>0 && soldierA.parts.body.rotation.y<Math.PI/2) 
													soldierA.parts.body.rotation.y += 5 * Math.PI * data.delta
												else if (soldierA.velocity.x<0 && soldierA.parts.body.rotation.y>-Math.PI/2)
													soldierA.parts.body.rotation.y += -5 * Math.PI * data.delta
												soldierA.position.x += soldierA.velocity.x * data.delta
											}
										},
										attack: {
											reset: function() {
												this.start = undefined; this.on = false; this.turn.dir = undefined
												this.phase1.on = false; this.phase2.x0 = undefined
												this.phase2.on = false; this.phase2.x0 = undefined; this.phase2.start = undefined; this.phase2.stop = undefined
											},
											start: undefined,
											on: false,
											turn: {
												dir: undefined,
											},
											phase1: {
												on: false,
												x0: undefined
											},
											phase2: {
												on: false,
												x0: undefined,
												start: undefined,
												stop: undefined
											},
											update_game: function(soldierA, data, airborne) {
												var intersections;
												if (this.start === undefined) {
													if (this.turn.dir) {
														if (soldierA.parts.body.rotation.y !== this.turn.dir * Math.PI/2) soldierA.parts.body.rotation.y += +this.turn.dir * 10 * Math.PI/2 * data.delta
														if (Math.abs(soldierA.parts.body.rotation.y)>= Math.PI/2) {
															soldierA.parts.body.rotation.y = this.turn.dir * Math.PI/2
															soldierA.velocity.x = this.turn.dir * 400
															this.turn.dir = undefined
															this.turn.finish = undefined
															this.start = data.time
															this.phase1.x0 = soldierA.position.x
															this.phase1.on = true
															if (soldierA.parts.sword.rotation.x > -Math.PI * 7/18) soldierA.parts.sword.rotation.x += -Math.PI * data.delta
															if (soldierA.parts.right.rotation.y < Math.PI * 7/18) soldierA.parts.right.rotation.y += Math.PI * data.delta
															if (soldierA.parts.right.rotation.z > -Math.PI  * 7/18) soldierA.parts.right.rotation.z += -Math.PI * data.delta
														}
													} else if (Math.sign(soldierA.velocity.x) !== Math.sign(data.player.position.x-soldierA.position.x)) {
														this.turn.dir = Math.sign(data.player.position.x-soldierA.position.x)
													} else {
														soldierA.velocity.x = Math.sign(data.player.position.x-soldierA.position.x) * 400
														this.start = data.time
														this.phase1.x0 = soldierA.position.x
														this.phase1.on = true
													}

												} else if ( this.phase1.on && Math.abs(soldierA.parts.body.rotation.y)<Math.PI/2) {
													soldierA.parts.body.rotation.y += Math.sign(soldierA.velocity.x) * 10 * Math.PI/2 * data.delta
													if (soldierA.parts.sword.rotation.x > -Math.PI * 7/18) soldierA.parts.sword.rotation.x += - 3 * Math.PI * data.delta
													if (soldierA.parts.right.rotation.y < Math.PI * 7/18) soldierA.parts.right.rotation.y += 3 * Math.PI * data.delta
													if (soldierA.parts.right.rotation.z > -Math.PI * 7/18) soldierA.parts.right.rotation.z += -3 * Math.PI * data.delta
												} else if (data.time - this.start <=0.5 && this.phase1.on) {
													if (soldierA.parts.sword.rotation.x > -Math.PI * 7/18) soldierA.parts.sword.rotation.x += -3 * Math.PI * data.delta
													if (soldierA.parts.right.rotation.y < Math.PI * 7/18) soldierA.parts.right.rotation.y += 3 * Math.PI * data.delta
													if (soldierA.parts.right.rotation.z > -Math.PI * 7/18) soldierA.parts.right.rotation.z += -3 * Math.PI * data.delta
												} else if (data.time - this.start > 0.5 && this.phase1.on) {
													if (airborne) {
														soldierA.position.copy(soldierA.prev.pos)
														soldierA.velocity.y = 0
														soldierA.velocity.x = 0
														this.phase1.on = false
														this.phase2.on = true
														this.phase2.x0 = soldierA.position.x
														this.phase2.start = data.time
														this.turn.dir = Math.sign(data.player.position.x-soldierA.position.x)
														soldierA.parts.right.rotation.z = Math.PI/6; soldierA.parts.right.rotation.y = 0
														soldierA.parts.sword.rotation.x = 0
														
														return;
													}
													/*
													if (soldierA.velocity.x<0) {
														intersections = soldierA.raycs.left.intersectObject(data.player, true)
														if (intersections.length) {
															if (Math.abs(soldierA.position.x - intersections[0].point.x)<=60) {
																var current = intersections[0].object
																while (!current.ondmg) current = current.parent;
																if (current.ondmg(soldierA.parts.sword)) {
																	current.sfx.hit.pause()
																	current.sfx.hit.currentTime = 0
																	current.sfx.hit.play()
																}
															}
														}
													} else if (soldierA.velocity.x>0) {
														intersections = soldierA.raycs.right.intersectObject(data.player, true)
														if (intersections.length) {
															if (Math.abs(soldierA.position.x - intersections[0].point.x)<=60) {
																var current = intersections[0].object
																while (!current.ondmg) current = current.parent;
																if (current.ondmg(soldierA.parts.sword)) {
																	current.sfx.hit.pause()
																	current.sfx.hit.currentTime = 0
																	current.sfx.hit.play()
																}
															}
														}
													}
													*/
													soldierA.position.x += soldierA.velocity.x * data.delta
													soldierA.parts.body.rotation.order = "YXZ"
													if (soldierA.parts.right.rotation.z<Math.PI/3) soldierA.parts.right.rotation.z += 4 * Math.PI * data.delta
													if (soldierA.parts.body.rotation.x<Math.PI/9) soldierA.parts.body.rotation.x += 1/5 * Math.PI * data.delta
													
													
													if (Math.abs(soldierA.position.x - this.phase1.x0)>200) {
														soldierA.velocity.x = 0
														this.phase1.on = false
														this.phase1.x0 = undefined
														this.phase2.on = true
														this.phase2.x0 = soldierA.position.x
														this.phase2.start = data.time
														this.turn.dir = Math.sign(data.player.position.x-soldierA.position.x)
														
														
													}
												} else if (this.phase2.on) {
													
													if (data.time - this.phase2.start > 0.3 ) {
														if (soldierA.velocity.x === 0) {
															soldierA.velocity.x = 400 * this.turn.dir
															soldierA.parts.body.rotation.y = this.turn.dir * Math.PI/2
															soldierA.parts.right.rotation.z = -Math.PI/9; soldierA.parts.right.rotation.y = Math.PI * 5/6
															soldierA.parts.sword.rotation.x = 0;
															soldierA.parts.body.rotation.x = Math.PI/6
															this.turn.dir = undefined
														}
													}  
													if (airborne) {
														soldierA.position.copy(soldierA.prev.pos)
														soldierA.velocity.y = 0
														soldierA.velocity.x = Math.sign(soldierA.velocity.x) * 50
														this.phase2.on = false
														this.phase2.x0 = undefined
														this.phase2.start = undefined
														this.start = undefined
														this.on = false
														soldierA.parts.right.rotation.z = Math.PI/6; soldierA.parts.right.rotation.y = 0
														soldierA.parts.sword.rotation.x = 0
														soldierA.parts.body.rotation.x = 0
													}


													if (!this.phase2.stop) soldierA.position.x += soldierA.velocity.x * data.delta
													if (soldierA.velocity.x !== 0) {
														if (soldierA.parts.right.rotation.y > 0) soldierA.parts.right.rotation.y -= 2 * Math.PI * data.delta
														//if (soldierA.parts.right.rotation.z > -Math.PI / 3) soldierA.parts.right.rotation.z += - Math.PI * data.delta
													}
													
													if (this.phase2.x0 && Math.abs(soldierA.position.x - this.phase2.x0)>200) {
														this.phase2.x0 = undefined 
														soldierA.velocity.x = Math.sign(soldierA.velocity.x) * 50
														this.phase2.stop = data.time
													}
													if (this.phase2.stop && data.time - this.phase2.stop > 0.5) {
														this.phase2.stop = undefined; this.phase2.start = undefined
														this.phase2.on = false
														this.start = undefined; this.on = false
														
														soldierA.parts.right.rotation.z = Math.PI/6; soldierA.parts.right.rotation.y = 0
														soldierA.parts.sword.rotation.x = 0
														soldierA.parts.body.rotation.x = 0
													}
												}
											}
										},
										shield: {
											on: false,
											update_game: function(soldierA, data) {
												
											}
										},
										death: {
											on: false,
											update_game: function(soldierA, data) {
												soldierA.position.set(data.scene.bounds.left - 300, 0, 0)
												this.on = false
											}
										},
										respawn: {
											on: false,
											update_game: function(soldierA, data) {
												soldierA.spawnable = false
												soldierA.health.HP = soldierA.health.full
												soldierA.health.mesh.scale.set(1, 1, 1); soldierA.health.mesh.visible = true; soldierA.health.mesh.material.color = new THREE.Color('darkgreen')
												soldierA.scale.set(1, 1, 1)
												soldierA.visible = true
												soldierA.position.copy(soldierA.spawnPt)
												soldierA.traverse(function(obj){
													obj.active = true
												})
												
												soldierA.action.walk.on = true
												soldierA.parts.body.rotation.y = -Math.PI/2; soldierA.parts.body.rotation.x = 0
												//	soldierA.parts.shield.rotation.x = Math.PI/2
												soldierA.parts.right.rotation.z = Math.PI/6; soldierA.parts.right.rotation.y = 0
												//	soldierA.parts.left.rotation.z = -Math.PI/3
												soldierA.parts.left.rotation.y = -Math.PI/2
												soldierA.parts.sword.rotation.x = 0
												
												soldierA.landed = false
												
												soldierA.velocity.x = -50
												soldierA.action.death.on = false
												soldierA.action.attack.reset()
											}
										}
									},
									ondeath: function(data) {
										this.health.mesh.visible = false
										this.traverse(function(obj) {
											obj.active = false;
										})
									},
									sfx: undefined,
									setup: function(soldierA) {
										
										soldierA.parts = {
											body: soldierA.getObjectByName('soldierA_body'),
											right: soldierA.getObjectByName('soldierA_right'),
											left: soldierA.getObjectByName('soldierA_left'),
											foot: soldierA.getObjectByName('soldierA_foot'),
											eye: soldierA.getObjectByName('soldierA_eye'),
											shield: soldierA.getObjectByName('soldierA_shield'),
											sword: soldierA.getObjectByName('soldierA_sword')
										}
										soldierA.add(soldierA.getObjectByName('soldierA_body'))
										soldierA.parts.body.add(soldierA.getObjectByName('soldierA_right'))
										soldierA.parts.body.add(soldierA.getObjectByName('soldierA_left'))
										soldierA.parts.body.add(soldierA.getObjectByName('soldierA_foot'))
										soldierA.parts.body.add(soldierA.getObjectByName('soldierA_eye'))
										soldierA.parts.body.add(soldierA.getObjectByName('soldierA_shield'))
										soldierA.parts.body.add(soldierA.getObjectByName('soldierA_sword'))
										for (var c=0 ; c<soldierA.children.length ; c++)
											if (soldierA.children[c].name.substring(0, 8) !== 'soldierA')
												soldierA.remove(soldierA.children[c])
										soldierA.parts.right.position.x = -10
										soldierA.parts.right.add(soldierA.parts.sword)
										soldierA.parts.sword.position.x -= 20; soldierA.parts.sword.DPS = 50
										soldierA.parts.left.position.x = 10
										soldierA.parts.left.add(soldierA.parts.shield)
										soldierA.parts.shield.position.x = 20
										soldierA.parts.shield.shield = true
										soldierA.parts.shield.material.side = THREE.DoubleSide
										for (var p in soldierA.parts) soldierA.parts[p].matrixAutoUpdate = false
										
										soldierA.add(soldierA.health.mesh); soldierA.health.mesh.position.y = 40
										soldierA.position.set(level.bounds.left-300, 0, 0)
										soldierA.updateMatrix()
									},
									others: function(soldierA) {

									}
								}
								level.loadcheck++
							}
						)
					}
					function updateB(data) {
						if (level.loadcheck === level.loadcheck_max - 1) {
							var g_launcher = new G_Launcher(new THREE.Vector3(1100, 150, 0), new THREE.Vector3(1100, 150, 0))
							level.meshes.push(g_launcher)
							g_launcher = new G_Launcher(new THREE.Vector3(1300, 250, 0), new THREE.Vector3(1300, 250, 0))
							level.meshes.push(g_launcher)
							g_launcher = new G_Launcher(new THREE.Vector3(4000, -440, 0), new THREE.Vector3(4000, -440, 0))
							level.meshes.push(g_launcher)
							g_launcher = new G_Launcher(new THREE.Vector3(5100, -560, 0), new THREE.Vector3(5100, -560, 0))
							level.meshes.push(g_launcher)
							
							var soldierA = new SoldierA(new THREE.Vector3(1950, 350, 0), new THREE.Vector3(1950, 350, 0))
							level.meshes.push(soldierA)
							soldierA = new SoldierA(new THREE.Vector3(2250, 350, 0), new THREE.Vector3(2250, 350, 0))
							level.meshes.push(soldierA)
							soldierA = new SoldierA(new THREE.Vector3(2550, 350, 0), new THREE.Vector3(2550, 350, 0))
							level.meshes.push(soldierA)
							soldierA = new SoldierA(new THREE.Vector3(5750, -550, 0), new THREE.Vector3(5750, -550, 0))
							level.meshes.push(soldierA)
							soldierA = new SoldierA(new THREE.Vector3(5430, -990, 0), new THREE.Vector3(5430, -990, 0))
							level.meshes.push(soldierA)
							soldierA = new SoldierA(new THREE.Vector3(5700, -990, 0), new THREE.Vector3(5700, -990, 0))
							level.meshes.push(soldierA)
							soldierA = new SoldierA(new THREE.Vector3(5137, -1552, 0), new THREE.Vector3(5137, -1552, 0))
							level.meshes.push(soldierA)
							soldierA = new SoldierA(new THREE.Vector3(6700, -1400, 0), new THREE.Vector3(6700, -1400, 0))
							level.meshes.push(soldierA)
							
							
							var bird = new Bird(new THREE.Vector3(3360, 150, 0), new THREE.Vector3(3360, 150, 0), new THREE.Vector3(0, 100, 0))
							level.meshes.push(bird)
							bird = new Bird(new THREE.Vector3(3840, 150, 0), new THREE.Vector3(3840, 0, 0), new THREE.Vector3(100, 0, 0))
							level.meshes.push(bird)
							bird = new Bird(new THREE.Vector3(4150, -280, 0), new THREE.Vector3(4150, -280, 0), new THREE.Vector3(-100, 0, 0))
							level.meshes.push(bird)
							bird = new Bird(new THREE.Vector3(4575, -360, 0), new THREE.Vector3(4575, -360, 0), new THREE.Vector3(-100, 0, 0))
							level.meshes.push(bird)
							bird = new Bird(new THREE.Vector3(4575, -460, 0), new THREE.Vector3(4575, -460, 0), new THREE.Vector3(-100, 0, 0))
							level.meshes.push(bird)
							bird = new Bird(new THREE.Vector3(5340, -890, 0), new THREE.Vector3(5340, -890, 0), new THREE.Vector3(-100, 0, 0))
							level.meshes.push(bird)
							bird = new Bird(new THREE.Vector3(5675, -1521, 0), new THREE.Vector3(5675, -1521, 0), new THREE.Vector3(0, 100, 0))
							level.meshes.push(bird)
							bird = new Bird(new THREE.Vector3(5855, -1521, 0), new THREE.Vector3(5855, -1521, 0), new THREE.Vector3(0, 100, 0))
							level.meshes.push(bird)
							
							
							var directional = new THREE.DirectionalLight('white', .3)
							directional.position.set(0, 100, 150)
							level.meshes.push(directional)

							level.events.setup.on = false
							level.events.respawn.on = true
							level.loadcheck++
							level.meshloaded = true
							
							function SoldierA(loc, spawn) {
								var soldierA = new Enemy(EnemyData.soldierA)
								soldierA.location.copy(loc)
								soldierA.spawnPt.copy(spawn)
								soldierA.traverse(function(obj) {
									if (obj.purpose === 'healthbar') return;
									level.enemies.push(obj)
								})
								soldierA.position.set(level.bounds.left-300, 0, 0)
								return soldierA;
							}
							
							function G_Launcher(loc, spawn) {
								var g_launcher = new Enemy(EnemyData.grenade_launcher)
								g_launcher.location.copy(loc)
								g_launcher.spawnPt.copy(spawn)
								g_launcher.traverse(function(obj){
									if (obj.purpose === 'healthbar') return;
									level.enemies.push(obj)
								})
								for (var i=0 ; i<3 ; i++) {
									for (var j=0 ; j<g_launcher.others.proj['set'+i].length ; j++) {
										g_launcher.others.proj['set'+i][j].position.set(level.bounds.left - 300, 0, 0)
										g_launcher.others.proj['set'+i][j].updateMatrix()
										level.meshes.push(g_launcher.others.proj['set'+i][j])
										level.enemies.push(g_launcher.others.proj['set'+i][j])
									}
								}
								return g_launcher;
							}
							
							function Bird(loc, spawn, v0) {
								var bird = new Enemy(EnemyData.bird)
								bird.location.copy(loc)
								bird.spawnPt.copy(spawn)
								bird.v0.copy(v0)
								bird.traverse(function(obj){
									if (obj.purpose === 'healthbar') return;
									level.enemies.push(obj)
								})
								bird.position.set(level.bounds.left-300, 0, 0)
								return bird;
							}
						}
					}
				}
			},
			respawn: {
				on: true,
				start: undefined,
				spawnPt: new THREE.Vector3(0, 50, 0),
				update_game: function(data) {
					
					var ready = data.scene.getObjectByName('ready')
					if (document.getElementById('screen_changer').style.display!=='none') $('#screen_changer').fadeOut(250)
					
					if (this.start === undefined) {
						this.start = data.time
						
						data.scene.background = new THREE.Color('lightblue')
						//data.scene.background = new THREE.TextureLoader().load('../images/stage1a.jpg')
						
						$('#audio-background').empty()
						$('#audio-background').append('<source src="audio/theskiver.mp3" type="audio/mpeg" loop>')
						document.getElementById('audio-background').volume = .3
						document.getElementById('audio-background').currentTime = 0
						document.getElementById('audio-background').load()
						document.getElementById('audio-background').play()
						
						while (level.hearts.length < data.player.game.lives) level.hearts.push(level.hearts[0].clone(true))
						while (level.hearts.length > data.player.game.lives) data.scene.remove(level.hearts.pop())
						for (var i=0 ; i<level.hearts.length ; i++) data.scene.add(level.hearts[i])
						
						ready.visible = true
						ready.scale.set(1, 1, 1)
						ready.material.transparent = true
						ready.material.opacity = 0
						
						if (level.events.boss.on) {
							level.events.boss.on = false
							level.events.boss.engaged = false
							level.events.boss.start = undefined
							level.events.preboss.on = true
							//data.camera.position.set(4150, 850, 200)
							//data.player.position.set(4150, 850, 0)
							level.boss.action.spawn.update_game(level.boss, data)
							ready.scale.set(.5, .5, .5)
							ready.position.set(-ready.geometry.boundingSphere.radius*.5+4150, 875, 50)
							for (var enemy in level.enemies) if (level.enemies[enemy].ondeath) level.enemies[enemy].ondeath(data)
						} else {
							ready.position.set(-ready.geometry.boundingSphere.radius, 150, -data.camera.position.z/2)
							data.camera.position.set(0, 55, 200)
							data.player.position.copy(this.spawnPt)
						}
						
						data.scene.add(data.player)
						data.scene.add(data.player.charge1); data.scene.add(data.player.charge2)
						data.scene.add(data.player.game.health.mesh); data.player.game.health.mesh.position.y += 150; data.player.game.health.mesh.visible = true
						data.player.dead = null; data.player.game.health.HP = data.player.game.health.full;
						data.player.controls.enabled = false
						data.player.game.left = false; 
						if (data.player.animation) data.player.animation.stop_right()
						
						for (var enemy in level.enemies) if (level.enemies[enemy].ondeath && level.enemies[enemy]!==level.boss) level.enemies[enemy].ondeath(data)
						level.loaded = true
					} else if (data.time - this.start > 4) {
						
						data.player.game.health.mesh.visible = true
						//level.events.stage.on = true
						ready.material.opacity -= (0.1);
						if (ready.material.opacity < 0.1) {
							data.player.controls.enabled = true
							if (!level.events.preboss.on) level.events.stage.on = true
							ready.visible = false
							this.on = false
							this.start = undefined
						}
					} else if (data.time - this.start > 2) {
						if (data.camera.position.z < 300 && data.player) {
							data.camera.position.z += 2;
							ready.position.z += 2
							if (data.camera.position.y < 55) data.camera.position.y += .5;
						}
					} else if (data.time - this.start > 1) {
						ready.material.opacity += 0.05
					} 
					
					ready.updateMatrix()
					
				}
			},
			stage: {
				start: undefined,
				on: false,
				update_game: function(data) {

					if (data.camera.position.z < 300 && data.player) {
						data.camera.position.z += 2;
						if (data.camera.position.y < 55) data.camera.position.y += .5;
					}
					else if (data.player) {
						if (data.player.dead===null) {
			
							var dif = Math.abs(data.camera.position.x-data.player.position.x);

							if (dif>20) {
								data.camera.position.x = data.player.position.x + 20*(data.camera.position.x>data.player.position.x?1:-1);
								data.camera.position.x = Math.min(data.camera.position.x, data.scene.bounds.right);
								data.camera.position.x = Math.max(data.camera.position.x, data.scene.bounds.left+200);
							}
							dif = Math.abs(data.camera.position.y-data.player.position.y);
							if (dif>20) data.camera.position.y = data.player.position.y + 20*(data.camera.position.y>data.player.position.y?1:-1);
							data.camera.position.y = Math.max(data.camera.position.y, data.scene.bounds.bottom+200)
							data.camera.position.y = Math.min(data.camera.position.y, data.scene.bounds.top-200)
						}
					}
					
					if (level.flags.wall1 && data.player.position.x > 3180) {
						level.flags.wall1 = false
						data.scene.getObjectByName('wall1').visible = false
					} else if (!data.player.dead && data.player.position.x<=3180 && !level.flags.wall1) {
						level.flags.wall1 = true
						data.scene.getObjectByName('wall1').visible = true
					}
					if (data.player.position.x>3475 && data.player.position.y<380 + 33 && data.player.position.y>200+33) {
						data.scene.getObjectByName('collapse0').visible = false
					}
					if (false) {
						data.scene.getObjectByName('door1').action.close.on = true
						data.scene.getObjectByName('door1').action.open.on = false
						this.on = false
						this.start = undefined
						level.events.preboss.on = true
						boss.action.spawn.update_game(boss, data)
						for (var enemy in level.enemies) if (level.enemies[enemy].ondeath) level.enemies[enemy].ondeath(data)
					}
				}
			},
			preboss: {
				start: undefined,
				on: false
			},
			boss: {
				start: undefined,
				on: false
			}
		}
		
	})
	
	function newBlock (x, length, y, height, width) {
		var geometry = new THREE.BoxGeometry(length, height, width);
		var n = Math.random()
		var material = new THREE.MeshPhysicalMaterial({color: new THREE.Color((250 - Math.floor(160*n))/250, (250 - Math.floor(160*n))/250, (250 - Math.floor(160*n))/250)});
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x+length/2, y-height/2, 0);
		mesh.purpose = 'surface';
		mesh.matrixAutoUpdate = false; mesh.updateMatrix();
		return mesh;
	}

	function newCore(size) {
		var geometry = new THREE.Geometry();
		geometry.vertices.push(new THREE.Vector3(0, size*Math.sqrt(3)/4, 0),
													 new THREE.Vector3(-size/2, -size*Math.sqrt(3)/4, 0),
													 new THREE.Vector3(size/2, -size*Math.sqrt(3)/4, 0)
													)
		geometry.faces.push( new THREE.Face3(0, 1, 2));
		var material = new THREE.MeshBasicMaterial({color: new THREE.Color('red')});
		var mesh = new THREE.Mesh(geometry, material);
		mesh.name = 'core';
		return mesh;
	}

	function newSFX(src, vol, loop) {
		var audio = document.createElement('audio');
		var source = document.createElement('source');
		audio.preload = 'none';
		source.src = src;
		source.type = 'audio/wav';
		audio.appendChild(source);
		if (vol !== undefined) audio.volume = vol;
		if (loop !== undefined) audio.loop = true;
		return audio;
	};
})();