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
		this.respawn = false;
		this.stage = false;
		this.preboss = false;
		this.atboss = false;
		this.enemies = [];
		this.meshes = [];
		this.loaded = false;
		this.loadcheck = 0
		this.bounds = {left: -5000, right:10000, bottom: -200, top: 10000}
		var level = this;
		
		var fontLoader = new THREE.FontLoader();
		fontLoader.load(
			'../fonts/helvetiker_bold.typeface.json',
			function(response) {
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
					
					if (this.start === undefined) {
						
						ready.visible = true
						ready.scale.set(1, 1, 1)
						ready.material.transparent = true
						ready.material.opacity = 0
						ready.position.set(-ready.geometry.boundingSphere.radius, 150, -data.camera.position.z/2)
						
						data.camera.position.set(0, 55, 200)
						this.start = data.time
						data.scene.add(data.player)
						data.scene.add(data.player.game.health.mesh); data.player.game.health.mesh.position.y += 150
						data.player.position.copy(this.spawnPt)
						data.player.controls.enabled = false
					} else if (data.time - this.start > 4) {
						data.player.controls.enabled = true
						data.player.game.health.mesh.visible = true
						level.events.stage.on = true
						ready.material.opacity -= (0.1);
						if (ready.material.opacity < 0.1) {
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
					
					if ((3990<=data.player.position.x && data.player.position.x<=4360) && (800<data.player.position.y&&data.player.position.y<900)) {
						data.scene.getObjectByName('door1').action.close.on = true
						data.scene.getObjectByName('door1').action.open.on = false
						this.on = false
						this.start = undefined
						level.events.preboss.on = true
					}
				}
			},
			preboss: {
				on: false,
				update_game: function(data) {
					data.camera.position.y = 850;
					data.player.position.x = Math.max(3990, data.player.position.x)
					if (data.camera.position.x<=4150) data.camera.position.x += 3
					
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
					data.player.position.x = Math.max(4345, data.player.position.x)
					var boss = level.boss
					if (this.start === undefined) this.start = data.time
					else if (!this.engaged) {
						if (data.camera.position.y !== 875) data.camera.position.y += Math.round(1.5 * (data.camera.position.y>875?-1:1))
						if (data.camera.position.x<4575) data.camera.position.x += 3
						else {
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
								this.engaged = true
							}
						}

					}
					

				}
			}
		}
		this.update_game = function(data) {
			if (this.events.boss.on) this.events.boss.update_game(data) 
			if (this.events.preboss.on) this.events.preboss.update_game(data) 
			if (this.events.stage.on) this.events.stage.update_game(data) 
			if (this.events.respawn.on) this.events.respawn.update_game(data)

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
						if (this.health.HP <= 0) {this.ondeath(data); return;}
						
						this.health.mesh.scale
						this.health.prev = data.time;
						this.health.mesh.material.color = new THREE.Color('red')
					},
					update_game: function(data) {
						var core = this.getObjectByName('core')
						
						if (this.scale.x > 0.01) {
							if (core.scale.x > 0.01) core.scale.subScalar(.05)
							else {
								this.scale.subScalar(0.05)
								if (this.scale.x <= 0.01) this.position.x = data.scene.bounds.left - 300
							}
						}
						else if (!this.active && this.spawnable && this.location.distanceTo(data.player.position)<400) {
							this.health.mesh.visible = true
							this.health.HP = this.health.full
							this.health.mesh.material.color = new THREE.Color('darkgreen')
							this.spawnable = false;
							this.position.copy(this.spawnPt);
							this.traverse(function(obj) {
								obj.active = true;
							})
						} else if (!this.active && this.location.distanceTo(data.player.position)>=400) this.spawnable = true;
						if (data.player.dead || data.player.position.distanceTo(this.position)>800) {
							this.traverse(function(obj){obj.active = false;})
						}
						
						if (!this.active) return;
						
						this.scale.set(1, 1, 1);
						core.scale.set(1, 1, 1)
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
									
									proj.active = true;	
									this.timers.fire = data.time;
									break;
								}
							}
						}
					},
					ondeath: function(data) {
						this.health.mesh.visible = false
						//this.position.x = data.scene.bounds.left - 300;
						this.traverse(function(obj) {
							obj.active = false;
						})
						console.log('ondeath: dead')
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
				var turret4 = new Turret(new THREE.Vector3(3700, 750, 0))
				level.meshes.push(turret4)

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
							mid.visible = false
							if (top.position.distanceTo(top.originalpos)<50) top.position.y += 0.5
							if (mid.position.distanceTo(mid.originalpos)<22+50) mid.position.y -= 0.6
							if (bot.position.distanceTo(bot.originalpos)<22+50) bot.position.y -= 0.6
						} else {
							mid.action.open.on = false
							mid.opened = true
						}
					}
				},
				close: {	
					on: false,
					update_game: function(data) {
						if (top.position.distanceTo(mid.position)>25) {
							if (top.position.distanceTo(top.originalpos)>0) top.position.y -= 0.5
							if (mid.position.distanceTo(mid.originalpos)>0) mid.position.y += 0.6
							if (bot.position.distanceTo(bot.originalpos)>0) bot.position.y += 0.6
						} else if (mid.scale.y < 1) {
							mid.visible = true
							mid.scale.y += 0.05
						} else{
							mid.action.close.on = false
							mid.opened = false
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
				if (this.scale.x>.01) {
					if (core.scale.x>.01) core.scale.subScalar(0.03);
					else if (this.scale.x>.01) {
						this.scale.subScalar(0.05);
						if (this.scale.x <= 0.01) this.position.x = data.scene.bounds.left - 300;
					}
				}
				else if (!this.active && this.spawnable && this.location.distanceTo(data.player.position)<400-offset) {
					core.material.color = new THREE.Color('red')
					this.health.HP = this.health.full;
					this.health.mesh.visible = true;
					this.spawnable = false;
					this.position.copy(this.spawnPt);
					this.traverse(function(obj){
						obj.active = true;
					})
				}
				else if (!this.active && this.location.distanceTo(data.player.position)>400-offset) this.spawnable = true;
				
				if (data.player.dead || this.position.distanceTo(data.player.position)>800) this.active = false; 
				
				if (!this.active) return;
				core.rotation.z += .1;
				var diff = data.player.position.clone();
				core.scale.set(1, 1, 1);
				this.scale.set(1, 1, 1)
				diff.sub(this.position);
				diff.normalize();
				diff.multiplyScalar(75*data.delta)
				this.position.add(diff)

				var health = this.health
				health.mesh.scale.y = (health.HP/health.full<1/100?1/100:health.HP/health.full)
				if (health.HP<=0) this.ondeath();
				else if (data.time - health.prev > .3) {
					if (health.mesh.scale.y > 0.5) health.mesh.material.color.set(new THREE.Color('darkgreen'));
					else if (health.mesh.scale.y > 0.2) health.mesh.material.color.set(0xffff00);
					else health.mesh.material.color.set(0xff6600);
				}
			},
			ondeath: function() {
				this.traverse(function(obj) {
					obj.active = false;
				})
				this.health.mesh.visible = false;
				this.getObjectByName('core').material.color = new THREE.Color('pink')
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
			velocity: new THREE.Vector3(),
			DPS: 40,
			health: {full: 1},
			setup: function() {
				this.velocity.x = -100;
			},
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
							obj.scale.x *= 0.99;
							obj.velocity.x = 0;
						} else if (data.time - this.start < 6) {
							obj.scale.x = 1.5
							obj.velocity.x = 500 * obj.raycs.detect.ray.direction.x
						} else {
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
					mesh.action = {
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
									shot.position.x = Math.min(4800, shot.position.x); shot.position.x = Math.max(4350, shot.position.x)
									shot.position.y = Math.min(1000, shot.position.y); shot.position.y = Math.max(750, shot.position.y)
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
						
						mesh.updateMatrix()
					}
					
					return mesh;
				}
				
				return mesh;
			},
			health: {full: 750},
			active: false,
			DPS: 35,
			velocity: new THREE.Vector3(),
			ondmg: function(src, data) {
				this.health.HP -= src.DPS;
				if (this.health.HP <= 0) {this.ondeath(data); return;}

				this.health.mesh.scale
				this.health.prev = data.time;
				this.health.mesh.material.color = new THREE.Color('red')
			},
			setup: function(boss) {
				boss.traverse(function(obj){
					if (obj.name.substring(0, 4) === 'shot') obj.src = boss;
				})
			},
			update_game: function(data) {
				boss.health.mesh.position.copy(this.position);
				boss.health.mesh.position.y += 33
				var core = this.core	
				core.position.copy(this.position)
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
			action: {
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
			},
			ondeath: function(data) {
				this.health.mesh.visible = false;
			},
		}
		
		var boss = new Enemy(EnemyData.boss1);
		boss.traverse(function(obj){level.enemies.push(obj)})
		boss.position.set(4700, 940, 0)
		boss.scale.multiplyScalar(0.5)
		boss.core = boss.getObjectByName('core')
		boss.core.name = 'bosscore'; boss.core.scale.set(1.5, 1.5, 1.5); boss.core.rotation.z = Math.PI; boss.core.visible = false
		boss.add(boss.health.mesh); boss.health.mesh.scale.y = 2; boss.health.mesh.visible = false
		this.boss = boss;
		this.meshes.push(boss)
		this.meshes.push(boss.core)
		this.meshes.push(boss.health.mesh)
		
		
		this.loadcheck++;
		if (this.loadcheck === 3) this.loaded = true;
		
		function newBlock (x, length, y, height, width) {
			var geometry = new THREE.BoxGeometry(length, height, width);
			var material = new THREE.MeshStandardMaterial({color: new THREE.Color('grey')});
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
		
	})
})();