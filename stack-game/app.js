(() => {
    window.focus();

    let camera, scene, renderer;
    let world;
    let lastTime;
    let stack;
    let overhangs;

    const boxHeight = 1;
    const originalBoxSize = 3;

    let autopilot;
    let gameEnded;
    let robotPrecision;

    const scoreElement = document.getElementById('score');
    const resultsElement = document.getElementById('results');

    init();

    function setRobotPrecision() {
        robotPrecision = Math.random() * 1 - 0.5;
    }

    function init() {
        autopilot = true;
        gameEnded = false;
        lastTime = 0;
        stack = [];
        overhangs = [];
        setRobotPrecision();

        //set gravity === init CANNON
        world = new CANNON.World();
        world.gravity.set(0, -10, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 40;

        //init threejs
        const aspect = window.innerWidth / window.innerHeight;
        const width = 10;
        const height = width / aspect;

        //camera
        camera = new THREE.OrthographicCamera(
            width / -2,
            width / 2,
            height / 2,
            height / -2,
            0,
            100
        );

        camera.position.set(4,4,4);
        camera.lookAt(0,0,0);

        scene = new THREE.Scene();

        //foundation
        addLayer(0,0,originalBoxSize, originalBoxSize);

        //1st layer
        addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x');

        //light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionLight.position.set(10,20,0);
        scene.add(directionLight);

        //renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animation)
        document.body.appendChild(renderer.domElement);
    }

    function startGame() {
        autopilot = false;
        gameEnded = false;
        lastTime = 0;
        stack = [];
        overhangs = [];

        if (instructionsElement) instructionsElement.style.display = 'none';
        if (resultsElement) resultsElement.style.display = 'none';
        if (scoreElement) scoreElement.innerText = 0;

        if (world) {
             while (world.bodies.length > 0) {
                 world.remove(world.bodies[0]);
             }
        }




    }


    // Layers of the game
    function addLayer(x, z, width, depth, direction) {
        const y = boxHeight * stack.length;

        const layer = generateBox(x,y,z,width, depth, false)
        layer.direction = direction;

        stack.push(layer);
    }

    function addOverhang(x, z, width, depth) {
        const y = boxHeight * (stack.length - 1);
        const overhang = generateBox(x,y,z,width,depth, true);

        overhangs.push(overhang)
    }

    function generateBox(x,y,z, width, depth, falls) {
        const geometry = new THREE.BoxGeometry(width, boxHeight, depth);

        const color = new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`);
        const material = new THREE.MeshLambertMaterial({ color });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x,y,z);

        scene.add(mesh);

        const shape = new CANNON.Box(
            new CANNON.Vec3(width/2, boxHeight/2, depth/2)
        );
        let mass = falls ? 5 : 0;
        const body = new CANNON.Body({mass, shape})
        body.position.set(x,y,z);
        world.addBody(body);

        return {
            threejs: mesh,
            cannonjs: body,
            width,
            depth,
        };
    }


    //Animation
    window.addEventListener('click', () => {
        if(!gameStarted) {
            renderer.setAnimationLoop(animation);
            gameStarted = true;
        } else {
            const topLayer = stack[stack.length - 1];
            const previousLayer = stack[stack.length - 2];

            const direction = topLayer.direction;

            const delta = topLayer.threejs.position[direction] -
                previousLayer.threejs.position[direction];
            const overhangSize = Math.abs(delta);
            const size = direction == 'x' ? topLayer.width : topLayer.depth;
            const overlap = size - overhangSize;

            if (overlap > 0) {
                //cut layer
                const newWidth = direction == 'x' ? overlap : topLayer.width;
                const newDepth = direction == 'z' ? overlap : topLayer.depth;

                //update metadata
                topLayer.width = newWidth;
                topLayer.depth = newDepth;

                //update js model
                topLayer.threejs.scale[direction] = overlap / size;
                topLayer.threejs.position[direction] -= delta / 2;

                const overHangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
                const overHangX =
                    direction == 'x'
                        ? topLayer.threejs.position.x + overHangShift
                        : topLayer.threejs.position.x;
                const overHangZ =
                    direction == 'z'
                        ? topLayer.threejs.position.z + overHangShift
                        : topLayer.threejs.position.z;
                const overHangWidth = direction == 'x' ? overhangSize : newWidth;
                const overHangDepth = direction == 'z' ? overhangSize : newDepth;

                addOverhang(overHangX, overHangZ, overHangWidth, overHangDepth);

                //next layer
                const nextX = direction == 'x' ? topLayer.threejs.position.x : -10;
                const nextZ = direction == 'z' ? topLayer.threejs.position.z : -10;
                const nextDirection = direction == 'x' ? 'z' : 'x';

                addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
            }
        }
    })

    function animation() {
        const speed = 0.15;

        const topLayer = stack[stack.length - 1];
        topLayer.threejs.position[topLayer.direction] += speed;
        topLayer.cannonjs.position[topLayer.direction] += speed;

        if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
            camera.position.y += speed;
        }

        renderer.render(scene, camera)
    }
    lastTime = time;

    function updatePhysics() {
        world.step(1 / 60);

        overhangs.forEach(element => {
            element.threejs.position.copy(element.cannonjs.position)
            element.threejs.quaternion.copy(element.cannonjs.quaternion)
        })
    }


    function cutBox(topLayer, overlap, size, delta) {
        const direction = topLayer.direction;
        const newWidth = direction == 'x' ? overlap : topLayer.width;
        const newDepth = direction == 'z' ? overlap : topLayer.depth;

        //update metadata
        topLayer.width = newWidth;
        topLayer.depth = newDepth;

        //update threeejs model
        topLayer.threejs.scale[direction] = overlap / size;
        topLayer.threejs.position[direction] -= delta / 2;

        //update cannojs model
        topLayer.cannonjs.position[direction] -= delta / 2;

        //replace shapes
        const shape = new CANNON.Box(
            new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2);
        )
        topLayer.cannonjs.shapes = [];
        topLayer.cannonjs.addShape(shape);
    }



})();
