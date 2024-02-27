import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const pkg = require('./package.json');

export default {
  input: 'src/index.js', // Adjust this path to your entry file
  output: [
    {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'reevsocket', // Global variable for UMD module
      banner: `/** reevsocket ${pkg.version} */`,
      sourcemap: false
    }
  ],
  plugins: [
    typescript(),
    terser({
        format: {
          comments: function(node, comment) {
            if (comment.type === "comment2") {
              // multiline comment
              return /reevsocket \d+\.\d+\.\d+/.test(comment.value);
            }
            return false;
          }
        }
      }) // Minify the output
  ]
};
