// Defining requirements
const gulp = require( 'gulp' );
const plumber = require( 'gulp-plumber' );
const sass = require( 'gulp-sass' );
const path = require( 'path' );
const rename = require( 'gulp-rename' );
const concat = require( 'gulp-concat' );
const uglify = require( 'gulp-uglify' );
const imagemin = require( 'gulp-imagemin' );
const rimraf = require( 'gulp-rimraf' );
const sourcemaps = require( 'gulp-sourcemaps' );
const browserSync = require( 'browser-sync' ).create();
const browserify = require( 'browserify' );
const source = require( 'vinyl-source-stream' );
const buffer = require( 'vinyl-buffer' );
const del = require( 'del' );
const merge = require('merge-stream');
const cleanCSS = require( 'gulp-clean-css' );
const replace = require( 'gulp-replace' );
const autoprefixer = require( 'gulp-autoprefixer' );

// Configuration file to keep your code DRY
const cfg = require( './gulpconfig.json' );
const paths = cfg.paths;

// Run:
// gulp watch
// Starts watcher. Watcher runs gulp sass task on changes
gulp.task( 'watch', function() {
    gulp.watch( `${paths.sass}/**/*.scss`, gulp.series('styles') );
    gulp.watch( `${paths.jsx}/**/*.js*`, gulp.series('scripts') );

    //Inside the watch task.
    gulp.watch( `${paths.imgsrc} /**`, gulp.series('imagemin-watch') );
});

// Run:
// gulp imagemin
// Running image optimizing task
gulp.task( 'imagemin', function() {
    gulp.src( `${paths.imgsrc}/**` )
    .pipe( imagemin() )
    .pipe( gulp.dest( paths.img ) );
});

/**
 * Ensures the 'imagemin' task is complete before reloading browsers
 * @verbose
 */
gulp.task( 'imagemin-watch', gulp.series('imagemin', function reloadBrowserSync( ) {
  browserSync.reload();
}));

// Run:
// gulp sass
// Compiles SCSS files in CSS
gulp.task( 'sass', function() {
    const stream = gulp.src( `${paths.sass}/*.scss` )
        .pipe( sourcemaps.init( { loadMaps: true } ) )
        .pipe( plumber( {
            errorHandler: function( err ) {
                console.log( err );
                this.emit( 'end' );
            }
        } ) )
        .pipe( sass( { errLogToConsole: true } ) )
        .pipe( autoprefixer( 'last 2 versions' ) )
        .pipe( sourcemaps.write( './' ) )
        .pipe( gulp.dest( paths.css ) )
        .pipe( rename( 'custom-editor-style.css' ) );
    return stream;
});

gulp.task( 'minifycss', function() {
  return gulp.src( `${paths.css}/child-theme.css` )
    .pipe( sourcemaps.init( { loadMaps: true } ) )
    .pipe( cleanCSS( { compatibility: '*' } ) )
    .pipe( plumber( {
            errorHandler: function( err ) {
                console.log( err ) ;
                this.emit( 'end' );
            }
        } ) )
    .pipe( rename( { suffix: '.min' } ) )
    .pipe( sourcemaps.write( './' ) )
    .pipe( gulp.dest( paths.css ) );
});

gulp.task( 'cleancss', function() {
  return gulp.src( [ `${paths.css}/*.min.*`, `${paths.css}/*.map` ], { read: false } ) // Much faster
    .pipe( rimraf() );
});

gulp.task( 'styles', gulp.series( 'sass', 'minifycss' ));

// Run:
// gulp browser-sync
// Starts browser-sync task for starting the server.
gulp.task( 'browser-sync', function() {
    browserSync.init( cfg.browserSyncWatchFiles, cfg.browserSyncOptions );
} );

gulp.task( 'cleanjs', function() {
  return gulp.src( [ `${paths.js}/*.min.*`, `${paths.js}/*.map` ], { read: false } ) // Much faster
    .pipe( rimraf() );
});

