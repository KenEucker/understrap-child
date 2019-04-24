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
cfg.files = cfg.files || {};

const paths = cfg.paths;
const vendors = cfg.vendors;
const themeFile = cfg.files.themeFile;
const themeAppFile = cfg.files.themeAppFile;

const babelifyOptions = cfg.babelifyOptions;

// Run:
// gulp imagemin
// Running image optimizing task
gulp.task( 'imagemin', function() {
    gulp.src( `${path.resolve(paths.imgsrc)}/**` )
    .pipe( imagemin() )
    .pipe( gulp.dest(path.resolve( paths.img) ) );
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
    const stream = gulp.src( path.resolve(`${paths.sass}/*.scss`) )
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
  return gulp.src( path.resolve(`${paths.css}/${themeFile}.css`) )
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
    .pipe( gulp.dest( path.resolve(paths.css) ) );
});

gulp.task( 'cleancss', function() {
  return gulp.src( [ path.resolve(`${paths.css}/*.min.*`),
        path.resolve(`${paths.css}/*.map`) ],
        { read: false } ) // Much faster
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
  return gulp.src( [ path.resolve(`${paths.js}/*.min.*`),
        path.resolve(`${paths.js}/*.map`) ],
    { read: false } ) // Much faster
    .pipe( rimraf() );
});

gulp.task('react', function () {
    // set up the browserify instance on a task basis
    const build = browserify({
      entries: `${ paths.jsx }app.jsx`,
      extensions: [ '.jsx' ],
      debug: true,
      paths: [ path.resolve(paths.node), path.resolve(paths.jsx) ]
    });
  
    const jsxStream = build.transform("babelify", babelifyOptions)
        .bundle()
        .pipe( source(`${themeAppFile}.js`) )
        .pipe( buffer() )
        .pipe( sourcemaps.init({loadMaps: true}) )
        .pipe( sourcemaps.write('./') )
        .pipe( gulp.dest( path.resolve(paths.js) ) );

    const minBuild = browserify({
        entries: `${ paths.jsx }app.jsx`,
        debug: true
        });
  
    const jsxMinStream = minBuild
        .transform("babelify", babelifyOptions)
        .bundle()
        .pipe( source(`${themeFile}-app.min.js`) )
        .pipe( buffer() )
        .pipe( sourcemaps.init({loadMaps: true}) )
        .pipe( uglify() )
        .pipe( sourcemaps.write('./') )
        .pipe( gulp.dest( path.resolve(paths.js) ) );

    return merge(jsxStream, jsxMinStream);
  });

gulp.task( 'javascript', function () {
    const scripts = [

        // Start - All BS4 stuff
        `${ path.resolve(paths.vendor) }bootstrap4/js/bootstrap.bundle.js`,

        // End - All BS4 stuff

        `${ path.resolve(paths.jsx) }skip-link-focus-fix.js`,

        // Adding currently empty javascript file to add on for your own themes´ customizations
        // Please add any customizations to this .js file only!
        `${ path.resolve(paths.jsx) }custom-javascript.js`,
    ];

    const gulpOpts = { allowEmpty: true };

    const jsStream = gulp.src( scripts, gulpOpts )
        .pipe( sourcemaps.init({loadMaps: true}) )
        .pipe( concat( `${themeFile}.js` ) )
        .pipe( sourcemaps.write('./') )
        .pipe( gulp.dest( path.resolve(paths.js) ));

    const minJsStream = gulp.src( scripts, gulpOpts )
        .pipe( sourcemaps.init({loadMaps: true}) )
        .pipe( concat( `${themeFile}.min.js` ) )
        .pipe( uglify() )
        .pipe( sourcemaps.write('./') )
        .pipe( gulp.dest( path.resolve(paths.js) ));

    return merge(jsStream, minJsStream);
} );

// Run:
// gulp scripts.
// Uglifies and concat all JS files into one
gulp.task( 'scripts', gulp.parallel( 'javascript', 'react' ));

// Deleting any file inside the /src folder
gulp.task('clean-source', function () {
  return del([ `${path.resolve(paths.src)}/**/*` ]);
});

// Run:
// gulp copy-vendors.
// Copy all needed dependency assets files from bower_component assets to themes /js, /scss and /fonts folder. Run this task after bower install or bower update

////////////////// All Bootstrap SASS  Assets /////////////////////////
gulp.task( 'copy-vendors', function() {

	const streams = [];

	for (const glob in vendors) {
		const srcGlob = `${path.resolve(paths.node)}/${glob}`;
		let dest = vendors[glob];
		dest = dest[0] == '~' ? paths[dest.substr(1)] : `${paths.vendor}${dest}`;
		dest = path.resolve(dest);

		// console.log('copying vendor into path', {glob, srcGlob, dest});
		streams.push(gulp.src(srcGlob).pipe(gulp.dest(dest)));
	}

    return merge(streams);
});

