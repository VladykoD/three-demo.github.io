(() => {
    let camera, scene, renderer;
    const originalBoxSize = 3;

    let stack = [];
    let overhangs = [];
    const boxHeight = 1;

    let gameStarted = false;

    init();
    function init() {
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

        //camera
        const width = 10;
        const height = width * (window.innerHeight / window.innerHeight);
        camera = new THREE.OrthographicCamera(
            width / -2,
            width / 2,
            height / 2,
            height / -2,
            1,
            100
        );

        camera.position.set(4,4,4);
        camera.lookAt(0,0,0);

        //renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);

        document.body.appendChild(renderer.domElement);
    }


    // Layers of the game
    function addLayer(x, z, width, depth, direction) {
        const y = boxHeight * stack.length;

        const layer = generateBox(x,y,z,width, depth)
        layer.direction = direction;

        stack.push(layer);
    }

    function addOverhang(x, z, width, depth) {
        const y = boxHeight * (stack.length - 1);
        const overhang = generateBox(x,y,z,width,depth);
        overhangs.push(overhang)

    }

    function generateBox(x,y,z, width, depth) {
        const geometry = new THREE.BoxGeometry(width, boxHeight, depth);

        const color = new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`);
        const material = new THREE.MeshLambertMaterial({ color });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x,y,z);

        scene.add(mesh);

        return {
            threejs: mesh,
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

        if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
            camera.position.y += speed;
        }

        renderer.render(scene, camera)
    }



})();
