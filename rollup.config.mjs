import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

// Everything is compiled to ES5 so the library runs on 2017+ Samsung TVs
// (Tizen 3.0 ships Chromium 47, which lacks async/await and destructuring).
const ts = () => typescript({ tsconfig: './tsconfig.json', declaration: false });

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.mjs', format: 'es', sourcemap: true },
      { file: 'dist/index.cjs', format: 'cjs', sourcemap: true, exports: 'named' },
    ],
    plugins: [ts()],
  },
  {
    // Drop-in <script> build: exposes window.WaktuSolat
    input: 'src/index.ts',
    output: [
      { file: 'dist/waktu-solat.js', format: 'iife', name: 'WaktuSolat', sourcemap: true },
      { file: 'dist/waktu-solat.min.js', format: 'iife', name: 'WaktuSolat', sourcemap: true, plugins: [terser({ ecma: 5 })] },
    ],
    plugins: [ts()],
  },
];
