const path = require('path');
const glob = require("glob");

// separate CSS files
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// no JS output for scss input files
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

const scssInputPath = './src/scss';
const cssOutputPath = './public/css';

const scssEntries = glob.sync(`${scssInputPath}/*.scss`, {
  ignore: `${scssInputPath}/_*`,
});

// returns an object, to get one output file per entry
function scssEntriesGet() {
  return glob
    .sync(`${scssInputPath}/*.scss`, {
      // includes
      ignore: `${scssInputPath}/_*`,
    })
    .reduce((entries, filename) => {
      const {name} = path.parse(filename);
      return {...entries, [name]: filename};
    }, {});
}

module.exports = [
  {
    // no node output, to avoid universal chunk loading
    target: 'web',
    entry: {
      ...scssEntriesGet(),
    },
    output: {
      path: path.join(__dirname, cssOutputPath),
      clean: true,
    },
    devtool: 'source-map',
    plugins: [
      new RemoveEmptyScriptsPlugin(),
      new MiniCssExtractPlugin(),
    ],
    module: {
      rules: [
        {
          test: /\.scss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader?-url', // HMTL link for final output
            'sass-loader',
          ],
        },

      ],
    },
  },
]; // module exports

