precision highp float;

uniform vec2 viewportSize;

const float minReal = -2.0;
const float maxReal = 2.0;
const float minImg = -2.0;
const float maxImg = 2.0;
const int maxNumIterations = 2000;

void main() {
    // convert screen coordinate to complex number
    float aspectRatio = viewportSize.x / viewportSize.y;
    float x = gl_FragCoord.x / viewportSize.x;
    float y = gl_FragCoord.y / viewportSize.y / aspectRatio;
    float real = x * (maxReal - minReal) + minReal;
    float img = y * (maxImg - minImg) + minImg;
    vec2 c = vec2(real, img);

    vec2 z = c; // TODO: must start with 0 instead?
    int numIterations = 0;

    for (int i = 0; i < maxNumIterations; i++) {
        float y = 2.0 * z.x * z.y + c.y;
        z.x = z.x * z.x - z.y * z.y + c.x;
        z.y = y;

        // break if abs / length > 2.0, check squared length for efficiency
        if (z.x * z.x + z.y * z.y > 4.0) {
            break;
        }

        numIterations++;
    }

    if (numIterations >= maxNumIterations) {
        discard;
    }

    gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
}
