const path = require('path');

module.exports = {
  mode:'development',
  entry: './src/widgetUtils.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'umd',
    globalObject: 'this',
    library: 'oeb-Widgets',
  },
};
