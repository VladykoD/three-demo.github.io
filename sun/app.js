const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000  );

let renderer = new THREE.WebGL1Renderer();
renderer.setSize( window.innerWidth, window.innerHeight )
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', function () {
   var width = window.innerWidth;
   var height = window.innerHeight;
   renderer.setSize(width, height)
   camera.aspect = width / height;
   camera.updateProjectionMatrix();
})
// an array of objects whose rotation to update
const objects = [];

// use just one sphere for everything
const radius = 1;
const widthSegments = 10;
const heightSegments = 10;
const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

const solarSystem = new THREE.Object3D();
scene.add(solarSystem);
objects.push(solarSystem)

const sunMaterial = new THREE.MeshPhongMaterial({emissive: 0xFFFF00});
const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
sunMesh.scale.set(5, 5, 5);  // make the sun large
solarSystem.add(sunMesh);
objects.push(sunMesh);

const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.PointLight(color, intensity);
scene.add(light);

camera.position.set(0, 50, 0);
camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);


const earthOrbit = new THREE.Object3D();
earthOrbit.position.x = 10;
solarSystem.add(earthOrbit);
objects.push(earthOrbit);

const earthMaterial = new THREE.MeshPhongMaterial({color: 0x2233FF, emissive: 0x112244});
const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
earthOrbit.add(earthMesh);
objects.push(earthMesh);

const moonOrbit = new THREE.Object3D();
moonOrbit.position.x = 2;
earthOrbit.add(moonOrbit);

const moonMaterial = new THREE.MeshPhongMaterial({color: 0x888888, emissive: 0x222222});
const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial)
moonMesh.scale.set(.5,.5,.5);
moonOrbit.add(moonMesh);
objects.push(moonMesh)



//game logic
let update = function () {
   let time = Date.now() * 0.0005;

   objects.forEach((obj) => {
      obj.rotation.y = time;
   });
};

// draw scene
let render = function () {
   renderer.render( scene, camera )
}

//run game loop (update, render, repeat
let GameLoop = function () {
   requestAnimationFrame(GameLoop);
   update()
   render()
}

GameLoop();
