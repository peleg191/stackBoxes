let camera, scene, renderer;
let beforeGameTitleElement = document.getElementById('before-game-title');
let scoreTitleElement = document.getElementById('score-title');
let score = 0;
let sphere;
scoreTitleElement.textContent = score;
const originalBoxSize = 3;
let stack = [];
let disposedLayer = {};
const boxHeight = 1;
let gameStarted = false;
function removeObject3D(object3D) {
    scene.remove(object3D);
}
function generateBox(x, y, z, width, depth) {
    const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
    const color = new THREE.Color(`rgb(${(110 + stack.length) % 255},123,255)`);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return {
        threejs: mesh,
        width,
        depth
    }
}
function addLayer(x, z, width, depth, direction) {
    const y = boxHeight * stack.length;
    const layer = generateBox(x, y, z, width, depth);
    layer.direction = direction;
    stack.push(layer);
}
function init() {
    //scence init 
    scene = new THREE.Scene();
    addLayer(0, 0, originalBoxSize, originalBoxSize);
    addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x');
    //lightning 
    const anbientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(anbientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 0);
    scene.add(directionalLight);
    //camera
    const width = 10;
    const height = width * (window.innerHeight / window.innerWidth);
    camera = new THREE.OrthographicCamera(
        width / -2,
        width / 2,
        height / 2,
        height / -2,
        1,
        100
    );
    camera.position.set(4, 4, 4);
    camera.lookAt(0, 0, 0);
    //renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    animate();
}
function initAfterGameOver() {
    debugger;
    stack.forEach(obj => {
        removeObject3D(obj.threejs);
    })
    stack = [];
    score = 0;
    scoreTitleElement.textContent = score;
    beforeGameTitleElement.style.display = '';
    camera.position.y = 0;
    addLayer(0, 0, originalBoxSize, originalBoxSize);
    addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x');
    gameStarted = false;
}
init();
function animate() {
    const speed = 0.15;
    if (gameStarted) {
        const topLayer = stack[stack.length - 1];
        topLayer.threejs.position[topLayer.direction] += speed;
    }
    if (!isEmpty(disposedLayer)) {
        disposedLayer.threejs.position.y -= speed;
        if (disposedLayer.threejs.position.y <= camera.position.y - (3 * originalBoxSize))
            removeObject3D(disposedLayer.threejs);
    }
    if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
        camera.position.y += speed;
    }
    renderer.render(scene, camera);
}
function cutBox(topLayer, overlap, size, delta, direction) {
    const newWidth = direction === 'x' ? overlap : topLayer.width;
    const newDepth = direction === 'z' ? overlap : topLayer.depth;
    let topLayerPosition = topLayer.threejs.position;
    handledDisposedLayer(topLayer, delta, newWidth, newDepth, direction, size, topLayerPosition);
    topLayer.width = newWidth;
    topLayer.depth = newDepth;
    topLayer.threejs.scale[direction] = overlap / size;
    topLayerPosition[direction] -= delta / 2;

}
function handledDisposedLayer(topLayer, delta, newWidth, newDepth, direction, size, topLayerPosition) {
    let disposedLayerXOffset = 0;
    let disposedLayerZOffset = 0;
    if (direction === 'x') {
        disposedLayerXOffset = delta;
    }
    else {
        disposedLayerZOffset = delta;
    }
    let localDisposedLayer = {
        width: direction === 'x' ? topLayer.width - newWidth : topLayer.width,
        height: size,
        depth: direction == 'z' ? topLayer.depth - newDepth : topLayer.depth,
        position: { x: topLayerPosition.x + disposedLayerXOffset, y: topLayerPosition.y, z: topLayerPosition.z + disposedLayerZOffset }
    };
    removeObject3D(disposedLayer.threejs);
    disposedLayer = generateBox(localDisposedLayer.position.x, localDisposedLayer.position.y, localDisposedLayer.position.z,
        localDisposedLayer.width, localDisposedLayer.depth);
}
function onKeyDown() {
    if (!gameStarted) {
        renderer.setAnimationLoop(animate);
        beforeGameTitleElement.style.display = 'none';
        gameStarted = true;
    }
    else {
        const topLayer = stack[stack.length - 1];
        const previousLayer = stack[stack.length - 2];
        const direction = topLayer.direction;
        const size = direction == "x" ? topLayer.width : topLayer.depth;
        const delta =
            topLayer.threejs.position[direction] -
            previousLayer.threejs.position[direction];
        const overhangSize = Math.abs(delta);
        const overlap = size - overhangSize;
        if (overlap > 0) {
            cutBox(topLayer, overlap, size, delta, direction);
            score++;
            scoreTitleElement.textContent = score;
            //next layer 
            const nextX = direction === 'x' ? 0 : -10;
            const nextZ = direction === 'z' ? 0 : -10;
            const newWidth = topLayer.width;
            const newDepth = topLayer.depth;
            const nextDirection = direction === 'x' ? 'z' : 'x';
            addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
        }
        else {
            disposedLayer = topLayer;
            initAfterGameOver();
        }

    }
}
window.addEventListener("keydown", () => {
    onKeyDown();
});
window.addEventListener("click", () => {
    onKeyDown();
})


