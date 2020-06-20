function start() {
    const canvas = document.getElementById("gl-canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Your browser does not support WebGL!");
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