gulp.task('react', function () {
    // set up the browserify instance on a task basis
    const build = browserify({
      entries: `${ paths.jsx }app.jsx`,
      debug: true
    });

    const babelifyOpts = { presets: ["@babel/preset-env", "@babel/preset-react"] };
  
    const jsxStream = build.transform("babelify", babelifyOpts)
        .bundle()
        .pipe( source('child-theme-app.js') )
        .pipe( buffer() )
        .pipe( sourcemaps.init({loadMaps: true}) )
        .pipe( sourcemaps.write('./') )
        .pipe( gulp.dest( paths.js ) );

    const minBuild = browserify({
        entries: `${ paths.jsx }app.jsx`,
        debug: true
        });
  
    const jsxMinStream = minBuild
        .transform("babelify", babelifyOpts)
        .bundle()
        .pipe( source('child-theme-app.min.js') )
        .pipe( buffer() )
        .pipe( sourcemaps.init({loadMaps: true}) )
        .pipe( uglify() )
        .pipe( sourcemaps.write('./') )
        .pipe( gulp.dest( paths.js ) );

    return merge(jsxStream, jsxMinStream);
  });

gulp.task( 'javascript', function () {
    const scripts = [

        // Start - All BS4 stuff
        `${ paths.vendor }bootstrap4/js/bootstrap.bundle.js`,

        // End - All BS4 stuff

        `${ paths.jsx }skip-link-focus-fix.js`,

        // Adding currently empty javascript file to add on for your own themes´ customizations
        // Please add any customizations to this .js file only!
        `${ paths.jsx }custom-javascript.js`,
    ];

    const gulpOpts = { allowEmpty: true };

    const jsStream = gulp.src( scripts, gulpOpts )
        .pipe( sourcemaps.init({loadMaps: true}) )
        .pipe( concat( 'child-theme.js' ) )
        .pipe( sourcemaps.write('./') )
        .pipe( gulp.dest( paths.js ));

    const minJsStream = gulp.src( scripts, gulpOpts )
        .pipe( sourcemaps.init({loadMaps: true}) )
        .pipe( concat( 'child-theme.min.js' ) )
        .pipe( uglify() )
        .pipe( sourcemaps.write('./') )
        .pipe( gulp.dest( paths.js ));

    return merge(jsStream, minJsStream);
} );

// Run:
// gulp scripts.
// Uglifies and concat all JS files into one
gulp.task( 'scripts', gulp.parallel( 'javascript', 'react' ));

// Run:
// gulp watch-bs
// Starts watcher with browser-sync. Browser-sync reloads page automatically on your browser
gulp.task( 'watch-bs', gulp.parallel('browser-sync', 'watch', 'scripts'));

// Deleting any file inside the /src folder
gulp.task('clean-source', function () {
  return del(['src/**/*']);
});

// Run:
// gulp copy-assets.
// Copy all needed dependency assets files from bower_component assets to themes /js, /scss and /fonts folder. Run this task after bower install or bower update

////////////////// All Bootstrap SASS  Assets /////////////////////////
gulp.task( 'copy-assets', function() {

    ////////////////// All Bootstrap 4 Assets /////////////////////////
    // Copy all JS files
    const bsJsStream = gulp.src( `${paths.node}bootstrap/dist/js/**/*.js` )
        .pipe( gulp.dest( `${paths.vendor}bootstrap4/js` ) );

    // Copy all Bootstrap SCSS files
    const bsSassStream = gulp.src( `${paths.node}bootstrap/scss/**/*.scss` )
        .pipe( gulp.dest( `${paths.vendor}bootstrap4/sass` ) );

    ////////////////// End Bootstrap 4 Assets /////////////////////////

    // Copy all Font Awesome Fonts
    const faFontStream = gulp.src( `${paths.node}font-awesome/fonts/**/*.{ttf,woff,woff2,eot,svg}` )
        .pipe( gulp.dest( './fonts' ) );

    // Copy all Font Awesome SCSS files
    const faSassStream = gulp.src( `${paths.node}font-awesome/scss/*.scss` )
        .pipe( gulp.dest( `${paths.vendor}fontawesome` ) );

    // _s SCSS files
    const usSassStream = gulp.src( `${paths.node}undescores-for-npm/sass/media/*.scss` )
        .pipe( gulp.dest( `${paths.vendor}underscores` ) );

    // _s JS files into /src/js
    const usJsStream = gulp.src( `${paths.node}undescores-for-npm/js/skip-link-focus-fix.js` )
        .pipe( gulp.dest( `${paths.jsx}` ) );

    // Copy Popper JS files
    const popperJsStream = gulp.src( `${paths.node}popper.js/dist/umd/popper.min.js` )
        .pipe( gulp.dest( `${paths.js}` ) );
    gulp.src( `${paths.node}popper.js/dist/umd/popper.js` )
        .pipe( gulp.dest( `${paths.js}` ) );

    // UnderStrap SCSS files
    const popperSassStream = gulp.src( `${paths.node}understrap/sass/**/*.scss` )
        .pipe( gulp.dest( `${paths.vendor}/understrap` ) );

    return merge(bsJsStream, bsSassStream, faFontStream, faSassStream, usSassStream, usJsStream, popperJsStream, popperSassStream);
});

