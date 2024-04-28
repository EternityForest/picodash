// rollup.config.mjs
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/picodash-base.esm.js',
      format: 'es',
      name: 'version'
    },
    {
      file: 'dist/picodash-base.min.esm.js',
      format: 'es',
      name: 'version',
      plugins: [terser()
      ]

    }
  ],
  plugins: [json()]
}
