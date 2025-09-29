import simplexNoise from '../../../../lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl';
import utility from '../../../../lib/r3f-gist/shader/cginc/utility.glsl';
import randomUtil from '../../../../lib/r3f-gist/shader/cginc/noise/random.glsl';

// Custom Ribbon Quad Vertex Shader
// Renders trails as 3D ribbons with proper geometry and lighting
export const customRibbonQuadVertexShader = /* glsl */ `
// Ribbon Vertex Shader
// Renders trails as 3D ribbons with proper geometry and lighting

precision highp float;

// Uniforms
uniform sampler2D uNodeTex;          // Node positions (NxM: x, y, z, time)
uniform sampler2D uTrailTex;         // Trail state (1xM: head, valid, advance, time)
uniform float uBaseWidth;            // Base width of the ribbon
uniform int uNodes;                  // Number of nodes per trail
uniform int uTrails;                 // Number of trails
uniform vec3 uCameraPos;             // Camera position for billboarding

// Attributes
attribute float aSeg;                // Segment index [0...nodes-1]
attribute float aSide;               // Side of ribbon [-1, 1]
attribute float aTrail;              // Trail index [0...trails-1]

// Varyings
varying float vSeg;                  // Segment index for fragment shader
varying float vTrail;                // Trail index for fragment shader
varying float vSide;                 // Side for fragment shader
varying vec3 vWorldPos;              // World position for lighting
varying vec2 vUv;                    // UV coordinates

/**
 * Reads node data for a specific node and trail
 */
vec4 readNode(int node, int trail) {
    float u = (float(node) + 0.5) / float(uNodes);
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uNodeTex, vec2(u, v));
}

/**
 * Reads trail head and valid count
 */
ivec2 readHeadValid(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    vec4 trailData = texture2D(uTrailTex, vec2(0.5, v));
    int head = int(floor(trailData.x + 0.5));
    int valid = int(floor(trailData.y + 0.5));
    return ivec2(head, valid);
}

/**
 * Converts logical index to physical buffer index
 * Handles circular buffer wrapping
 */
int logicalToPhysical(int i, int head, int valid, int nodes) {
    int start = (head - valid + 1 + nodes) % nodes;
    return (start + i) % nodes;
}

/**
 * Reads position by logical index
 * Handles edge cases for beginning and end of trail
 */
vec3 readPosByLogical(int i, int head, int valid, int nodes, int trail) {
    if (i < 0) i = 0;
    if (i >= valid) {
        return readNode(head, trail).xyz;
    }
    int k = logicalToPhysical(i, head, valid, nodes);
    return readNode(k, trail).xyz;
}

void main() {
    int trail = int(aTrail);
    int node = int(aSeg);
    
    // Read trail state
    ivec2 hv = readHeadValid(trail);
    int head = hv.x;
    int valid = hv.y;
    
    // Get current and neighboring positions
    vec3 p = readPosByLogical(node, head, valid, uNodes, trail);
    vec3 pPrev = readPosByLogical(node - 1, head, valid, uNodes, trail);
    vec3 pNext = readPosByLogical(node + 1, head, valid, uNodes, trail);
    
    // Calculate tangent vector
    bool shortStrip = (valid < 2);
    vec3 tangent;
    
    if (shortStrip) {
        tangent = vec3(1.0, 0.0, 0.0);  // Default tangent for short strips
    } else if (node <= 0) {
        tangent = normalize(pNext - p);  // Forward difference at start
    } else if (node >= valid - 1) {
        tangent = normalize(p - pPrev);  // Backward difference at end
    } else {
        tangent = normalize(pNext - pPrev);  // Central difference in middle
    }
    
    // Calculate billboard orientation
    vec3 viewDir =  normalize(uCameraPos - p);
    vec3 side = normalize(cross(tangent, viewDir));

    float t = aSeg/( float(valid)-1.0);

    // Calculate final position
    float width = uBaseWidth * smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.9, t);
    vec3 pos = p + side * width * aSide;
    
    // Calculate normal vector for lighting
    vec3 normal = normalize(cross(side, tangent));
    
    // Pass data to fragment shader
    vSeg = float(node);
    vTrail = float(trail);
    vSide = aSide;
    vWorldPos = pos;
    vUv = uv; // Pass UV coordinates
    
    // Transform to clip space
    mat4 invModel = inverse(modelMatrix);
    mat3 invModel3 = mat3(invModel);

    vec3 posOS    = (invModel * vec4(pos, 1.0)).xyz;
    vec3 normalOS = normalize(transpose(invModel3) * normal);

    csm_Position = posOS;
    csm_Normal   = normalOS;
}
`;

// Custom Ribbon Quad Fragment Shader
// Renders trail ribbons with color and debug highlighting
export const customRibbonQuadFragmentShader = /* glsl */ `
// Ribbon Fragment Shader
// Renders trail ribbons with color and debug highlighting
${simplexNoise}
${utility}

float random(vec2 st) {
    return fract(sin(dot(st.xy ,vec2(12.9898,78.233))) * 43758.5453123);
}
precision highp float;

// Uniforms
uniform vec3 uColor;                 // Base color of the ribbon
uniform float uTest;                  // Debug mode (highlights specific segments)
uniform float uRoughness;             // Roughness of the ribbon
uniform float uMetalness;             // Metalness of the ribbon

uniform float uNoiseScale;           // Scale factor for noise coordinates

// Varyings
varying float vSeg;                  // Segment index
varying float vTrail;                // Trail index
varying float vSide;                 // Side of ribbon
varying vec2 vUv;                    // UV coordinates

void main() {
    int segment = int(vSeg);
    
    
    
    float n = simplexNoise2d(vUv * vec2(uNoiseScale * 100.0, 1.0));

    float r = random(vUv * vec2(100., 10.0) * uNoiseScale);
    r = remap(n, 0.0, 1.0, 0.8, 1.0);

    vec3 color = uColor;

    // color *= r;

    csm_DiffuseColor = vec4(color, 1.0);
    csm_Roughness = uRoughness;
    csm_Metalness = uMetalness;
}

`;
