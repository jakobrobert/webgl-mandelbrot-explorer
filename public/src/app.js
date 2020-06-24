const FPS_UPDATE_INTERVAL = 250;

let gl;

let fpsLabel;
let lastTime;
let frameCount = 0;

function init() {
    fetch("assets/shaders/mandelbrot.vert.glsl")
        .then(response => response.text())
        .then(vertexShaderSource => fetch("assets/shaders/mandelbrot.frag.glsl")
            .then(response => response.text())
            .then(fragmentShaderSource => start(vertexShaderSource, fragmentShaderSource)));
}

function start(vertexShaderSource, fragmentShaderSource) {
    const canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Your browser does not support WebGL!");
        return;
    }

    fpsLabel = document.getElementById("fps");

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
    const uniforms = {
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
    const viewportSize = [canvas.width, canvas.height];
    const aspectRatio = canvas.width / canvas.height;
    const minReal = -2.0;
    const maxReal = 2.0;
    const minImg = -2.0 / aspectRatio;
    const maxImg = 2.0 / aspectRatio;

    // Set uniforms
    gl.uniform2fv(uniforms.viewportSize, viewportSize);
    gl.uniform1f(uniforms.minReal, minReal);
    gl.uniform1f(uniforms.maxReal, maxReal);
    gl.uniform1f(uniforms.minImg, minImg);
    gl.uniform1f(uniforms.maxImg, maxImg);

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
