/**
 * Gulpfile.
 *
 * Gulp with WordPress.
 *
 * Implements:
 *      1. Live reloads browser with BrowserSync.
 *      2. CSS: Sass to CSS conversion, error catching, Autoprefixing, Sourcemaps,
 *         CSS minification, and Merge Media Queries.
 *      3. JS: Concatenates & uglifies Vendor and Custom JS files.
 *      4. Images: Minifies PNG, JPEG, GIF and SVG images.
 *      5. Watches files for changes in CSS or JS.
 *      6. Watches files for changes in PHP.
 *      7. Corrects the line endings.
 *      8. InjectCSS instead of browser page reload.
 *      9. Generates .pot file for i18n and l10n.
 *
 * @author Ahmad Awais <https://github.com/ahmadawais>
 * @version 2.0.0
 */

/**
 * Load WPGulp Configuration.
 *
 * TODO: Customize your project in the wpgulp.js file.
 */
const config = require( './wpgulp.config.js' );
const paths = config.paths;
const vendors = config.vendors.vendorGlobs;
const themeFile = config.projectThemeName;
const themeAppFile = config.projectAppName;
// console.log('PATHS',paths)

/**
 * Load Plugins.
 *
 * Load gulp plugins and passing them semantic names.
 */
const gulp = require( 'gulp' ); // Gulp of-course.

// CSS related plugins.
const sass = require( 'gulp-dart-sass' ); // Gulp plugin for Sass compilation.
const minifycss = require( 'gulp-uglifycss' ); // Minifies CSS files.
const autoprefixer = require( 'gulp-autoprefixer' ); // Autoprefixing magic.
const mmq = require( 'gulp-merge-media-queries' ); // Combine matching media queries into one.
const rtlcss = require( 'gulp-rtlcss' ); // Generates RTL stylesheet.

// JS related plugins.
const concat = require( 'gulp-concat' ); // Concatenates JS files.
const uglify = require( 'gulp-uglify' ); // Minifies JS files.
const babel = require( 'gulp-babel' ); // Compiles ESNext to browser compatible JS.

// Image related plugins.
const imagemin = require( 'gulp-imagemin' ); // Minify PNG, JPEG, GIF and SVG images with imagemin.

// Utility related plugins.
const rename = require( 'gulp-rename' ); // Renames files E.g. style.css -> style.min.css.
const lineec = require( 'gulp-line-ending-corrector' ); // Consistent Line Endings for non UNIX systems. Gulp Plugin for Line Ending Corrector (A utility that makes sure your files have consistent line endings).
const filter = require( 'gulp-filter' ); // Enables you to work on a subset of the original files by filtering them using a glob.
const sourcemaps = require( 'gulp-sourcemaps' ); // Maps code in a compressed file (E.g. style.css) back to it’s original position in a source file (E.g. structure.scss, which was later combined with other css files to generate style.css).
const notify = require( 'gulp-notify' ); // Sends message notification to you.
const browserSync = require( 'browser-sync' ).create(); // Reloads browser and injects CSS. Time-saving synchronized browser testing.
const wpPot = require( 'gulp-wp-pot' ); // For generating the .pot file.
const sort = require( 'gulp-sort' ); // Recommended to prevent unnecessary changes in pot-file.
const cache = require( 'gulp-cache' ); // Cache files in stream for later use.
const clean = require( 'gulp-clean' ); // Cache files in stream for later use.
const remember = require( 'gulp-remember' ); //  Adds all the files it has ever seen back into the stream.
const plumber = require( 'gulp-plumber' ); // Prevent pipe breaking caused by errors from gulp plugins.

// Other utility modules.
const merge = require( 'merge-stream' );
const path = require( 'path' );
const beep = require( 'beepbeep' );

/**
 * Custom Error Handler.
 *
 * @param Mixed err
 */
const errorHandler = r => {
	notify.onError( '\n\n❌  ===> ERROR: <%= error.message %>\n' )( r );
	beep();

	// this.emit('end');
};

/**
 * Task: `browser-sync`.
 *
 * Live Reloads, CSS injections, Localhost tunneling.
 * @link http://www.browsersync.io/docs/options/
 *
 * @param {Mixed} done Done.
 */
