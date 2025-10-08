import noise4D from '@/lib/r3f-gist/shader/cginc/noise/noise4D.glsl';

/**
 * Common shader utilities for particle behaviors
 */

export const SHADER_UTILS = /*glsl*/ `
    vec2 worldToNDC(vec3 worldPos, mat4 mvpMatrix) {
        vec4 clipPos = mvpMatrix * vec4(worldPos, 1.0);
        vec3 ndc = clipPos.xyz / clipPos.w;
        return ndc.xy;
    }

    vec3 ndcToWorld(vec2 ndc, mat4 inverseMvpMatrix) {
        vec4 worldPos = inverseMvpMatrix * vec4(ndc, 0.0, 0.0);
        return worldPos.xyz;
    }

    vec3 safeNormalize(vec3 v) {
        float length = max(length(v), 1e-6);
        return v / length;
    }

    vec3 calculatePointerAvoidance(
        vec3 worldPos,
        vec2 pointer,
        float aspect,
        float avoidanceRadius,
        float avoidanceStrength,
        mat4 mvpMatrix,
        mat4 inverseMvpMatrix
    ) {
        vec2 ndc = worldToNDC(worldPos, mvpMatrix);
        float dist = length((ndc - pointer) * vec2(aspect, 1.0));
        vec2 ndcDir = normalize(ndc - pointer);
        vec3 worldDir = ndcToWorld(ndcDir, inverseMvpMatrix);
        float multiplier = smoothstep(avoidanceRadius, 0.0, dist);
        return worldDir * multiplier * avoidanceStrength;
    }
`;

export const VAT_SAMPLING = /*glsl*/ `
    vec3 VAT_pos_f(sampler2D vatPosTex, sampler2D uv2Texture, vec2 uv, float frame, float texW) {
        float fx = (frame + 0.5) / texW;
        vec4 uv2Data = texture2D(uv2Texture, uv);
        vec2 uv2 = uv2Data.xy;
        vec2 vatUv = vec2(uv2.x + fx, uv2.y);
        return texture2D(vatPosTex, vatUv).xyz;
    }
    
    vec3 VAT_pos(sampler2D vatPosTex, sampler2D uv2Texture, vec2 uv, float frame, float texW, float frames) {
        float f0 = floor(frame);
        float f1 = min(f0 + 1.0, frames - 1.0);
        vec3 p0 = VAT_pos_f(vatPosTex, uv2Texture, uv, f0, texW);
        vec3 p1 = VAT_pos_f(vatPosTex, uv2Texture, uv, f1, texW);
        return mix(p0, p1, fract(frame));
    }
`;


