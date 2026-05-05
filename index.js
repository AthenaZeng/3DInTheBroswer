/*
This example uses the OrbitControls addon by importing it separately from the main THREE codebase.
*/
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer;
let mouse;

let catModel;
let catMeme;
let room;
let paw;

let targetPoint = new THREE.Vector3(0, 0, 0); 
let currentPoint = new THREE.Vector3(0, 0, 0);
let targetState = false;

let lastMouseMoveTime = 0;
let mouseStoppedDelay = 180;
let switchDistance = 0.08;
let switchForm = false;

let raycaster = new THREE.Raycaster();

function init() {
  scene = new THREE.Scene();

  new HDRLoader().load("cedar_bridge_sunset_1_1k.hdr", function (envMap) {
    console.log("hdr environment map loaded!");
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;
    // scene.background = envMap;
  });

  let aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.z = 5;
  camera.position.y = 5;
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);


  let gridHelper = new THREE.GridHelper(100, 100);
  scene.add(gridHelper);

  let controls = new OrbitControls(camera, renderer.domElement);

  const loader = new GLTFLoader();

  loader.load('roomlevel0.glb', function (gltf) {
    room = gltf.scene;
    scene.add(room);
    room.position.y = -0.1;
  });

  loader.load('cat.glb', function (gltf) {
    catModel = gltf.scene;
    catModel.visible = false;

    scene.add(catModel);
    console.log("cat loaded");
  });

  loader.load('paw.glb', function (gltf) {
    paw = gltf.scene;
  });

  loader.load('catMeme.glb', function (gltf) {
    catMeme = gltf.scene;
    catMeme.visible = false;

    scene.add(catMeme);
    console.log("meme loaded");
  });

  mouse = new THREE.Vector2(0, 0);

  document.addEventListener("mousemove",(ev) => {
    mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    let intersections = raycaster.intersectObject(room);

    if (intersections[0]) {
      let pointInSpace = intersections[0].point;

      targetPoint.copy(pointInSpace);
      targetState = true;

      lastMouseMoveTime = performance.now();

      switchForm = false;
      catMeme.visible = false;
    if (catModel) catModel.visible = true;
    }
  });

  document.addEventListener("pointerdown", () => {
    raycaster.setFromCamera(mouse, camera);
    let intersections = raycaster.intersectObject(room);

    if (intersections[0]) {
      let pointInSpace = intersections[0].point;
      let mesh = paw.clone(true); 
      scene.add(mesh);
      mesh.position.set(pointInSpace.x, pointInSpace.y, pointInSpace.z);
    }
  });

  window.addEventListener("resize", onWindowResize);

  loop();
}

function loop() {
  let now = performance.now();

  if (targetState) {

    currentPoint.lerp(targetPoint, 0.01);

    if (!switchForm) {
  if (catModel) {
    catModel.visible = true;
    catModel.position.copy(currentPoint);

    let dir = new THREE.Vector3().subVectors(targetPoint, currentPoint);

    if (dir.length() > 0.001) {
      let angle = Math.atan2(dir.x, dir.z);
      catModel.rotation.y = 80 + angle;
    }
  }
}

    let mouseStopped = now - lastMouseMoveTime > mouseStoppedDelay;
    let distanceToTarget = currentPoint.distanceTo(targetPoint);
    let reachedTarget = distanceToTarget < switchDistance;

    if (mouseStopped && reachedTarget && !switchForm) {
      switchForm = true;

      if (catModel) catModel.visible = false;
      catMeme.visible = true;

      catMeme.position.copy(targetPoint);

    }

    if (!switchForm) {
      if (catModel) catModel.visible = true;
    }
  }

  if (switchForm && catMeme.visible) {
    catMeme.rotation.y += 0.02;
    catMeme.position.y = targetPoint.y + 0.22 + Math.sin(now * 0.005) * 0.03;
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
}

function onWindowResize() {
  let aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();