const browsersync = done => {
	browserSync.init( config.browserSyncOptions );
	done();
};

// Helper function to allow browser reload with Gulp 4.
const reload = done => {
	browserSync.reload();
	done();
};

// Run:
// gulp copy-vendors.
// Copy all needed dependency assets files from bower_component assets to themes /js, /scss and /fonts folder. Run this task after bower install or bower update

////////////////// All Bootstrap SASS  Assets /////////////////////////
gulp.task( 'copy-vendors', function() {

	const streams = [];

	for (const glob in vendors) {
		const srcGlob = `${path.resolve(paths.node)}/${glob}`;
		let dest = path.join(path.resolve(paths.srcPath), vendors[glob]);

		// console.log('copying vendor into path', {glob, srcGlob, dest});
		streams.push(gulp.src(srcGlob).pipe(gulp.dest(dest)));
	}

    return merge(streams);
});

/**
 * Task: `vendorsStyles`.
 *
 * Compiles Sass, Autoprefixes it and Minifies CSS from the css vendor folder.
 *
 * This task does the following:
 *    1. Gets the source scss file
 *    2. Compiles Sass to CSS
 *    3. Writes Sourcemaps for it
 *    4. Autoprefixes it and generates style.css
 *    5. Renames the CSS file with suffix .min.css
 *    6. Minifies the CSS file and generates style.min.css
 *    7. Injects CSS or reloads the browser via browserSync
 */
gulp.task( 'vendorsStyles', () => {
	return gulp
		.src( path.join( path.resolve( paths.srcPath ), paths.styleVendorSrc ), { allowEmpty: true })
		.pipe( plumber( errorHandler ) )
		.pipe( sourcemaps.init() )
		.pipe( sass( config.sassOptions ) )
		.on( 'error', sass.logError )
		.pipe( sourcemaps.write({ includeContent: false }) )
		.pipe( sourcemaps.init({ loadMaps: true }) )
		.pipe( autoprefixer( config.BROWSERS_LIST ) )
		.pipe( sourcemaps.write( './' ) )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.styleVendorDest ) ) )
		.pipe( filter( '**/*.css' ) ) // Filtering stream to only css files.
		.pipe( mmq({ log: true }) ) // Merge Media Queries only for .min.css version.
		.pipe( browserSync.stream() ) // Reloads style.css if that is enqueued.
		.pipe( rename({ suffix: '.min' }) )
		.pipe( minifycss({ maxLineLen: 10 }) )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.styleVendorDest ) ) )
		.pipe( filter( '**/*.css' ) ) // Filtering stream to only css files.
		.pipe( browserSync.stream() ) // Reloads style.min.css if that is enqueued.
		.pipe( notify({ message: '\n\n✅  ===> STYLES — completed!\n', onLast: true }) );
});

/**
 * Task: `styles`.
 *
 * Compiles Sass, Autoprefixes it and Minifies CSS from the css source folder.
 *
 * This task does the following:
 *    1. Gets the source scss file
 *    2. Compiles Sass to CSS
 *    3. Writes Sourcemaps for it
 *    4. Autoprefixes it and generates style.css
 *    5. Renames the CSS file with suffix .min.css
 *    6. Minifies the CSS file and generates style.min.css
 *    7. Injects CSS or reloads the browser via browserSync
 */
gulp.task( 'customStyles', () => {
	return gulp
		.src( path.join( path.resolve( paths.srcPath ), paths.styleCustomSrc ), { allowEmpty: true })
		.pipe( plumber( errorHandler ) )
		.pipe( sourcemaps.init() )
		.pipe( sass( config.sassOptions ) )
		.on( 'error', sass.logError )
		.pipe( sourcemaps.write({ includeContent: false }) )
		.pipe( sourcemaps.init({ loadMaps: true }) )
		.pipe( autoprefixer( config.BROWSERS_LIST ) )
		.pipe( sourcemaps.write( './' ) )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.styleCustomDest ) ) )
		.pipe( filter( '**/*.css' ) ) // Filtering stream to only css files.
		.pipe( mmq({ log: true }) ) // Merge Media Queries only for .min.css version.
		.pipe( browserSync.stream() ) // Reloads style.css if that is enqueued.
		.pipe( rename({ suffix: '.min' }) )
		.pipe( minifycss({ maxLineLen: 10 }) )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.styleCustomDest ) ) )
		.pipe( filter( '**/*.css' ) ) // Filtering stream to only css files.
		.pipe( browserSync.stream() ) // Reloads style.min.css if that is enqueued.
		.pipe( notify({ message: '\n\n✅  ===> STYLES — completed!\n', onLast: true }) );
});

