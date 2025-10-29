import vertexShader from './vertex.glsl?raw'
import fragmentShader from './fragment.glsl?raw'
import photoshopMath from '@/packages/r3f-gist/shaders/cginc/math/blending.glsl?raw'
import simplexNoise from '@/packages/r3f-gist/shaders/cginc/noise/simplexNoise.glsl?raw'

export const VAT_VERTEX_SHADER = /* glsl */`
  ${simplexNoise}
  ${vertexShader}
`

export const VAT_FRAGMENT_SHADER = /* glsl */`
  ${photoshopMath}
  ${fragmentShader}
`
