/**
 * WPGulp Configuration File
 *
 * 1. Edit the variables as per your project requirements.
 * 2. In paths you can add <<glob or array of globs>>.
 *
 * @package WPGulp
 */

module.exports = {

	// Project options.
    productURL: './', // Theme/Plugin URL. Leave it like it is, since our gulpfile.js lives in the root folder.
    projectThemeName: 'child-theme',
    projectAppName: 'child-theme-app',

	// Project paths.
	paths: {

        node: './node_modules',
        bower: './bower_components',
		srcPath: './src',
		distPath: './dist',

		// JS Vendor options.
		styleVendorSrc: '/assets/css/vendor/*.{sass,scss}', // Path to CSS vendor folder.
		styleVendorDest: '/assets/css/', // Path to place the compiled CSS vendors file.
		styleVendorFile: 'vendor', // Compiled CSS vendors file name. Default set to vendors i.e. vendors.css.

		// Style options.
		styleCustomSrc: '/assets/css/custom/*.{sass,scss}', // Path to main .scss file.
		styleCustomDest: '/assets/css/', // Path to place the compiled CSS file. Default set to root folder.
		styleCustomFile: 'custom', // Compiled CSS custom file name. Default set to custom i.e. custom.css.

		// JS Vendor options.
		jsVendorSrc: '/assets/js/vendor/*.{js,jsx}', // Path to JS vendor folder.
		jsVendorDest: '/assets/js/', // Path to place the compiled JS vendors file.
		jsVendorFileName: 'vendor', // Compiled JS vendors file name. Default set to vendors i.e. vendors.js.

		// JS Custom options.
		jsCustomSrc: '/assets/js/custom/*.{js,jsx}*', // Path to JS custom scripts folder.
		jsCustomDest: '/assets/js/', // Path to place the compiled JS custom scripts file.
		jsCustomFileName: 'custom', // Compiled JS custom file name. Default set to custom i.e. custom.js.

		// Images options.
		imgSrc: '/assets/img/raw/*', // Source folder of images which should be optimized and watched. You can also specify types e.g. raw/**.{png,jpg,gif} in the glob.
		imgDest: '/assets/img/', // Destination folder of optimized images. Must be different from the imagesSRC folder.

		// Fonts options.
		fontSrc: '/assets/fonts/**/*', // Source folder of images which should be optimized and watched. You can also specify types e.g. raw/**.{png,jpg,gif} in the glob.
		fontDest: '/assets/fonts/', // Destination folder of optimized images. Must be different from the imagesSRC folder.

		// Translation files paths.
		translationFileName: 'WPGULP.pot', // Name of the translation file.
		translationSrc: '/assets/languages/', // Where to save the translation files.
		translationDest: '/assets/languages/', // Where to save the translation files.

		// Watch files paths.
		watchStyles: '/assets/css/vendor/**/*.scss', // Path to all *.scss files inside css folder and inside them.
		watchStylesCustom: '/assets/css/custom/*.scss', // Path to all *.scss files inside css folder and inside them.
		watchJsVendor: '/assets/js/vendor/*.js*', // Path to all vendor JS files.
		watchJsCustom: '/assets/js/custom/*.js*', // Path to all custom JS files.
		watchPhp: '/**/*.php' // Path to all PHP files.
    },

    vendors: {
        vendorExtensions: [ '.js', '.css' ],
        vendorGlobs: { // The vendors and their globs {key,value} == {glob, dest}

            "bootstrap/dist/js/**/*.js": "/assets/js/vendor/bootstrap4",
            "bootstrap/scss/**/*.scss": "/assets/css/vendor/bootstrap4",
            "font-awesome/fonts/**/*.{ttf,woff,woff2,eot,svg}": "/assets/css/fonts",
            "font-awesome/scss/*.scss": "/assets/css/vendor/fontawesome",
            "undescores-for-npm/sass/media/*.scss": "/assets/css/vendor/underscores",
            "undescores-for-npm/js/skip-link-focus-fix.js": "/assets/js/vendor",
            "popper.js/dist/umd/popper.min.js": "/assets/js/vendor",
            "understrap/sass/**/*.scss": "/assets/css/vendor/understrap"

        }
    },

    babelOptions: {

        presets: [
            "@babel/preset-react",
            "@babel/preset-env"
        ]

    },
    
    browserSyncOptions : {

        proxy: "understrap.dev", // Local project URL of your already running WordPress site. Could be something like wpgulp.local or localhost:3000 depending upon your local WordPress setup.
        notify: false,
        open: false,
        injectChanges: true,
        watchEvents: [ 'change', 'add', 'unlink', 'addDir', 'unlinkDir' ]

    },

	// Sass compilation options.
	sassOptions: {
		outputStyle: 'compressed' // Available options → 'compressed' or 'expanded'
	},

	// wpPot translation options.
	wpPotOptions: {
		textDomain: 'WPGULP', // Your textdomain here.
		packageName: 'WPGULP' // Package name.
		// bugReport: // Where can users report bugs.
		// lastTranslator: // Last translator Email ID.
		// team: // Team's Email ID.
	},

	// Browsers you care about for autoprefixing. Browserlist https://github.com/ai/browserslist
	// The following list is set as per WordPress requirements. Though, Feel free to change.
	BROWSERS_LIST: [
		'last 2 version',
		'> 1%',
		'ie >= 11',
		'last 1 Android versions',
		'last 1 ChromeAndroid versions',
		'last 2 Chrome versions',
		'last 2 Firefox versions',
		'last 2 Safari versions',
		'last 2 iOS versions',
		'last 2 Edge versions',
		'last 2 Opera versions'
	]
};
