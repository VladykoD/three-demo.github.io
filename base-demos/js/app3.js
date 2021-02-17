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
var geometry = new THREE.TorusGeometry( 10, 3, 16, 100 );

//create texture

var material = new THREE.MeshLambertMaterial( { map: new THREE.TextureLoader().load('./img/2.jpg'), side: THREE.DoubleSide } );
let cube = new THREE.Mesh(geometry, material);
scene.add(cube);


camera.position.z = 20;



var spotLight = new THREE.SpotLight(0xFFFFFF, .8)
spotLight.position.set(0,20,50);
scene.add(spotLight)

//game logic
let update = function () {
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.01;
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
