const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    mode: isProduction
      ? 'production'
      : 'development',
    entry: './src/main.ts',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
    },
    node: {
      __dirname: false,
    },
    resolve: {
      extensions: [
        '.ts',
        '.js',
      ],
    },
    target: 'node',
    externals: [nodeExternals()],
    module: {
      rules: [
        {
          test: /\.tsx?$/u,
          use: 'ts-loader',
          exclude: /node_modules/u,
        },
      ],
    },
  };
};
