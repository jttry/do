const path = require('path')
const pathTo = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');

const entry = {
  index: ['' + path.resolve('src', 'entry.js')]
};
const weexEntry = {
  index: ['' + path.resolve('src', 'entry.js')]
};
const vueWebTemp = 'temp';
const hasPluginInstalled = fs.existsSync('./web/plugin.js');
const isWin = /^win/.test(process.platform);


function getEntryFileContent(entryPath, vueFilePath) {
  let relativePath = pathTo.relative(pathTo.join(entryPath, '../'), vueFilePath);
  let contents = '';
  if (hasPluginInstalled) {
    const plugindir = pathTo.resolve('./web/plugin.js');
    contents = 'require(\'' + plugindir + '\') \n';
  }
  if (isWin) {
    relativePath = relativePath.replace(/\\/g, '\\\\');
  }
  contents += 'var App = require(\'' + relativePath + '\')\n';
  contents += 'App.el = \'#root\'\n';
  contents += 'new Vue(App)\n';
  return contents;
}

let fileType = '';

function walk(dir) {
  dir = dir || '.';
  const directory = pathTo.join(__dirname, 'src', dir);
  fs.readdirSync(directory)
    .forEach(file => {
      const fullpath = pathTo.join(directory, file);
      const stat = fs.statSync(fullpath);
      const extname = pathTo.extname(fullpath);
      if (stat.isFile() && extname === '.vue' || extname === '.we') {
        if (!fileType) {
          fileType = extname;
        }
        if (fileType && extname !== fileType) {
          console.log('Error: This is not a good practice when you use ".we" and ".vue" togither!');
        }
        const name = pathTo.join(dir, pathTo.basename(file, extname));
        if (extname === '.vue') {
          const entryFile = pathTo.join(vueWebTemp, dir, pathTo.basename(file, extname) + '.js');
          fs.outputFileSync(pathTo.join(entryFile), getEntryFileContent(entryFile, fullpath));

          entry[name] = pathTo.join(__dirname, entryFile) + '?entry=true';
        }
        weexEntry[name] = fullpath + '?entry=true';
      } else if (stat.isDirectory() && file !== 'build' && file !== 'include') {
        const subdir = pathTo.join(dir, file);
        walk(subdir);
      }
    });
}

// walk();
// web need vue-loader
const plugins = [
  // new webpack.optimize.UglifyJsPlugin({minimize: true}),
  new webpack.BannerPlugin({
    banner: '// { "framework": ' + (fileType !== '.vue' ? '"Vue"' : '"Weex"') + '} \n',
    raw: true,
    exclude: 'Vue'
  })
];
const webConfig = {
  context: pathTo.join(__dirname, ''),
  entry,
  output: {
    path: pathTo.join(__dirname, 'dist'),
    filename: '[name].web.js'
  },
  module: {
    // webpack 2.0 
    rules: [{
      test: /\.js$/,
      enforce: 'pre',
      use: [{
        loader: 'babel-loader'
      }],
      exclude: /node_modules/
    },
    {
      test: /\.vue(\?[^?]+)?$/,
      use: [{
        loader: 'vue-loader'
      }]
    },
    {
      test: /\.(scss|sass)$/,
      use: ['style-loader', 'css-loader', 'sass-loader']
    },
    {
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'sass-loader', 'postcss-loader']
    },
    {
      test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }]
    }
    ]
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  devtool: '#eval-source-map',
  plugins: [
    new webpack.BannerPlugin({
      banner: '// { "framework": "Vue"} \n',
      raw: true,
      exclude: 'Vue'
    })
  ]
};
const weexConfig = {
  entry: weexEntry,
  output: {
    path: pathTo.join(__dirname, 'dist'),
    filename: '[name].weex.js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: [{
        loader: 'babel-loader'
      }],
      exclude: /node_modules/
    },
    {
      test: /\.vue(\?[^?]+)?$/,
      use: [{
        loader: 'weex-loader'
      }]
    },
    {
      test: /\.we(\?[^?]+)?$/,
      use: [{
        loader: 'weex-loader'
      }]
    },
    {
      test: /\.(scss|sass)$/,
      use: ['style-loader', 'css-loader', 'sass-loader']
    },
    {
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'sass-loader', 'postcss-loader']
    },
    {
      test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }]
    }
    ]
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '// { "framework": "Weex"} \n',
      raw: true,
      exclude: 'Vue'
    })
  ]
};

exports = [webConfig, weexConfig];

if (fileType === '.we') {
  exports = weexConfig;
}
module.exports = exports;