var path = require('path');
var webpack = require('webpack');
require('es6-promise');

module.exports = {
  entry: {
    index: ['./lib/index'],
    'pagitter-write': ['./lib/pagitter-write'],
    'pagitter-store': ['./lib/pagitter-store']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/static/'
  },
  module: {
    loaders: [{
      test: /\.json$/,
      loader: 'json-loader'
     },{
      test: /\.js?/,
      loaders: ['babel'],
      include: path.join(__dirname, 'lib')
    }]
  }
};
