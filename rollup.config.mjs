// rollup.config.mjs
import { rollupImportMapPlugin } from "rollup-plugin-import-map";
import terser from '@rollup/plugin-terser'
import legacy from '@rollup/plugin-legacy';
import { nodeResolve } from '@rollup/plugin-node-resolve';


function output_section(fn) {
  return [
    {
      file: 'dist/' + fn + '.esm.js',
      format: 'es',
      name: 'version',
    },
    {
      file: 'dist/' + fn + '.min.esm.js',
      format: 'es',
      name: 'version',
      plugins: [terser()
      ]

    }
  ]
}

export default [{
  // Just the base stuff, no extras
  input: 'src/index.js',
  output: output_section('picodash-base')
},

{
  input: [
    'plugins/picodash-units.js',
  ],
  external: ['picodash'],
  plugins: [nodeResolve()],
  output: output_section('picodash-plugin-units-bundled')
},

{
  input: [
    'plugins/picodash-confetti.js',
  ],
  external: ['picodash'],
  plugins: [nodeResolve()],
  output: output_section('picodash-plugin-confetti-bundled')
}


]
