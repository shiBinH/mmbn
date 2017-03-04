var X = {
	Player: null,
	Weapon: {
		Buster: null,
		Charge1: null,
		Charge2: null,
		Saber: null,
		glow: null
	}
};

(function() {
	//	chargeshot1
	var loader = new THREE.ColladaLoader();
	var customMaterial = new THREE.ShaderMaterial( 
	{
			uniforms: 
		{ 
			"c":   { type: "f", value: 1.0 },
			"p":   { type: "f", value: 1.5 },
			glowColor: { type: "c", value: new THREE.Color(0x00cf6a) },
			viewVector: { type: "v3", value: new THREE.Vector3(0, 100, 350)/*camera.position*/ }
		},
		vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
		side: THREE.FrontSide,
		blending: THREE.AdditiveBlending,
		transparent: true
	}   ); 
	loader.load(
		'collada/charge1.dae',
		function(collada) {
			
			var mesh = collada.scene.children[0];
			
			X.Weapon.Charge1 = function(player) {
				var charge1 = mesh.clone(true);
				var geometry = collada.dae.geometries['charg1-mesh'].mesh.geometry3js;
				var glow = new THREE.Mesh(geometry, customMaterial);
				glow.scale.multiplyScalar(1.3);
				charge1.add(glow)
				charge1.purpose = 'projectile';
				charge1.source = player.socket;
				charge1.DPS = 30;
				charge1.velocity = getVel(player, 100);
				charge1.active = true;
				if (charge1.velocity.x < 0) charge1.rotateZ(Math.PI)
				charge1.position.copy(getPos(player, 1));
				charge1.raycasters = [new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(charge1.velocity.x<0?-1:1, 0, 0), 0, 15),
													 new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(charge1.velocity.x<0?-1:1, 0, 0), 0, 15)
													];
				charge1.raycasters[0].offsets = [-3*(charge1.velocity.x<0?-1:1), 5, 0]; charge1.raycasters[1].offsets = [-3*(charge1.velocity.x<0?-1:1), -5, 0];
				charge1.update_game = function(data) {
					if (!charge1.active) return;
					if (charge1.position.x>data.scene.bounds.right+500) {
						charge1.position.copy(getPos(player), 1);
						charge1.velocity = getVel(player, 100);
						if (charge1.velocity.x < 0) charge1.rotation.z = -Math.PI/2;
						else charge1.rotation.z = Math.PI/2;
					}
					else charge1.position.x += charge1.velocity.x * data.delta;
					for (var ray in charge1.raycasters) {
						charge1.raycasters[ray].ray.origin.copy(charge1.position)
						charge1.raycasters[ray].ray.origin.x+=charge1.raycasters[ray].offsets[0]; charge1.raycasters[ray].ray.origin.y+=charge1.raycasters[ray].offsets[1]; charge1.raycasters[ray].ray.origin.z+=charge1.raycasters[ray].offsets[2];
						var intersections = charge1.raycasters[ray].intersectObjects(data.scene.children, true);
						for (var obj=0 ; obj<intersections.length ; obj++) {
							var intersected = intersections[obj];
							if (intersected.object.purpose !== 'surface') {
								var current = intersections[obj].object;
								if (hitPlayer(current, charge1) === -1) {
									charge1.position.x = data.scene.bounds.right+600;
									charge1.active = false;
									return;
								}
							} else {
								charge1.active = false;
								charge1.position.x = data.scene.bounds.right+600;
								return;
							}
						}

						if (charge1.position.x<data.scene.bounds.left || charge1.position.x>data.scene.bounds.right) {
							charge1.position.x = data.scene.bounds.right+600;
							charge1.active = false;
							return;
						}
					}
				};
				charge1.sfx = {
					'hit': newSFX('audio/hit.wav', .15),
					'fire': newSFX('audio/charge1.wav', 0.2)
				};
				return charge1;
			};
			
			var charge2Mat = customMaterial.clone(true);
			charge2Mat.uniforms.glowColor.value = new THREE.Color(0x002fff)
			X.Weapon.Charge2 = function(player) {
				var charge2 = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 16), new THREE.MeshToonMaterial({color: new THREE.Color(0x00E2FF)}));
				var geometry = collada.dae.geometries['charge2-mesh'].mesh.geometry3js;
				var n = 0;
				
				var glow = new THREE.Mesh(geometry, charge2Mat);
				glow.scale.set(19, 19, 19)
				charge2.add(glow)
				charge2.purpose = 'projectile';
				charge2.source = player.socket;
				charge2.DPS = 50;
				charge2.velocity = getVel(player, 250);
				charge2.rotation.z = Math.PI/-2
				if (charge2.velocity.x < 0) charge2.rotateZ(Math.PI)
				charge2.position.copy(getPos(player));
				charge2.raycasters = [new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(charge2.velocity.x<0?-1:1, 0, 0), 0, 32),
													 new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(charge2.velocity.x<0?-1:1, 0, 0), 0, 32)
													];
				charge2.raycasters[0].offsets = [-16*(charge2.velocity.x<0?-1:1), 15, 0]; charge2.raycasters[1].offsets = [-16*(charge2.velocity.x<0?-1:1), -15, 0];
				charge2.active = true;
				charge2.update_game = function(data) {
					if (!charge2.active) return;
					var offset = Math.sin(n);
					n += 0.1;
					glow.scale.set(19, 19+Math.sin(n), 19);
					
					if (charge2.position.x>data.scene.bounds.right+500) {
						charge2.position.copy(getPos(player), 2);
						charge2.velocity = getVel(player, 250);
						if (charge2.velocity.x < 0) charge2.rotation.z = Math.PI/2;
						else charge2.rotation.z = -Math.PI/2;
					}
					else charge2.position.x += charge2.velocity.x * data.delta;
					for (var ray in charge2.raycasters) {
						charge2.raycasters[ray].ray.origin.copy(charge2.position)
						charge2.raycasters[ray].ray.origin.x+=charge2.raycasters[ray].offsets[0]; charge2.raycasters[ray].ray.origin.y+=charge2.raycasters[ray].offsets[1]; charge2.raycasters[ray].ray.origin.z+=charge2.raycasters[ray].offsets[2];
						var intersections = charge2.raycasters[ray].intersectObjects(data.scene.children, true);
						for (var obj=0 ; obj<intersections.length ; obj++) {
							var intersected = intersections[obj];
							if (intersected.object.purpose !== 'surface') {
								var current = intersections[obj].object;
								if (hitPlayer(current, charge2) === -1) {
									charge2.position.x = data.scene.bounds.right+600;
									charge2.active = false;
									return;
								}
							} else {
								charge2.active = false;
								charge2.position.x = data.scene.bounds.right+600;
								return;
							}
						}
						if (charge2.position.x<data.scene.bounds.left || charge2.position.x>data.scene.bounds.right) {
							charge2.position.x = data.scene.bounds.right+600;
							charge2.active = false;
							return;
						}
					}
				};
				charge2.sfx = {
					fire: newSFX('audio/charge2.wav', .2),
					hit: newSFX('audio/charge2_hit.wav', .2)
				};
				return charge2;
			};
			
			/*
			console.log(collada)
			var blade_mat = customMaterial.clone(true);
			blade_mat.uniforms.c.value = 0.6; blade_mat.uniforms.p.value = 6;
			blade_mat.uniforms.glowColor.value = new THREE.Color('yellow');
			blade_mat.side = THREE.BackSide;
			var blade_glow = new THREE.Mesh(collada.dae.geometries['saber_blade-mesh'].mesh.geometry3js, blade_mat);
			X.Weapon.Saber = collada.scene.children[2];
			X.Weapon.glow = blade_glow;
			*/
		}
	)
	
	
	X.Player = function(name, controls) {
		var player = new THREE.Group();
		Player.call(player, name, controls);
		return player;
	};

	function Player(name, controls) {
		this.keysMap = {};
		this.name = name;
		this.socket = null;
		this.name_Group = new THREE.Group();
		this.purpose = 'player';
		this.dead = null;
		this.velocity = new THREE.Vector3();
		this.controls = controls;
		this.bounds = {
			rightUp: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0, 13),
			leftUp: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0, 13),
			midRight: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 12),
			midLeft: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(-1, 0, 0), 0, 12),
			botRight: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 12),
			botLeft: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(-1, 0, 0), 0, 12),
			rightFoot: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 33),
			leftFoot: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 33),
		};
		this.bounds.rightFoot.y = 33;
		this.bounds.leftFoot.y = 33;
		this.game = {
			player: this,
			airborne: false,
			onWall: false,
			left: false,
			dashing: false,
			can_dash: true,
			dashJ: false,
			clock: new THREE.Clock(),
			can_jump: true,
			isAirborne: function(scene) {
				this.player.bounds.rightFoot.ray.origin.copy(this.player.position);
				this.player.bounds.rightFoot.ray.origin.x += 7;
				//this.player.bounds.rightFoot.ray.origin.y += -20
				var intersections = this.player.bounds.rightFoot.intersectObjects(scene.children);
				for (var obj=0 ; obj<intersections.length ; obj++) {
					if (intersections[obj].object.purpose === 'surface' && this.player.velocity.y<=0) return false;
				}
				this.player.bounds.leftFoot.ray.origin.copy(this.player.position);
				this.player.bounds.leftFoot.ray.origin.x += -7;
				//this.player.bounds.leftFoot.ray.origin.y += -20
				var intersections = this.player.bounds.leftFoot.intersectObjects(scene.children);
				for (var obj=0 ; obj<intersections.length ; obj++) {
					if (intersections[obj].object.purpose === 'surface' && this.player.velocity.y<=0) return false;
				}
				return true;
			},
			dash_prev: 0,
			tap: {
				L: {prev: 0, check: false},
				R: {prev: 0, check: false}
			},
			tap_dashing: false,
			latch_time: 0,
			wJump_cast: null,
			can_wJump: false,
			wJump_timer: 0,
			sliding: false,
			flinch: {
				min: 20,
				timer: 0,
				vx: 0,
				vy: 0
			},
			health: {
				full: 200,
				HP: 200,
				mesh: (function(player) {
								var geometry = geometry = new THREE.CylinderGeometry(2, 2, 25);
								var material = new THREE.MeshLambertMaterial({color: new THREE.Color('green')})
								var mesh = new THREE.Mesh(geometry, material);
								mesh.rotateZ(Math.PI/2);
								mesh.purpose = 'healthbar';
								mesh.name = 'healthbar';
								mesh.origin = player.name
								return mesh;
							 })(this),
				prev: 0,
				next: 200
			},
			fire: {
				timer: null,
				able: true
			},
			dmg_from: null
		};
		
		this.action = {
			player: this,
			flinch: function(time, dir) {
				this.player.game.flinch.vy = 500;
				this.player.game.flinch.vx = 300 * dir;
				this.player.game.flinch.timer = time;
				this.player.game.flinch.status = true;
			}
		};
		
		this.sfx = {
			'death': newSFX('audio/death.wav', 0.15),
			'jump': newSFX('audio/jump.wav', .5),
			'land': newSFX('audio/land.wav', .4),
			'dash': newSFX('audio/dash.wav'),
			'dash_wJump': newSFX('audio/dash_wJump.wav', .08),
			'charging_up': newSFX('audio/charging_up.wav', .05),
			'charging_done': newSFX('audio/charging_done.wav', .05)
		};
		this.charge1 = null;
		this.charge2 = null;
		

		init(this);
		function init(outer) {
			var clips = {};

			var lengths = {
				l1: 5, l2: 7.5,	//	neck, body
				l3: 4.5, l4: 6, l5: 6,	//	shoulder, arm, forearm
				l6: 5, l7: 10	//	knee, shin
			};
			var offsets = {
				jump: 2*-1.5,
				fall: 2*-1.45,
				run: 2*-1.5,
				shoot_stand: 2*1.6,
				dash: 2*1.5,
				slide: 2*-1.60,
				wall_jump: 2*-1.6
			}
			var bones = [];
			for (var i=0 ; i<15 ; i++) bones.push(new THREE.Bone());
			var loader = new THREE.ColladaLoader();
			loader.load(
				'collada/collection.dae',
				function(collada) {
					mesh = collada.scene.children[1];
					mesh.scale.multiplyScalar(2);
					bones[1].add(mesh)


					mesh = collada.scene.children[3];
					mesh.scale.multiplyScalar(2);
					mesh.translateZ(-5)
					var clone = bones[3].clone(true);
					clone.children[0].add(mesh)
					clone.visible = false;
					clone.children[1].material = new THREE.MeshStandardMaterial({color: 0x00A3FF});
					clone.children[1].position.y = -6;
					clone.name = 'clone'
					clone.timer = new THREE.Clock();
					bones[0].add(clone)	
		/*
					mesh = collada.scene.children[3];
					mesh.scale.multiplyScalar(2);
					mesh.translateZ(-5)
					//bones[4].add(mesh)
					var clone = bones[6].clone(true);
					clone.children[0].add(mesh)
					clone.visible = false;
					clone.children[1].material = new THREE.MeshBasicMaterial({color: 0x00A3FF});
					clone.children[1].position.y = -6;
					clone.name = 'clone'
					clone.timer = new THREE.Clock();
					bones[0].add(clone)	*/

					mesh = collada.scene.children[0];
					mesh.scale.multiplyScalar(2)
					mesh.translateZ(-3.5)
					bones[0].add(mesh)

					mesh = collada.scene.children[0]
					mesh.scale.multiplyScalar(2);
					mesh.translateY(-2)
					bones[11].add(mesh);
					bones[14].add(mesh.clone(true))

					mesh = collada.scene.children[0]
					mesh.scale.multiplyScalar(2);
					mesh.translateZ(-5.5)
					bones[10].add(mesh);
					bones[13].add(mesh.clone(true))

					var mixer, clip, action;

					mixer = new THREE.AnimationMixer(outer);

					clip = A.x.stop_right;
					clips['stop_right'] = clip;
					action = mixer.clipAction(clip);
					action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true;
					clip = A.x.stop_left
					clips['stop_left'] = clip;
					action = mixer.clipAction(clip);
					action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true;
					clip = A.x.run;
					clips['run'] = clip;
					action = mixer.clipAction(clip);
					action.setLoop(THREE.LoopRepeat); action.clampWhenFinished = true;
					clip = A.x.jump;
					clips['jump'] = clip;
					action = mixer.clipAction(clip);
					action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true;
					clip = A.x.fall
					clips['fall'] = clip;
					action = mixer.clipAction(clip);
					action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true;
					clip = A.x.shoot_stand;
					clips['shoot_stand'] = clip;
					action = mixer.clipAction(clip);
					action.setLoop(THREE.LoopOnce); action.clampWhenFinished = false;
					clip = A.x.dash;
					clips['dash'] = clip;
					action = mixer.clipAction(clip)
					action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true;
					clip = A.x.slide;
					clips['slide'] = clip;
					action = mixer.clipAction(clip)
					action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true;
					clip = A.x.wall_jump;
					clips['wall_jump'] = clip;
					action = mixer.clipAction(clip)
					action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true;
					clip = A.x.j1;
					clips['j1'] = clip;
					action = mixer.clipAction(clip);
					action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true;

					outer.animation = {
						update: function(delta) {
							mixer.update(delta)
							if (!mixer.existingAction(clips['dash']).isRunning()) outer.bones.body.position.y = 0;
							var arm_buster = outer.bones.body.getObjectByName('clone');
							clone.rotation.x = (Math.PI/-2)
							clone.rotation.y = outer.bones.body.rotation.z-.05;
							if (outer.game.sliding|| mixer.existingAction(clips['stop_left']).isRunning()) clone.rotation.z = .92 + -Math.PI/2;
							else clone.rotation.z = -outer.bones.body.rotation.y + Math.PI/2
							if (clone.timer.getElapsedTime()>.4) {
								clone.visible = false;
								outer.bones.r_shoulder.visible = true;
							}
						},
						turn_right: function() {
							outer.rotation.y = 0;
							outer.charge.group.rotation.y = 0
						},
						turn_left: function() {
							if (outer.velocity.y <= 0) outer.rotation.y = offsets.fall;
							if (outer.game.onWall) outer.rotation.y = offsets.slide;
							if (outer.game.airborne) outer.rotation.y = offsets.jump;
							outer.charge.group.rotation.y = -outer.rotation.y

						},
						stop_right: function() {
							outer.rotation.y = 0;
							mixer.stopAllAction();
							action = mixer.existingAction(clips['stop_right']);
							action.play();
							action.reset();
						},
						stop_left: function() {
							outer.rotation.y = 0;
							outer.charge.group.rotation.y = 8 * Math.PI/180
							mixer.stopAllAction();
							action = mixer.existingAction(clips['stop_left']);
							action.play();
							action.reset();
						},
						run: function() {
							outer.rotation.y = outer.game.left ? offsets.run : 0;
							outer.charge.group.rotation.y = -outer.rotation.y
							action = mixer.existingAction(clips['run']);
							if (action.isRunning() || outer.game.airborne) return;
							mixer.stopAllAction();
							action.play(); action.reset();
						},
						jump: function() {
							outer.rotation.y = outer.game.left ? offsets.jump : 0;
							outer.charge.group.rotation.y = -outer.rotation.y
							action = mixer.existingAction(clips['jump']);
							mixer.stopAllAction();
							action.play(); action.reset();
						},
						fall: function() {
							outer.rotation.y = outer.game.left? offsets.fall : 0;
							outer.charge.group.rotation.y = -outer.rotation.y
							action = mixer.existingAction(clips['fall']);
							mixer.stopAllAction();
							action.play(); action.reset();
						},
						fire: function() {
							outer.bones.r_shoulder.visible = false;
							clone = outer.bones.body.getObjectByName('clone');
							clone.visible = true;
							clone.timer.start();
						},
						dash: function() {
							outer.rotation.y = (outer.game.left ? offsets.dash : 0);
							outer.charge.group.rotation.y = -outer.rotation.y
							action = mixer.existingAction(clips['dash']);
							if (action.isRunning()) return;
							mixer.stopAllAction();
							action.play(); action.reset();
						},
						slide: function() {
							action = mixer.existingAction(clips['slide']);
							if (action.isRunning()) return;
							mixer.stopAllAction();
							action.play(); action.reset();
						},
						wall_jump: function() {
							outer.rotation.y = outer.game.left? offsets.wall_jump : 0;
							action = mixer.existingAction(clips['wall_jump']);
							mixer.stopAllAction();
							action.play(); action.reset();
						},
						j1: function() {
							action = mixer.existingAction(clips['j1']);
							mixer.stopAllAction();
							action.play(); action.reset()
						}
					}
				}
			)
			outer.bones = {
				body: bones[0], head: bones[1], pelvis: bones[2],
				r_shoulder: bones[3], r_elbow: bones[4], r_hand:bones[5],
				l_shoulder: bones[6], l_elbow: bones[7], l_hand: bones[8],
				r_leg: bones[9], r_knee: bones[10], r_ankle: bones[11],
				l_leg: bones[12], l_knee: bones[13], l_ankle: bones[14]
			}
			var bone_names = Object.keys(outer.bones);
			for (var i=0 ; i<bone_names.length ; i++) {
				outer.bones[bone_names[i]].name = bone_names[i];
			}

			var geometry, material, mesh, skeleton;
			bones[0].add(bones[1]); bones[0].add(bones[2]);
			bones[1].position.y = lengths.l1;
			bones[2].position.y = -lengths.l2;

			bones[3].add(bones[4]); bones[4].add(bones[5]);
			bones[3].position.y += (lengths.l4+lengths.l5)/2;
			bones[4].position.y = -lengths.l4;
			bones[5].position.y = -lengths.l5;
			geometry = new THREE.CylinderGeometry(1.25, 1.25, lengths.l4+lengths.l5, 10, 2);
			for (var i=0 ; i<geometry.vertices.length ; i++) {
				if (i<10 || i===30) {
					geometry.skinIndices.push(new THREE.Vector4(0, 1, 2, 0));
					geometry.skinWeights.push(new THREE.Vector4(1, 0, 0, 0));
				} else if (i<20) {
					geometry.skinIndices.push(new THREE.Vector4(0, 1, 2, 0));
					geometry.skinWeights.push(new THREE.Vector4(0, 1, 0, 0));
				} else {
					geometry.skinIndices.push(new THREE.Vector4(0, 1, 2, 0));
					geometry.skinWeights.push(new THREE.Vector4(0, 0, 1, 0));
				}
			}
			mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial({skinning: true, color: 0x00A3FF}))
			skeleton = new THREE.Skeleton([bones[3], bones[4], bones[5]]); 
			mesh.add(bones[3])
			mesh.bind(skeleton);
			bones[3].position.x = -lengths.l3;
			bones[3].add(mesh)
			bones[0].add(bones[3]);

			bones[6].add(bones[7]); bones[7].add(bones[8]);
			bones[6].position.y += (lengths.l4+lengths.l5)/2;
			bones[7].position.y = -lengths.l4;
			bones[8].position.y = -lengths.l5;
			geometry = geometry.clone(true);
			mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial({skinning: true, color: 0x00A3FF}));
			skeleton = new THREE.Skeleton([bones[6], bones[7], bones[8]]);
			mesh.add(bones[6]);
			mesh.bind(skeleton);
			bones[6].position.x = lengths.l3;
			bones[6].add(mesh)
			bones[0].add(bones[6])

			bones[9].add(bones[10]); bones[10].add(bones[11]);
			bones[9].position.y += (lengths.l6+lengths.l7)/2;
			bones[10].position.y = -lengths.l6;
			bones[11].position.y = -lengths.l7;
			geometry = new THREE.CylinderGeometry(1.25, 1.25, 15, 10, 3);
			for (var i=0 ; i<geometry.vertices.length ; i++) {
				if (i<10 || i==40) {
					geometry.skinIndices.push(new THREE.Vector4(0, 1, 2, 0));
					geometry.skinWeights.push(new THREE.Vector4(1, 0, 0, 0));
				} else if (i>=10 && i<30) {
					geometry.skinIndices.push(new THREE.Vector4(0, 1, 2, 0));
					geometry.skinWeights.push(new THREE.Vector4(0, 1, 0, 0));
				} else {
					geometry.skinIndices.push(new THREE.Vector4(0, 1, 2, 0));
					geometry.skinWeights.push(new THREE.Vector4(0, 0, 1, 0));
				}
			}
			mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial({skinning: true, color: 0x00A3FF}));
			skeleton = new THREE.Skeleton([bones[9], bones[10], bones[11]]);
			mesh.add(bones[9]);
			mesh.bind(skeleton);
			bones[9].add(mesh)
			bones[2].add(bones[9]);
			bones[9].position.y = 0;


			bones[12].add(bones[13]); bones[13].add(bones[14]);
			bones[12].position.y += (lengths.l6+lengths.l7)/2;
			bones[13].position.y = -lengths.l6;
			bones[14].position.y = -lengths.l7;
			geometry = geometry.clone(true);
			mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial({skinning: true, color: 0x00A3FF}));
			skeleton = new THREE.Skeleton([bones[12], bones[13], bones[14]]);
			mesh.add(bones[12]);
			mesh.bind(skeleton);
			bones[12].add(mesh)
			bones[2].add(bones[12]);
			bones[12].position.y = 0;

			bones[3].position.y = bones[6].position.y = 0;
			bones[1].position.y -= 1;

			outer.add(bones[0])
			outer.scale.multiplyScalar(1.5)
			
			geometry = new THREE.SphereGeometry(1, 32, 16);
			material = customMaterial.clone(true);
			material.uniforms.glowColor.value = new THREE.Color(0x40ff00);
			material.uniforms['c'].value = 1;
			material.uniforms['p'].value = 2.7;
			mesh = new THREE.Mesh(geometry, material);
			mesh.position.y -= 2
			outer.charge = {};
			outer.charge.group = new THREE.Group();
			outer.charge.group.add(mesh)
			outer.charge.a = mesh;
			outer.add(outer.charge.group);
			geometry = new THREE.SphereGeometry(1, 32, 16);
			material = customMaterial.clone(true);
			material.uniforms.glowColor.value = new THREE.Color(0x00e3ff);
			material.uniforms['c'].value = 1;
			material.uniforms['p'].value = 2.7;
			mesh = new THREE.Mesh(geometry, material);
			mesh.position.y -= 2;
			outer.charge.group.add(mesh)
			outer.charge.b = mesh;
			
			var fontLoader = new THREE.FontLoader();
			fontLoader.load(
				'../fonts/helvetiker_bold.typeface.json',
				function(response) {
					var textGeometry = new THREE.TextGeometry(outer.name, {font: response, size: 4, height: 0});
					textGeometry.computeBoundingSphere();
					outer.name_Group.add(new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({color:new THREE.Color('green')})));
				}
			)
		}

	}
	
	
	//	buster
	X.Weapon.Buster = function(player) {
		var time = player.game.clock.getElapsedTime();
		var proto = Object.getPrototypeOf(this);
		if (!proto.prev[player.name]) proto.prev[player.name] = 0;
		if (time-proto.prev[player.name]<.175) return null;
		this.purpose = 'projectile';
		this.source = player.socket;
		this.DPS = 5;
		THREE.Mesh.call(this, new THREE.SphereGeometry(4),new THREE.MeshBasicMaterial({color: new THREE.Color(0xffc266)}));
		
		this.velocity = getVel(player);
		this.position.copy(getPos(player, 1))
		this.raycaster = new THREE.Raycaster(new THREE.Vector3(),
																				 new THREE.Vector3(this.velocity.x<0?-1:1, 0, 0),
																				 0, 12
																				)
		proto.prev[player.name] = time;
		this.sfx = {
			'fire': newSFX('audio/buster.wav', .1),
			'hit': newSFX('audio/hit.wav', .15)
		};
	};
	X.Weapon.Buster.prototype = new THREE.Mesh();
	X.Weapon.Buster.prototype.prev = {};
	X.Weapon.Buster.prototype.update_game = function(data) {
		this.position.x += this.velocity.x * data.delta;
		this.raycaster.ray.origin.copy(this.position);
		var intersections = this.raycaster.intersectObjects(data.scene.children, true);
		for (var obj=0 ; obj<intersections.length ; obj++) {
			if (intersections[obj].object.purpose === 'surface') {
				return -1;
			} else {
				var current = intersections[obj].object;
				if (hitPlayer(current, this)) return -1;
			}
		}
		if (this.position.x<data.scene.bounds.left || this.position.x>data.scene.bounds.right) {
			return -1;
		}
	};
	
	function getPos(player, n) {
		var rx = player.bones.r_shoulder.getWorldPosition().x;
		if ((player.game.left&&!player.game.sliding) || (!player.game.left&&player.game.sliding)) rx += -15 + (n===1?0:-25);
		else rx += 15 + (n===1? 0 : 40);
		var ry = player.bones.r_shoulder.getWorldPosition().y;
		return new THREE.Vector3(rx, ry, 0)
	}
	function getVel(player, offset) {
		var vx = 400+(offset===undefined?0:offset);
		if ((player.game.left&&!player.game.sliding) || (!player.game.left&&player.game.sliding)) vx *= -1;
		return new THREE.Vector3(vx, 0, 0);
	}
	function hitPlayer(current, obj) {
		while (current !== null) {
			if (current.purpose === 'player') {
				var name = current.name;
				var dir;
				if (obj.sfx && obj.sfx.hit) obj.sfx.hit.play();
				else {
					current.sfx['hit'].pause();
					current.sfx['hit'].currentTime = 0;
					current.sfx['hit'].play()
				}
				if (!current.game.left&&current.game.sliding) dir = -1;
				else if (current.game.left&&current.game.sliding) dir = 1;
				else if (obj.velocity.x<0) dir = -1;
				else dir = 1;
				if (obj.DPS >= current.game.flinch.min)current.action.flinch(current.game.clock.getElapsedTime(), dir);
				if (current.game.health.HP>0) current.game.dmg_from = obj.source;
				current.game.health.HP -= obj.DPS;
				current.game.health.mesh.material.color = new THREE.Color('red');
				current.game.health.prev = current.game.clock.getElapsedTime();
				return -1;
			}
			current = current.parent;
		}
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
	

})()




