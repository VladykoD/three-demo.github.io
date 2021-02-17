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

controls = new THREE.OrbitControls( camera, renderer.domElement)

//create the shape
//var geometry = new THREE.TorusKnotBufferGeometry( 10, 3, 100, 16 );
let geometry = new THREE.BoxGeometry( 8, 8, 8 );
let cubeMaterials = [
    new THREE.MeshLambertMaterial( {map: new THREE.TextureLoader().load('./img/2.jpg'), side: THREE.DoubleSide}), //right
    new THREE.MeshPhongMaterial( {map: new THREE.TextureLoader().load('./img/2.jpg'), side: THREE.DoubleSide}), //left
    new THREE.MeshLambertMaterial( {map: new THREE.TextureLoader().load('./img/3.jpg'), side: THREE.DoubleSide}), //top
    new THREE.MeshPhongMaterial( {map: new THREE.TextureLoader().load('./img/3.jpg'), side: THREE.DoubleSide}), //bottom
    new THREE.MeshBasicMaterial( { color: 0xff624b, side: THREE.DoubleSide}), //front
    new THREE.MeshBasicMaterial( { color: 0xff624b, side: THREE.DoubleSide}), // back
]

//create texture
let material = new THREE.MeshFaceMaterial( cubeMaterials )
let cube = new THREE.Mesh(geometry, material);
scene.add(cube);


camera.position.z = 14;

let ambientLight = new THREE.AmbientLight( 0xFFFFFF, 1)
scene.add(ambientLight)

let light1 = new THREE.PointLight(0xFF0040, 2, 50)
scene.add(light1)

let light2 = new THREE.PointLight(0xFF4000, 2, 50)
scene.add(light2)

let light3 = new THREE.PointLight(0xF40000, 2, 50)
scene.add(light3)

var spotLight = new THREE.SpotLight(0xFF00FF, 25)
spotLight.position.set(1,3,0);
scene.add(spotLight)

//game logic
let update = function () {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    let time = Date.now() * 0.0005;
    light1.position.x = Math.sin(time * 0.7) * 30
    light1.position.y = Math.cos(time * 0.5) * 30
    light1.position.z = Math.cos(time * 0.3) * 30

    light2.position.y = Math.cos(time * 0.5) * 30
    light2.position.z = Math.sin(time * 0.3) * 30
    light2.position.x = Math.sin(time * 0.7) * 30

    light3.position.y = Math.sin(time * 0.5) * 30
    light3.position.z = Math.cos(time * 0.3) * 30
    light3.position.x = Math.sin(time * 0.7) * 30
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
