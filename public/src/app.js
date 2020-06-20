let gl;

function init() {
    fetch("assets/shaders/mandelbrot.vert.glsl")
        .then(response => response.text())
        .then(vertShaderSource => fetch("assets/shaders/mandelbrot.frag.glsl")
            .then(response => response.text())
            .then(fragShaderSource => start(vertShaderSource, fragShaderSource)));
}

function start(vertShaderSource, fragShaderSource) {
    const canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Your browser does not support WebGL!");
        return;
    }

    // Create vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw Error("Vertex shader compile error: " + gl.getShaderInfoLog(vertexShader));
    }

    // Create fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw Error("Fragment shader compile error: " + gl.getShaderInfoLog(fragmentShader));
    }

    // Create program
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
    gl.useProgram(program); // directly use program, is the only one used in this app

    // Create vertex buffer
    const vertexData = [
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,

        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0
    ];
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

    // Setup vertex attributes
    const positionAttrib = gl.getAttribLocation(program, "position");
    gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false,
        2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionAttrib);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    requestAnimationFrame(doRenderLoop);
}

function doRenderLoop() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(doRenderLoop);
}
