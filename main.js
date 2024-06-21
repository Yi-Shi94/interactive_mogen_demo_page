import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { BVHLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/BVHLoader.js';
import { FBXLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/FBXLoader.js';

var clock = new THREE.Clock();
var mixer, skeletonHelper;
var mouse, raycaster, canvas, canvasPosition;


document.addEventListener('DOMContentLoaded', () => {
    // Create the scene
    const scene = new THREE.Scene();
    // Create the camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);


    camera.position.set(0, 0, 400);
    camera.lookAt(0, 0, 0);

    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 50, 0);
    scene.add(directionalLight);

    // Create the renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    canvas = renderer.domElement;
    //canvasPosition = $(canvas).position();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
   
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // for an improved user experience
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // Create the checkerboard texture
    const size = 50;
    const data = new Uint8Array(size * size * 3);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const stride = (i * size + j) * 3;
            const isWhite = (Math.floor(i / 1) + Math.floor(j / 1)) % 2 === 0;
            const color = isWhite ? 128 : 96;
            data[stride] = color;
            data[stride + 1] = color;
            data[stride + 2] = color;
        }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
    texture.needsUpdate = true;

    // Create the ground
    const groundGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
    const groundMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const loader = new THREE.CubeTextureLoader();
    const textureCube = loader.load([
        'textures/rt.bmp',
        'textures/lt.bmp',
        'textures/tp.bmp',
        'textures/bt.bmp',
        'textures/ft.bmp',
        'textures/bk.bmp'
    ]);
    scene.background = textureCube;

    const mixers = [];
    const rootPositions = [];
    var results;
    var root_ori, skel;
    let fbxModel = null;
   
    const bvhLoader = new BVHLoader();

    bvhLoader.load('assets/gt.bvh', function(result){
        const skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);
        skeletonHelper.skeleton = result.skeleton; // allows animation mixer to bind to BVH bone structure
        skel = result.skeleton.bones[0];
        var boneContainer = new THREE.Group();
	    boneContainer.add( result.skeleton.bones[ 0 ] );
        
        scene.add(skeletonHelper);
        scene.add( boneContainer );
       
        mixer = new THREE.AnimationMixer(skeletonHelper);
        const anim = mixer.clipAction(result.clip)//.setEffectiveWeight( 1.0 )
        anim.play();
        mixers.push(mixer);

        if (fbxModel){
            matchSkeletons(result.skeleton, fbxModel);
            
        }

        
        //const rootBone = result.skeleton.bones[0];
        //const frameTime = 1 / result.clip.tracks[0].times.length;
        
       
        //results = result.skeleton.bones[0]
        //result.clip.tracks[0].times.forEach((time, index) => {
            
        //        rootPositions.push(rootBone.position[index]);
        //        console.log(rootPositions[index])

        //});
        //console.log(rootPositions[2]);
        
        //if (rootPositions.length > 0) {
        //    camera.lookAt(result.skeleton.bones[0]);
        //    camera.position.set(rootPositions[0][0],rootPositions[0][1], 100);
        //};

        //console.log(root_pos[1][1],root_pos[1][2])
     
    });
    ///let vec2 = new THREE.Vector3().copy(results.position);
    //console.log(results.length, results.position, vec2)
    //camera.position.set(root_pos[0][0], root_pos[0][2], 100);
    //camera.lookAt(root_pos[0][0], root_pos[0][2], 0);
    
    // Load and play FBX animation
    
    const fbxLoader = new FBXLoader();
    fbxLoader.load('assets/lafan1_tpose_small.fbx', (object) => {
        object.mixer = new THREE.AnimationMixer(object);
        mixers.push(object.mixer);

        //const action = mixers[0].clipAction(object.animations[0]);
        //action.play();
        fbxModel = object;
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(object);

        if (mixers.length > 0) {
            const bvhMixer = mixers[0];
            matchSkeletons(bvhMixer.getRoot(), fbxModel);
        }
        
        //bvhMixer.play()

    }); 

    function matchSkeletons(bvhSkeleton, fbxModel) {
        const bvhBones = bvhSkeleton.bones;
        const fbxBones = fbxModel.children[1].skeleton.bones;
        const fbxBoneRoot = fbxBones.find(bone => bone.name === bvhSkeleton.bones[0].name);
        //fbxBoneRoot.position.copy(bvhBones[0].position)
        //fbxBoneRoot.quaternion.copy(bvhBones[0].quaternion)
        //for (let i = 0; i < bvhBones.length; i++) {
        //    const bvhBone = bvhBones[i];
        //    const fbxBone = fbxBones.find(bone => bone.name === bvhBone.name);

            //if (fbxBone) {
                //console.log(fbxBone.name, bvhBone.name)
                //console.log(fbxBone.position, bvhBone.position)
                //fbxBone.position.copy(bvhBone.position);
            //    fbxBone.quaternion.copy(bvhBone.quaternion);
            //}
        //}
    }

    let lastContactPole = null;
    let lastContactFlag = null
    function onMouseClick(event) {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the raycaster with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the ray
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
            const pointOfContact = intersects[0].point;
            // Log the intersected object
            

            if (lastContactPole) {
                scene.remove(lastContactPole);
                scene.remove(lastContactFlag);
            }

            console.log('Intersected object:', intersects[0].object);
            console.log('Intersected point:', pointOfContact);
            console.log('Intersected point num:', intersects.length);

            const poleGeometry = new THREE.CylinderGeometry(1, 1, 180, 32 );
            const poleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            lastContactPole = new THREE.Mesh(poleGeometry, poleMaterial);
            pointOfContact.y = 90
            lastContactPole.position.copy(pointOfContact);
            scene.add(lastContactPole);

            const flagGeometry = new THREE.BoxGeometry( 70, 50, 0.1 );
            const flagMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            lastContactFlag = new THREE.Mesh(flagGeometry, flagMaterial);
            pointOfContact.x += 35
            pointOfContact.y = 155
            lastContactFlag.position.copy(pointOfContact);
            scene.add(lastContactFlag);
        }
    }


    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('click', onMouseClick, false);

    // Render the scene
    function animate() {
        requestAnimationFrame(animate);
        var delta = clock.getDelta();

		if ( mixer ) mixer.update( delta );
		if ( skeletonHelper ) skeletonHelper.update();
        
        const bvhBones = mixer.getRoot().bones;
        const fbxBones = mixers[1]._root.children[1].skeleton.bones;

        console.log(bvhBones[0].position); // root positions
        console.log(fbxBones[0].position);
        for (let i = 0; i < bvhBones.length; i++) {
            const bvhBone = bvhBones[i];
            const fbxBone = fbxBones.find(bone => bone.name === bvhBone.name);
            console.log(i, bvhBone, fbxBone)
            if (fbxBone) {
                if (i == 0){
                    //fbxBone.position.copy(bvhBone.position);
                    fbxBone.position.x = bvhBone.position.x
                    fbxBone.position.y = -bvhBone.position.z
                    fbxBone.position.z = bvhBone.position.y

                    fbxBone.rotation.x = bvhBone.rotation.x + Math.PI / 2
                    fbxBone.rotation.y = bvhBone.rotation.y 
                    fbxBone.rotation.z = bvhBone.rotation.z
                    
                }
                
                else{
                    console.log(i,bvhBone.name, fbxBone.name, fbxBone.rotation, bvhBone.rotation)
                    fbxBone.rotation.x = bvhBone.rotation.x 
                    fbxBone.rotation.y = bvhBone.rotation.y
                    fbxBone.rotation.z = bvhBone.rotation.z +  Math.PI

                }
                
                //
               //fbxBone.quaternion.copy(bvhBone.quaternion);
            }
        }
        //const fbxBones = object.skeleton.bones;
       /*  if (bvhMixer && fbxModel) {
            const bvhBones = bvhMixer.getRoot().skeleton.bones;
            const fbxBones = fbxModel.skeleton.bones;

            for (let i = 0; i < bvhBones.length; i++) {
                const bvhBone = bvhBones[i];
                const fbxBone = fbxBones.find(bone => bone.name === bvhBone.name);

                if (fbxBone) {
                    fbxBone.position.copy(bvhBone.position);
                    fbxBone.quaternion.copy(bvhBone.quaternion);
                }
            }
        } */
        
        controls.update();
        renderer.render(scene, camera);
    }

    animate();
});