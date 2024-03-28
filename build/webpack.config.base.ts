import path from 'path';
import webpack from 'webpack';
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
import SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');
// import ESLintPlugin from 'eslint-webpack-plugin';

const config: webpack.Configuration = {
  output: {
    path: path.join(__dirname, '/../dist'),
    filename:
      process.env.NODE_ENV === 'production' ? 'app.[hash].js' : 'app.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@images': path.join(__dirname, '/../src/images')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|woff|woff2|ttf|svg|eot|cur)(\?|\?[a-z0-9]+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: 'assets/[hash].[ext]'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.PIXIV_API_ENTRY': JSON.stringify(
        process.env.PIXIV_API_ENTRY
      ),
      'process.env.PIXIV_STRICT_MODE': JSON.stringify(
        process.env.PIXIV_STRICT_MODE
      )
    }),
    new ForkTsCheckerWebpackPlugin(),
    // new ESLintPlugin({
    //   extensions: ['ts', 'tsx']
    // }),
    // @ts-ignore
    process.env.CI ? null : new SimpleProgressWebpackPlugin()
  ].filter(Boolean)
};

export default config;
