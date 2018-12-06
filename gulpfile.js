

const gulp = require('gulp');

const webpackStream = require('webpack-stream');

const { webpack } = webpackStream;
const named = require('vinyl-named');

const paths = {
  scripts: {
    entry: 'js/interface.js',
    dest: 'dist/'
  }
};

gulp.task('watch', () => gulp
  .src(paths.scripts.entry)
  .pipe(named())
  .pipe(
    webpackStream({
      stats: {
        assets: false,
        colors: true,
        version: false,
        timings: true,
        chunks: true,
        chunkModules: true
      },
      mode: 'development',
      watch: true,
      devtool: 'source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-transform-runtime']
            }
          }
        ]
      },
      plugins: [new webpack.NoEmitOnErrorsPlugin()]
    })
  )
  .pipe(gulp.dest(paths.scripts.dest)));