// Deleting the files distributed by the copy-vendors task
gulp.task( 'clean-vendor-assets', function() {
    const vendorExtensions = [ '.js', '.css' ]
    let vendorAssetsPaths = [ paths.vendor ];

    for (const glob in vendors) {
        let dest = vendors[glob];
        dest = dest[0] == '~' ? paths[dest.substr(1)] : `${paths.vendor}${dest}`;
        if ((glob.indexOf('*') == -1) && (vendorExtensions.indexOf(path.extname(glob)) !== -1)) {
            const split = glob.split('/');
            dest = `${dest}${split[split.length - 1]}`;
        }
        vendorAssetsPaths.push(path.resolve(dest));
    }

    return del( vendorAssetsPaths );
});

// Deleting any file inside the /dist folder
gulp.task( 'clean-dist', function() {
  return del( [`${path.resolve(paths.dist)}/**`] );
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
            'yarn-lock.json',
            'package-lock.json',
            'gulpfile.js',
            'gulpconfig.json',
            'CHANGELOG.md',
            '.travis.yml',
            'jshintignore',
            'codesniffer.ruleset.xml' ];

    ignoreFiles = ignoreFiles.map( _path => `!${path.resolve(_path)}` );
    ignorePaths = ignorePaths.map( _path => `!${path.resolve(_path)}` );

    return gulp.src( ['**/*', ...ignorePaths, ...ignoreFiles ], { 'buffer': false } )
        .pipe( replace( '/js/jquery.slim.min.js', `${paths.js}/jquery.slim.min.js`, { 'skipBinary': true } ) )
        .pipe( replace( '/js/popper.min.js', `${paths.js}/popper.min.js`, { 'skipBinary': true } ) )
        .pipe( replace( '/js/skip-link-focus-fix.js', `${paths.js}/skip-link-focus-fix.js`, { 'skipBinary': true } ) )
        .pipe( gulp.dest( paths.dist ) );
}));

// Deleting any file inside the /dist-product folder
gulp.task( 'clean-dist-product', function() {
  return del( [ `${path.resolve(paths.distprod)}/**`] );
} );

// Run
// gulp dist-product
// Copies the files to the /dist-prod folder for distribution as theme with all assets
gulp.task( 'dist-product', gulp.series('clean-dist-product', function copyToDistFolder() {
    let ignorePaths = [ 
        paths.bower, `${paths.bower}/**`,
        paths.node, `${paths.node}/**`,
        paths.dist, `${paths.dist}/**`,
        paths.distprod, `${paths.distprod}/**`]

        ignoreFiles = [ 
            'readme.txt',
            'readme.md',
            'package.json',
            'package-lock.json',
            'yarn-lock.json',
            'gulpfile.js',
            'gulpconfig.json',
            'CHANGELOG.md',
            '.travis.yml',
            'jshintignore',
            'codesniffer.ruleset.xml' ];
    ignorePaths = ignorePaths.map( _path => `!${path.resolve(_path)}` );
    ignoreFiles = ignoreFiles.map( _path => `!${path.resolve(_path)}` );

    const ignoreAllButMinifiedFiles = [
        `!${path.resolve(paths.js)}/**/!(*.min)*.js*`,
        `!${path.resolve(paths.js)}/**/*.map`,
        `!${path.resolve(paths.css)}/**/!(*.min)*.css*`,
        `!${path.resolve(paths.css)}/**/*.map` ];

    return gulp.src( ['**/*', ...ignorePaths, ...ignoreFiles, ...ignoreAllButMinifiedFiles ] )
        .pipe( gulp.dest( path.resolve(paths.distprod) ) );
} ));

// Run:
// gulp clean
// Cleans all of the output folders
gulp.task( 'clean', gulp.parallel( 'cleanjs', 'cleancss', 'clean-dist', 'clean-dist-product', 'clean-vendor-assets' ));

// Run:
// gulp compile
// runs the styles and scripts tasks before the dist task
gulp.task( 'compile', gulp.series( 'styles', 'scripts', 'dist' ));

// Run:
// gulp watch
// Starts watcher. Watcher runs gulp sass task on changes
gulp.task( 'watch', function() {
	const sassSrc = `${path.resolve(paths.sass)}/**/*.scss`,
		jsSrc = `${path.resolve(paths.jsx)}/**/*.js*`,
		imgSrc = `${path.resolve(paths.imgsrc)}/**/*.js*`;

    gulp.watch( sassSrc, gulp.series('styles') );
    gulp.watch( jsSrc, gulp.series('scripts') );

    //Inside the watch task.
    gulp.watch( imgSrc, gulp.series('imagemin-watch') );
});

// Run:
// gulp watch-bundle
// Starts watcher. Watcher runs gulp sass task on changes
gulp.task( 'watch-compile', function() {
	const sassSrc = `${path.resolve(paths.sass)}/**/*.scss`,
		jsSrc = `${path.resolve(paths.jsx)}/**/*.js*`,
		imgSrc = `${path.resolve(paths.imgsrc)}/**/*.js*`;

    gulp.watch( sassSrc, gulp.series( 'styles', 'dist' ) );
    gulp.watch( jsSrc, gulp.series( 'scripts', 'dist' ) );

    //Inside the watch task.
    gulp.watch( imgSrc, gulp.series('imagemin-watch', 'dist' ) );
});

// Run:
// gulp watch-bs
// Starts watcher with browser-sync. Browser-sync reloads page automatically on your browser
gulp.task( 'watch-bs', gulp.parallel( 'browser-sync', 'watch' ));