// Deleting the files distributed by the copy-assets task
gulp.task( 'clean-vendor-assets', function() {
    const vendorAssets = [ 'bootstrap4/**', 'underscores/**', 'understrap/**', 'fontawesome/**', 'skip-link-focus-fix.js', 'popper.min.js', 'popper.js', './fonts/*wesome*.{ttf,woff,woff2,eot,svg}'];
    let vendorAssetsPaths = vendorAssets.map( vendor => path.resolve(paths.vendor, vendor) );
    vendorAssetsPaths = vendorAssetsPaths.concat(vendorAssets.map( vendor => vendor[0] == '.' ? path.resolve(vendor) : path.resolve(paths.js, vendor) ))
    vendorAssetsPaths = vendorAssetsPaths.concat(vendorAssets.map( vendor => vendor[0] == '.' ? path.resolve(vendor) : path.resolve(paths.jsx, vendor) ))

  return del( vendorAssetsPaths );
});

// Deleting any file inside the /dist folder
gulp.task( 'clean-dist', function() {
  return del( [`${paths.dist}/**`] );
});

// Run
// gulp dist
// Copies the files to the /dist folder for distribution as simple theme
gulp.task( 'dist', gulp.series('clean-dist', function copyToDistFolder() {
    let ignorePaths = [ 
        paths.bower, `${paths.bower}/**`,
        paths.node, `${paths.node}/**`,
        paths.dev, `${paths.dev}/**`,
        paths.dist, `${paths.dist}/**`,
        paths.distprod, `${paths.distprod}/**`,
        paths.sass, `${paths.sass}/**` ],

        ignoreFiles = [ 
            'readme.txt',
            'readme.md',
            'package.json',
            'package-lock.json',
            'gulpfile.js',
            'gulpconfig.json',
            'CHANGELOG.md',
            '.travis.yml',
            'jshintignore',
            'codesniffer.ruleset.xml' ];

    ignoreFiles = ignoreFiles.map( _path => `!${path.resolve(_path)}` );
    ignorePaths = ignorePaths.map( _path => `!${path.resolve(_path)}` );

    return gulp.src( ['**/*', '*', ...ignorePaths, ...ignoreFiles], { 'buffer': false } )
        .pipe( replace( '/js/jquery.slim.min.js', `${paths.js}/jquery.slim.min.js`, { 'skipBinary': true } ) )
        .pipe( replace( '/js/popper.min.js', `${paths.js}/popper.min.js`, { 'skipBinary': true } ) )
        .pipe( replace( '/js/skip-link-focus-fix.js', `${paths.js}/skip-link-focus-fix.js`, { 'skipBinary': true } ) )
        .pipe( gulp.dest( paths.dist ) );
}));

// Deleting any file inside the /dist-product folder
gulp.task( 'clean-dist-product', function() {
  return del( [`${paths.distprod}/**`] );
} );

// Run
// gulp dist-product
// Copies the files to the /dist-prod folder for distribution as theme with all assets
gulp.task( 'dist-product', gulp.series('clean-dist-product', function copyToDistFolder() {
    let ignorePaths = [ paths.bower, `${paths.bower}/**`, paths.node, `${paths.node}/**`, paths.dist, `${paths.dist}/**`, paths.distprod, `${paths.distprod}/**`];
    ignorePaths = ignorePaths.map( _path => `!${path.resolve(_path)}` );

    return gulp.src( ['**/*', ...ignorePaths, '*'] )
        .pipe( gulp.dest( paths.distprod ) );
} ));

// Run:
// gulp clean
// Cleans all of the output folders
gulp.task( 'clean', gulp.parallel( 'cleanjs', 'cleancss', 'clean-dist', 'clean-dist-product', 'clean-vendor-assets' ));

// Deleting any file inside the /dist-product folder
gulp.task( 'compile', gulp.series( 'styles', 'scripts', 'dist' ));
