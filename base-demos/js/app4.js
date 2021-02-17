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
let geometry = new THREE.CubeGeometry( 1000, 1000, 1000 );
let cubeMaterials = [
    new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load('./img/right.jpg'), side: THREE.DoubleSide}), //right
    new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load('./img/left2.jpg'), side: THREE.DoubleSide}), //left
    new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load('./img/top.jpg'), side: THREE.DoubleSide}), //top
    new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load('./img/bottom.jpg'), side: THREE.DoubleSide}), //bottom
    new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load('./img/center.jpg'), side: THREE.DoubleSide}), //front
    new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load('./img/left1.jpg'), side: THREE.DoubleSide}), //back
]


//create texture
var material = new THREE.MeshFaceMaterial( cubeMaterials );
let cube = new THREE.Mesh(geometry, material);
scene.add(cube);


camera.position.z = 50;



//game logic
let update = function () {

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
