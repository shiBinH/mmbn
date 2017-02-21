


function Player(name, controls) {
	
	var loaded = false;
	var group = new THREE.Group();
	
	group.purpose = 'player';
	group.name = name;
	group.velocity = new THREE.Vector3();
	group.controls = controls;
	group.castShadow = true;
	group.bounds = {
		rightUp: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0, 13),
		leftUp: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0, 13),
		midRight: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 12),
		midLeft: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(-1, 0, 0), 0, 12),
		botRight: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 12),
		botLeft: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(-1, 0, 0), 0, 12),
		rightFoot: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 13),
		leftFoot: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 13)
	}
	group.bounds.rightFoot.y = 33;
	group.bounds.leftFoot.y = 33;
	group.user = {
		airborne: false,
		onWall: false,
		left: false,
		dashing: false,
		can_dash: true,
		dashJ: false,
		clock: new THREE.Clock(),
		can_jump: true,
		isAirborne: function(scene) {
			group.bounds.rightFoot.ray.origin.copy(group.position);
			group.bounds.rightFoot.ray.origin.x += 9;
			group.bounds.rightFoot.ray.origin.y += -20
			var intersections = group.bounds.rightFoot.intersectObjects(scene.children);
			for (var obj=0 ; obj<intersections.length ; obj++) {
				if (intersections[obj].object.purpose === 'surface' && group.velocity.y<=0) return false;
			}
			group.bounds.leftFoot.ray.origin.copy(group.position);
			group.bounds.leftFoot.ray.origin.x += -9;
			group.bounds.leftFoot.ray.origin.y += -20
			var intersections = group.bounds.leftFoot.intersectObjects(scene.children);
			for (var obj=0 ; obj<intersections.length ; obj++) {
				if (intersections[obj].object.purpose === 'surface' && group.velocity.y<=0) return false;
			}
			return true;
		},
		dash_prev: 0,
		latch_time: 0,
		wJump_cast: null,
		can_wJump: false,
		wJump_timer: 0,
		sliding: false
	}
	group.Buster = function() {
		var time = group.user.clock.getElapsedTime();
		var proto = Object.getPrototypeOf(this);
		if (time - proto.prev > .5 ) proto.ammo = 3
		if (proto.ammo === 0 || time-proto.prev<.2) return null;
		THREE.Mesh.call(this, new THREE.SphereGeometry(4),new THREE.MeshStandardMaterial({emissive: new THREE.Color('yellow')}));
		var vx = 400;
		if ((group.user.left&&!group.user.sliding) || (!group.user.left&&group.user.sliding)) vx *= -1;
		this.velocity = new THREE.Vector3(vx, 0, 0);
		var rx = group.bones.r_shoulder.getWorldPosition().x;
		if ((group.user.left&&!group.user.sliding) || (!group.user.left&&group.user.sliding)) rx += -15;
		else rx += 15;
		var ry = group.bones.r_shoulder.getWorldPosition().y;
		this.position.set(rx, ry, 0)
		this.raycaster = new THREE.Raycaster(new THREE.Vector3(),
																				 new THREE.Vector3(vx<0?-1:1, 0, 0),
																				 0, 12
																				)
		
		Object.getPrototypeOf(this).prev = time;
		proto.ammo--;
		this.purpose = 'projectile';
		
		this.update_game = function(data) {
			this.position.x += this.velocity.x * data.delta;
			this.raycaster.ray.origin.copy(this.position);
			var intersections = this.raycaster.intersectObjects(data.scene.children, true);
			for (var obj=0 ; obj<intersections.length ; obj++) {
				//if (intersections[obj].object.purpose === 'surface' || intersections[obj].object.purpose === 'player') {
					data.scene.remove(this)
					return -1;
				//}
			}
			if (this.position.x<data.scene.bounds.left || this.position.x>data.scene.bounds.right) {
				data.scene.remove(this);
				return -1;
			}
		}
	}
	group.Buster.prototype = new THREE.Mesh();
	group.Buster.prototype.prev = 0;
	group.Buster.prototype.ammo = 3;
	
	init();
	function init() {
		var clips = {};

		var lengths = {
			l1: 5, l2: 7.5,	//	neck, body
			l3: 4.5, l4: 6, l5: 6,	//	shoulder, arm, forearm
			l6: 5, l7: 10	//	knee, shin
		};
		var offsets = {
			jump: 2*-1.45,
			fall: 2*-1.35,
			run: 2*-1.5,
			shoot_stand: 2*1.6,
			dash: 2*1.5,
			slide: 2*-1.60
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
				clone.children[1].material = new THREE.MeshStandardMaterial({color: 0x00A3FF});
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

				mixer = new THREE.AnimationMixer(group);

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
				clip = A.x.j1;
				clips['j1'] = clip;
				action = mixer.clipAction(clip);
				action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true;


				group.animation = {
					update: function(delta) {
						mixer.update(delta)
						if (!mixer.existingAction(clips['dash']).isRunning()) group.bones.body.position.y = 0;
						var arm_buster = group.bones.body.getObjectByName('clone');
						clone.rotation.x = (Math.PI/-2)
						clone.rotation.y = group.bones.body.rotation.z-.05;
						if (group.user.sliding|| mixer.existingAction(clips['stop_left']).isRunning()) clone.rotation.z = .92 + -Math.PI/2;
						else clone.rotation.z = -group.bones.body.rotation.y + Math.PI/2
						if (clone.timer.getElapsedTime()>.4) {
							clone.visible = false;
							group.bones.r_shoulder.visible = true;
						}
					},
					turn_right: function() {
						group.rotation.y = 0;
					},
					turn_left: function() {
						if (group.velocity.y <= 0) group.rotation.y = offsets.fall;
						if (group.user.onWall) group.rotation.y = offsets.slide;
						if (group.user.airborne) group.rotation.y = offsets.jump;

					},
					stop_right: function() {
						group.rotation.y = 0;
						mixer.stopAllAction();
						action = mixer.existingAction(clips['stop_right']);
						action.play();
						action.reset();
					},
					stop_left: function() {
						group.rotation.y = 0;
						mixer.stopAllAction();
						action = mixer.existingAction(clips['stop_left']);
						action.play();
						action.reset();
					},
					run: function() {
						group.rotation.y = group.user.left ? offsets.run : 0;
						action = mixer.existingAction(clips['run']);
						if (action.isRunning() || group.user.airborne) return;
						mixer.stopAllAction();
						action.play(); action.reset();
					},
					jump: function() {
						group.rotation.y = group.user.left ? offsets.jump : 0;
						action = mixer.existingAction(clips['jump']);
						mixer.stopAllAction();
						action.play(); action.reset();
					},
					fall: function() {
						group.rotation.y = group.user.left? offsets.fall : 0;
						action = mixer.existingAction(clips['fall']);
						mixer.stopAllAction();
						action.play(); action.reset();
					},
					fire: function() {
						group.bones.r_shoulder.visible = false;
						clone = group.bones.body.getObjectByName('clone');
						clone.visible = true;
						clone.timer.start();
					},
					dash: function() {
						group.rotation.y = (group.user.left ? offsets.dash : 0);
						action = mixer.existingAction(clips['dash']);
						if (action.isRunning()) return;
						mixer.stopAllAction();
						action.play(); action.reset();
					},
					slide: function() {
						action = mixer.existingAction(clips['slide']);
						if (action.isRunning()) return;
						mixer.stopAllAction();
						action.play(); action.reset()
					},
					j1: function() {
						action = mixer.existingAction(clips['j1']);
						mixer.stopAllAction();
						action.play(); action.reset()
					}
				}
			}
		)
		group.bones = {
			body: bones[0], head: bones[1], pelvis: bones[2],
			r_shoulder: bones[3], r_elbow: bones[4], r_hand:bones[5],
			l_shoulder: bones[6], l_elbow: bones[7], l_hand: bones[8],
			r_leg: bones[9], r_knee: bones[10], r_ankle: bones[11],
			l_leg: bones[12], l_knee: bones[13], l_ankle: bones[14]
		}
		var bone_names = Object.keys(group.bones);
		for (var i=0 ; i<bone_names.length ; i++) group.bones[bone_names[i]].name = bone_names[i];

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
		//	group.add(mesh);
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
		//group.add(mesh)
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

		group.add(bones[0])
		group.scale.multiplyScalar(1.5)
	}
	return group;
	
	
}
