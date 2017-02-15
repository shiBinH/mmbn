
function Player(controls) {
	var loaded = false;
	var group = new THREE.Group();
	group.velocity = new THREE.Vector3();
	group.user = {
		airborne: false,
		left: false,
		controls: controls
	}
	var clips = {};

	var lengths = {
		l1: 5, l2: 7,	//	neck, body
		l3: 4, l4: 6, l5: 6,	//	shoulder, arm, forearm
		l6: 5, l7: 10	//	knee, shin
	};
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
			bones[4].add(mesh)
			
			mesh = collada.scene.children[0];
			mesh.scale.multiplyScalar(2)
			mesh.translateZ(-4)
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
			clip = A.x.run_right;
			clips['run_right'] = clip;
			action = mixer.clipAction(clip);
			action.setLoop(THREE.LoopRepeat); action.clampWhenFinished = true;
			clip = A.x.run_left;
			clips['run_left'] = clip;
			action = mixer.clipAction(clip);
			action.setLoop(THREE.LoopRepeat); action.clampWhenFinished = true;
			
			group.animation = {
				update: function(delta) {
					mixer.update(delta)
				},
				stop_right: function() {
					mixer.stopAllAction();
					action = mixer.existingAction(clips['stop_right']);
					action.play();
					action.reset();
				},
				stop_left: function() {
					mixer.stopAllAction();
					action = mixer.existingAction(clips['stop_left']);
					action.play();
					action.reset();
				},
				run_right: function() {
					action = mixer.existingAction(clips['run_right']);
					if (action.isRunning()) return;
					mixer.stopAllAction();
					action.play(); action.reset();
				}, 
				run_left: function() {
					action = mixer.existingAction(clips['run_left']);
					if (action.isRunning()) return;
					mixer.stopAllAction();
					action.play(); action.reset();
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
	group.add(mesh);
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
	group.add(mesh)
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
	group.add(mesh);
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
	group.add(mesh);
	bones[2].add(bones[12]);
	bones[12].position.y = 0;

	bones[3].position.y = bones[6].position.y = 0;
	bones[1].position.y -= 1;
	
	group.add(bones[0])
	group.scale.multiplyScalar(1.5)
	return group;
	
}
