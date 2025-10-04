import vertexShader from './vertex.glsl?raw'
import fragmentShader from './fragment.glsl?raw'
import photoshopMath from '@/lib/r3f-gist/shader/cginc/photoshopMath.glsl?raw'
import simplexNoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl?raw'

export const VAT_VERTEX_SHADER = /* glsl */`
  ${simplexNoise}
  ${vertexShader}
`

export const VAT_FRAGMENT_SHADER = /* glsl */`
  ${photoshopMath}
  ${fragmentShader}
`