/**
 * Task: `stylesRTL`.
 *
 * Compiles Sass, Autoprefixes it, Generates RTL stylesheet, and Minifies CSS.
 *
 * This task does the following:
 *    1. Gets the source scss file
 *    2. Compiles Sass to CSS
 *    4. Autoprefixes it and generates style.css
 *    5. Renames the CSS file with suffix -rtl and generates style-rtl.css
 *    6. Writes Sourcemaps for style-rtl.css
 *    7. Renames the CSS files with suffix .min.css
 *    8. Minifies the CSS file and generates style-rtl.min.css
 *    9. Injects CSS or reloads the browser via browserSync
 */
gulp.task( 'stylesRTL', () => {
	return gulp
		.src( path.join( path.resolve( paths.srcPath ), paths.styleCustomSrc ), { allowEmpty: true })
		.pipe( plumber( errorHandler ) )
		.pipe( sourcemaps.init() )
		.pipe( sass( config.sassOptions ) )
		.on( 'error', sass.logError )
		.pipe( sourcemaps.write({ includeContent: false }) )
		.pipe( sourcemaps.init({ loadMaps: true }) )
		.pipe( autoprefixer( config.BROWSERS_LIST ) )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( rename({ suffix: '-rtl' }) ) // Append "-rtl" to the filename.
		.pipe( rtlcss() ) // Convert to RTL.
		.pipe( sourcemaps.write( './' ) ) // Output sourcemap for style-rtl.css.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.styleCustomDest ) ) )
		.pipe( filter( '**/*.css' ) ) // Filtering stream to only css files.
		.pipe( browserSync.stream() ) // Reloads style.css or style-rtl.css, if that is enqueued.
		.pipe( mmq({ log: true }) ) // Merge Media Queries only for .min.css version.
		.pipe( rename({ suffix: '.min' }) )
		.pipe( minifycss({ maxLineLen: 10 }) )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.styleCustomDest ) ) )
		.pipe( filter( '**/*.css' ) ) // Filtering stream to only css files.
		.pipe( browserSync.stream() ) // Reloads style.css or style-rtl.css, if that is enqueued.
		.pipe( notify({ message: '\n\n✅  ===> STYLES RTL — completed!\n', onLast: true }) );
});

/**
 * Task: `vendorsJS`.
 *
 * Concatenate and uglify vendor JS scripts.
 *
 * This task does the following:
 *     1. Gets the source folder for JS vendor files
 *     2. Concatenates all the files and generates vendors.js
 *     3. Renames the JS file with suffix .min.js
 *     4. Uglifes/Minifies the JS file and generates vendors.min.js
 */
gulp.task( 'vendorsJS', () => {
    /// Set the babel presets
    if (config.babelOptions) {
        config.babelOptions.presets = config.babelOptions.presets.map((preset, i) => {
            if (preset === '@babel/preset-env' && !Array.isArray(config.babelOptions.presets[i]) )
            {
                return [ '@babel/preset-env', // Preset to compile your modern JS to ES5.
                    {
                        targets: { browsers: config.BROWSERS_LIST } // Target browser list to support.
                    }]
            } else {
                return preset;
            }
        });
    } else {
        config.babelOptions = {
            presets: [
                [
                    '@babel/preset-env', // Preset to compile your modern JS to ES5.
                    {
                        targets: { browsers: config.BROWSERS_LIST } // Target browser list to support.
                    }
                ]
            ]
        };
    }

	return gulp
		.src( path.join( path.resolve( paths.srcPath ), paths.jsVendorSrc ), { since: gulp.lastRun( 'vendorsJS' ) }) // Only run on changed files.
		.pipe( plumber( errorHandler ) )
        .pipe( babel( config.babelOptions ) )
		.pipe( remember( path.join( path.resolve( paths.srcPath ), paths.jsVendorSrc ) ) ) // Bring all files back to stream.
		.pipe( concat( paths.jsVendorFileName + '.js' ) )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.jsVendorDest ) ) )
		.pipe(
			rename({
				basename: paths.jsVendorFileName,
				suffix: '.min'
			})
		)
		.pipe( uglify() )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.jsVendorDest ) ) )
		.pipe( notify({ message: '\n\n✅  ===> VENDOR JS — completed!\n', onLast: true }) );
});

