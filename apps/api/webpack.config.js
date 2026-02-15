const path = require('node:path');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const rootDir = path.resolve(__dirname, '../..');

module.exports = {
  devtool: 'eval-cheap-module-source-map',
  entry: './src/main.ts',

  externals: [
    nodeExternals({
      modulesDir: path.resolve(rootDir, 'node_modules'),
    }),
  ],
  mode: 'development',

  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              emitDecoratorMetadata: true,
              experimentalDecorators: true,
            },
            transpileOnly: true,
          },
        },
      },
    ],
  },

  output: {
    clean: true,
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, 'tsconfig.json'),
      }),
    ],
  },
  target: 'node',
};
