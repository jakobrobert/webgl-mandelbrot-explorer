const FPS_UPDATE_INTERVAL = 250;

const ZOOM_FACTOR = 1.05;

let canvas;
let gl;

let fpsLabel;
let lastTime;
let frameCount = 0;

let maxIterationCount;
let viewportSize;
let minReal;
let maxReal;
let minImg;
let maxImg;

let uniforms;

let mousePressed = false;
let pointerDown = false;

function init() {
    fetch("assets/shaders/mandelbrot.vert.glsl")
        .then(response => response.text())
        .then(vertexShaderSource => fetch("assets/shaders/mandelbrot.frag.glsl")
            .then(response => response.text())
            .then(fragmentShaderSource => start(vertexShaderSource, fragmentShaderSource)));
}

function onIterationsSliderChanged() {
    maxIterationCount = document.getElementById("iterationsSlider").value;
    document.getElementById("iterationsLabel").innerText = maxIterationCount;
}

function start(vertexShaderSource, fragmentShaderSource) {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Your browser does not support WebGL!");
        return;
    }

    // small hack: need to set initial value of slider,
    // for some reason slider always gets the max value as the initial
    document.getElementById("iterationsSlider").value = 200;
    onIterationsSliderChanged();

    fpsLabel = document.getElementById("fps");

    canvas.addEventListener("wheel", onZoom);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(vertexShader, fragmentShader);

    // Create vertex buffer (rectangle shape)
    const vertexData = [
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,

        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0
    ];
    const vertexBuffer = createVertexBuffer(vertexData);

    // Get uniform locations
    uniforms = {
        maxIterationCount: gl.getUniformLocation(program, "maxIterationCount"),
        viewportSize: gl.getUniformLocation(program, "viewportSize"),
        minReal: gl.getUniformLocation(program, "minReal"),
        maxReal: gl.getUniformLocation(program, "maxReal"),
        minImg: gl.getUniformLocation(program, "minImg"),
        maxImg: gl.getUniformLocation(program, "maxImg"),
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // Setup vertex attributes (buffer must be bound before)
    const positionAttrib = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionAttrib);
    gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false,
        2 * Float32Array.BYTES_PER_ELEMENT, 0);

    // Set CPU-Side variables
    viewportSize = [canvas.width, canvas.height];
    const aspectRatio = canvas.width / canvas.height;
    minReal = -2.0;
    maxReal = 2.0;
    minImg = -2.0 / aspectRatio;
    maxImg = 2.0 / aspectRatio;

    lastTime = performance.now();

    requestAnimationFrame(doRenderLoop);
}

function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const typeName = type === gl.VERTEX_SHADER ? "Vertex" : "Fragment";
        throw Error(typeName + " shader compile error: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}

function createProgram(vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Program link error: " + gl.getShaderInfoLog(program));
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        throw new Error("Program validate error: " + gl.getShaderInfoLog(program));
    }
    return program;
}

function createVertexBuffer(data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buffer;
}

function doRenderLoop() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update uniforms
    gl.uniform1i(uniforms.maxIterationCount, maxIterationCount);
    gl.uniform2fv(uniforms.viewportSize, viewportSize);
    gl.uniform1f(uniforms.minReal, minReal);
    gl.uniform1f(uniforms.maxReal, maxReal);
    gl.uniform1f(uniforms.minImg, minImg);
    gl.uniform1f(uniforms.maxImg, maxImg);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    updateFPS();

    requestAnimationFrame(doRenderLoop);
}

function updateFPS() {
    let currTime = performance.now();
    frameCount++;
    const interval = currTime - lastTime;
    if (interval >= FPS_UPDATE_INTERVAL) {
        const fps = frameCount / interval * 1000.0;
        fpsLabel.innerText = "FPS: " + fps.toFixed(1);
        lastTime = currTime;
        frameCount = 0;
    }
}

function onZoom(event) {
    event.preventDefault(); // to prevent scrolling
    let factor;
    if (event.deltaY < 0) {
        // wheel up -> decrease range to zoom in
        factor = 1.0 / ZOOM_FACTOR;
    } else if (event.deltaY > 0) {
        // wheel down -> increase range to zoom out
        factor = ZOOM_FACTOR;
    } else {
        // probably never occurs
        return;
    }
    // Keep center point the same, zoom about this point
    const centerReal = 0.5 * (minReal + maxReal);
    const centerImg = 0.5 * (minImg + maxImg);
    const newRealRange = factor * (maxReal - minReal);
    const newImgRange = factor * (maxImg - minImg);
    minReal = centerReal - 0.5 * newRealRange;
    maxReal = centerReal + 0.5 * newRealRange;
    minImg = centerImg - 0.5 * newImgRange;
    maxImg = centerImg + 0.5 * newImgRange;
}

function onPointerDown(event) {
    if (event.button === 0) {
        pointerDown = true;
    }
}

function onPointerUp(event) {
    if (event.button === 0) {
        pointerDown = false;
    }
}

function onPointerMove(event) {
    if (!pointerDown) {
        return;
    }
    const realDelta = (event.movementX / canvas.width) * (maxReal - minReal);
    const imgDelta = (event.movementY / canvas.height) * (maxImg - minImg);
    // inverted, moving mouse to the right moves viewport to the left
    minReal -= realDelta;
    maxReal -= realDelta;
    // + instead of - for img because y-axis is inverted
    minImg += imgDelta;
    maxImg += imgDelta;
}
