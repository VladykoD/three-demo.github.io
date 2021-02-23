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

        if (resultsElement) resultsElement.style.display = 'none';
        if (scoreElement) scoreElement.innerText = 0;

        if (world) {
             while (world.bodies.length > 0) {
                 world.remove(world.bodies[0]);
             }
        }

        if (scene) {
            while (scene.children.find(c => c.type == 'Mesh')) {
                const mesh = scene.children.find(c => c.type == 'Mesh');
                scene.remove(mesh);
            }

            //foundation
            addLayer(0,0,originalBoxSize, originalBoxSize);

            //1st layer
            addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x');
        }

        if (camera) {
            camera.position.set(4,4,4);
            camera.lookAt(0,0,0);
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
        mass *= width / originalBoxSize;
        mass *= depth / originalBoxSize;

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
            new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
        );
        topLayer.cannonjs.shapes = [];
        topLayer.cannonjs.addShape(shape);
    }

    window.addEventListener('mousedown', eventHandler);
    window.addEventListener('touchstart', eventHandler);
    window.addEventListener('keydown', function (event) {
        if(event.key == ' ') {
            event.preventDefault();
            eventHandler();
            return;
        }
        if(event.key == 'R' || event.key =='r') {
            event.preventDefault();
            startGame();
            return;
        }
    });

    function eventHandler() {
        if (autopilot) startGame();
        else splitBlockAndAddNextOneIfOverlaps();
    }

    function splitBlockAndAddNextOneIfOverlaps() {
        if (gameEnded) return;

        const topLayer = stack[stack.length - 1];
        const previousLayer = stack[stack.length - 2];

        const direction = topLayer.direction;

        const size = direction == 'x' ? topLayer.width : topLayer.depth;

        const delta =
            topLayer.threejs.position[direction] -
            previousLayer.threejs.position[direction];
        const overhangSize = Math.abs(delta);
        const overlap = size - overhangSize;

        if (overlap > 0) {
            cutBox(topLayer, overlap, size, delta);

            const overHangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
            const overHangX =
                direction == 'x'
                    ? topLayer.threejs.position.x + overHangShift
                    : topLayer.threejs.position.x;
            const overHangZ =
                direction == 'z'
                    ? topLayer.threejs.position.z + overHangShift
                    : topLayer.threejs.position.z;
            const overHangWidth = direction == 'x' ? overhangSize : topLayer.width;
            const overHangDepth = direction == 'z' ? overhangSize : topLayer.depth;

            addOverhang(overHangX, overHangZ, overHangWidth, overHangDepth);


            //next layer
            const nextX = direction == 'x' ? topLayer.threejs.position.x : - 10;
            const nextZ = direction == 'z' ? topLayer.threejs.position.z : - 10;

            //cut layer
            const newWidth = topLayer.width;
            const newDepth = topLayer.depth;
            const nextDirection = direction == 'x' ? 'z' : 'x';

            if (scoreElement) scoreElement.innerText = stack.length - 1;
            addLayer(nextX, nextZ, newWidth, newDepth, nextDirection)
        } else {
            missedTheSpot();
        }
    }

    function missedTheSpot() {
        const topLayer = stack[stack.length - 1];

        addOverhang(
            topLayer.threejs.position.x,
            topLayer.threejs.position.z,
            topLayer.width,
            topLayer.depth
        );
        world.remove(topLayer.cannonjs);
        scene.remove(topLayer.threejs);

        gameEnded = true;
        if(resultsElement && !autopilot) resultsElement.style.display = 'flex';
    }

    function animation(time) {
        if (lastTime) {
            const timePassed = time - lastTime;
            const speed = 0.008;

            const topLayer = stack[stack.length - 1];
            const previousLayer = stack[stack.length - 2];

            // The top level box should move if the game has not ended AND
            // it's either NOT in autopilot or it is in autopilot and the box did not yet reach the robot position
            const boxShouldMove =
                !gameEnded &&
                (!autopilot ||
                    (autopilot &&
                        topLayer.threejs.position[topLayer.direction] <
                        previousLayer.threejs.position[topLayer.direction] +
                        robotPrecision));

            if (boxShouldMove) {
                // Keep the position visible on UI and the position in the model in sync
                topLayer.threejs.position[topLayer.direction] += speed * timePassed;
                topLayer.cannonjs.position[topLayer.direction] += speed * timePassed;

                // If the box went beyond the stack then show up the fail screen
                if (topLayer.threejs.position[topLayer.direction] > 10) {
                    missedTheSpot();
                }
            } else {
                // If it shouldn't move then is it because the autopilot reached the correct position?
                // Because if so then next level is coming
                if (autopilot) {
                    splitBlockAndAddNextOneIfOverlaps();
                    setRobotPrecision();
                }
            }

            // 4 is the initial camera height
            if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
                camera.position.y += speed * timePassed;
            }

            updatePhysics(timePassed);
            renderer.render(scene, camera);
        }
        lastTime = time;
    }


    function updatePhysics(timePassed) {
        world.step(timePassed / 1000);

        overhangs.forEach(element => {
            element.threejs.position.copy(element.cannonjs.position)
            element.threejs.quaternion.copy(element.cannonjs.quaternion)
        })
    }

})();