/**
 * Task: `customJS`.
 *
 * Concatenate and uglify custom JS scripts.
 *
 * This task does the following:
 *     1. Gets the source folder for JS custom files
 *     2. Concatenates all the files and generates custom.js
 *     3. Renames the JS file with suffix .min.js
 *     4. Uglifes/Minifies the JS file and generates custom.min.js
 */
gulp.task( 'customJS', () => {
	return gulp
		.src( path.join( path.resolve( paths.srcPath ), paths.jsCustomSrc ), { since: gulp.lastRun( 'customJS' ) }) // Only run on changed files.
		.pipe( plumber( errorHandler ) )
        .pipe( babel( config.babelOptions ) )
		.pipe( remember( path.join( path.resolve( paths.srcPath ), paths.jsCustomSrc ) ) ) // Bring all files back to stream.
		.pipe( concat( paths.jsCustomFileName + '.js' ) )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.jsCustomDest ) ) )
		.pipe(
			rename({
				basename: paths.jsCustomFileName,
				suffix: '.min'
			})
		)
		.pipe( uglify() )
		.pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.jsCustomDest ) ) )
		.pipe( notify({ message: '\n\n✅  ===> CUSTOM JS — completed!\n', onLast: true }) );
});

/**
 * Task: `images`.
 *
 * Minifies PNG, JPEG, GIF and SVG images.
 *
 * This task does the following:
 *     1. Gets the source of images raw folder
 *     2. Minifies PNG, JPEG, GIF and SVG images
 *     3. Generates and saves the optimized images
 *
 * This task will run only once, if you want to run it
 * again, do it with the command `gulp images`.
 *
 * Read the following to change these options.
 * @link https://github.com/sindresorhus/gulp-imagemin
 */
gulp.task( 'images', () => {
	return gulp
		.src( path.join( path.resolve( paths.srcPath ), paths.imgSrc ) )
		.pipe(
			cache(
				imagemin([
					imagemin.gifsicle({ interlaced: true }),
					imagemin.jpegtran({ progressive: true }),
					imagemin.optipng({ optimizationLevel: 3 }), // 0-7 low-high.
					imagemin.svgo({
						plugins: [ { removeViewBox: true }, { cleanupIDs: false } ]
					})
				]), { name: 'images' }
			)
		)
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.imgDest ) ) )
		.pipe( notify({ message: '\n\n✅  ===> IMAGES — completed!\n', onLast: true }) );
});

/**
 * Task: `clear-images-cache`.
 *
 * Deletes the images cache. By running the next "images" task,
 * each image will be regenerated.
 */
gulp.task( 'clearImagesCache', function( done ) {
	return cache.clear({ name: 'images ' }, done );
});

/**
 * Task: `fonts`.
 *
 * Copies src fonts to their destination
 *
 * This task does the following:
 *     1. Gets the source of fonts folder
 *     2. Saves fonts to the destination folder
 *
 * This task will run only once, if you want to run it
 * again, do it with the command `gulp fonts`.
 *
 * Read the following to change these options.
 * @link https://github.com/sindresorhus/gulp-imagemin
 */
gulp.task( 'fonts', ( done ) => {
	return gulp
		.src( path.join( path.resolve( paths.srcPath ), paths.fontSrc ) )
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.fontDest ) ) )
		.pipe( notify({ message: '\n\n✅  ===> FONTS — completed!\n', onLast: true }) )
		.on( 'end', done );
});

/**
 * WP POT Translation File Generator.
 *
 * This task does the following:
 * 1. Gets the source of all the PHP files
 * 2. Sort files in stream by path or any custom sort comparator
 * 3. Applies wpPot with the variable set at the top of this file
 * 4. Generate a .pot file of i18n that can be used for l10n to build .mo file
 */
gulp.task( 'translate', () => {

	// Set the wpPotOptions paths from the paths in the configuration
	config.wpPotOptions.translationDestination = path.join( path.join( path.resolve( paths.srcPath ), paths.translationDest ) );
	config.wpPotOptions.translationFile = path.join( path.join( path.resolve( paths.srcPath ), paths.translationSrc ) );

	return gulp
		.src( path.join( path.resolve( paths.srcPath ), paths.watchPhp ) )
		.pipe( sort() )
		.pipe( wpPot( config.wpPotOptions )	)
		.pipe( gulp.dest( path.join( path.resolve( paths.distPath ), paths.translationDest, paths.translationFileName ) ) )
		.pipe( notify({ message: '\n\n✅  ===> TRANSLATE — completed!\n', onLast: true }) );
});

/**
 * Build Tasks.
 *
 * Runs all compilation tasks and performs staging and production distribution packages.
 */

/**
 * Task: `compile`.
 *
 * Runs all compilation tasks.
 *
 * This task runs the following tasks in parallel:
 *     * customStyles
 *     * vendorsStyles
 *     * vendorsJS
 *     * customJS
 *     * images
 *     * fonts
 */
gulp.task(
	'compile',
	gulp.parallel( 'vendorsStyles', 'customStyles', 'vendorsJS', 'customJS', 'images', 'fonts' )
);

/**
 * Task: `dist`.
 *
 * Copies all of the files into the dist folder.
 *
 * This task runs the following tasks in parallel:
 *     * compile
 *     * translate
 *
 */
gulp.task( 'dist', gulp.series( gulp.parallel( 'compile', 'translate' ), () => {
	return gulp.src([ `${path.resolve( paths.srcPath )}/**/*`, `!${path.join( path.resolve( paths.srcPath ), 'assets' )}/**` ])
		.pipe( gulp.dest( path.resolve( paths.distPath ) ) );
}) );


/**
 * Task: `clean-vendor-assets`.
 *
 * Deletes the files distributed by the copy-vendors task into the src/assets/ folder
 *
 */
gulp.task( 'clean-vendor-assets', function() {
    let vendorAssetsPaths = [ paths.vendor ];

    for (const glob in vendors) {
        let dest = vendors[glob];
        dest = dest[0] == '~' ? paths[dest.substr(1)] : `${paths.vendor}${dest}`;
        if ((glob.indexOf('*') == -1) && (config.vendorExtensions.indexOf(path.extname(glob)) !== -1)) {
            const split = glob.split('/');
            dest = `${dest}${split[split.length - 1]}`;
        }
        vendorAssetsPaths.push(path.resolve(dest));
    }

    return del( vendorAssetsPaths );
});

/**
 * Task: `clean`.
 *
 * Deletes the contents of the dist folder.
 */
gulp.task( 'clean', () => {
	return gulp.src( path.resolve( config.paths.distPath ), { allowEmpty: true, read: false })
		.pipe( clean() );
});

/**
 * Watch Tasks.
 *
 * Watches for file changes and runs specific tasks.
 */
gulp.task(
	'default',
	gulp.parallel( 'vendorsStyles', 'customStyles', 'vendorsJS', 'customJS', 'images', browsersync, () => {
		gulp.watch( path.join( path.resolve( paths.srcPath ), paths.watchPhp ), reload ); // Reload on PHP file changes.
		gulp.watch( path.join( path.resolve( paths.srcPath ), paths.watchStyles ), gulp.series( 'vendorsStyles' ) ); // Reload on SCSS file changes.
		gulp.watch( path.join( path.resolve( paths.srcPath ), paths.watchStyles ), gulp.series( 'customStyles' ) ); // Reload on SCSS file changes.
		gulp.watch( path.join( path.resolve( paths.srcPath ), paths.watchJsVendor ), gulp.series( 'vendorsJS', reload ) ); // Reload on vendorsJS file changes.
		gulp.watch( path.join( path.resolve( paths.srcPath ), paths.watchJsCustom ), gulp.series( 'customJS', reload ) ); // Reload on customJS file changes.
		gulp.watch( path.join( path.resolve( paths.srcPath ), paths.imgSrc ), gulp.series( 'images', reload ) ); // Reload on customJS file changes.
	})
);
