var generators = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('lodash');
var fs = require('fs');
var del = require('del');
var download = require('download');
var downloadStatus = require('download-status');
var walk = require('walk');
var path = require('path');

module.exports = generators.Base.extend({
	prompting: {
		askToUser: function askToUser() {
			var done = this.async();

			this.log(yosay(
				'Welcome to the kickass ' + chalk.red('wordpress-s-theme') + ' generator!'
			));

			var prompts = [
				{
					type: 'input',
					name: 'proxyname',
					message: 'Localhost address',
					default: 'localhost'
        },
				{
					type: 'input',
					name: 'domenname',
					message: 'If you want to add a domain site',
					default: ''
        },
				{
					type: 'input',
					name: 'themename',
					message: 'Theme Name',
					default: 'Theme Name'
        },
				{
					type: 'input',
					name: 'themeslug',
					message: 'Theme Slug',
					default: 'Theme Slug'
        },
				{
					type: 'input',
					name: 'themeuri',
					message: 'Theme URI',
					default: 'https://example.com/themeuri/'
        },
				{
					type: 'input',
					name: 'author',
					message: 'Author',
					default: 'Author'
        },
				{
					type: 'input',
					name: 'authoruri',
					message: 'Author URI',
					default: 'https://example.com/authoruri/'
        },
				{
					type: 'input',
					name: 'authoremail',
					message: 'Author Email',
					default: 'info@example.com'
        },
				{
					type: 'input',
					name: 'description',
					message: 'Description',
					default: 'Description'
        },
				{
					type: 'input',
					name: 'bugreport',
					message: 'Bug Report',
					default: 'https://example.com/bugreport/'
        },
				{
					type: 'confirm',
					name: 'gitignore',
					message: 'Would you like to add a ' + chalk.white('.gitignore') + ' file?',
					default: true
        },
				{
					type: 'confirm',
					name: 'editorconfig',
					message: 'Would you like to add a ' + chalk.white('.editorconfig') + ' file?',
					default: true
        },
				{
					type: 'confirm',
					name: 'stylelintrc',
					message: 'Would you like to add a ' + chalk.white('.stylelintrc') + ' file?',
					default: true
        },
				{
					type: 'confirm',
					name: 'npmrc',
					message: 'Would you like to add a ' + chalk.white('.npmrc') + ' file?',
					default: true
        },
				{
					type: 'confirm',
					name: 'npmsetup',
					message: 'Would you like to setup a configuration ready to use?',
					default: true
        }
      ];

			this.prompt(prompts, function (props) {
				this.props = props;
				this.props.prefix = _.snakeCase(this.props.themeslug) + '_';
				this.props.themeslug = _.kebabCase(this.props.themeslug);

				done();
			}.bind(this));
		}
	},

	writing: {
		installUnderscores: function installUnderscores() {
			var done = this.async();
			var callback = function (error, remote) {
				if (error) {
					done(error);
				}

				done();
			}.bind(this);

			this.log(chalk.yellow('\nLet\'s grab the latest version of Underscores...'));

			new download({
					mode: '755',
					extract: true,
					strip: 1
				})
				.get('https://github.com/Automattic/_s/archive/master.tar.gz')
				.dest('.')
				.use(downloadStatus())
				.run(callback);
			if (!fs.existsSync('sass/theme.scss')) {
				fs.writeFileSync('sass/theme.scss', '/*!\n Theme Name: _s \n*/', 'utf-8');
			}
			if (!fs.existsSync('css')) {
				fs.mkdirSync('css');
			}
			if (!fs.existsSync('fonts')) {
				fs.mkdirSync('fonts');
			}
			if (!fs.existsSync('images')) {
				fs.mkdirSync('images');
			}
		},

		deleteFiles: function deleteFiles() {
			var done = this.async();
			var dir = this.destinationRoot();

			var unusedFiles = ['.travis.yml', 'codesniffer.ruleset.xml', 'README.md'];

			this.log(chalk.yellow('\nDeleting some unused files...'));

			// Delete unused files
			unusedFiles = _.map(unusedFiles, function (file) {
				return dir + '/' + file;
			});

			del(unusedFiles).catch(function (error) {
					done(error);
				})
				.then(paths => {
					this.log(chalk.cyan(paths.join('\n')));

					done();
				});
		},

		parseThemeFiles: function parseThemeFiles() {
			var done = this.async();
			var _this = this;
			var walker;

			_this.log(chalk.yellow('\nParsing theme files...'));

			walker = walk.walk('.');

			_this.log.write().info('Please wait...');

			walker.on("file", function (root, fileStats, next) {
				var filePath = root + '/' + fileStats.name;

				if (path.extname(fileStats.name) == '.php') {
					fs.readFile(filePath, 'utf8', function (err, data) {
						if (err) {
							done(error);
						}

						var result;

						result = data.replace(/'_s'/g, "'" + _this.props.themeslug + "'");
						result = result.replace(/_s_/g, _this.props.prefix);
						result = result.replace(/ _s/g, ' ' + _this.props.themename);
						result = result.replace(/_s-/g, _this.props.themeslug + '-');

						fs.writeFile(filePath, result, 'utf8', function (err) {
							if (err) {
								done(error);
							}
						});

						next();
					});
				} else if (path.extname(fileStats.name) == '.css' || fileStats.name == 'style.scss' || fileStats.name == 'woocommerce.scss' || fileStats.name == 'theme.scss' || fileStats.name == 'gulpfile.js') {
					fs.readFile(filePath, 'utf8', function (err, data) {
						if (err) {
							done(error);
						}

						var result;

						result = data.replace(/(Theme Name: )(.+)/g, '$1' + _this.props.themename);
						result = result.replace(/(Theme URI: )(.+)/g, '$1' + _this.props.themeuri);
						result = result.replace(/(Author: )(.+)/g, '$1' + _this.props.author);
						result = result.replace(/(Author URI: )(.+)/g, '$1' + _this.props.authoruri);
						result = result.replace(/(Description: )(.+)/g, '$1' + _this.props.description);
						result = result.replace(/(Text Domain: )(.+)/g, '$1' + _this.props.themeslug);
						result = result.replace(/_s is based on Underscores/g, _this.props.themename + ' is based on Underscores');
						result = result.replace(/\@import "variables-site\/variables-site";/g, '\n\n// bower:scss' + '\n\n// endbower' + '\n\n@import "variables-site\/variables-site";');
						result = result.replace(/\@import "media\/media";/g, '@import "media\/media";' + '\n\n/*--------------------------------------------------------------\n\n' + '# Theme\n' + '--------------------------------------------------------------*/\n' + '@import "theme";\n');

						fs.writeFile(filePath, result, 'utf8', function (err) {
							if (err) {
								done(error);
							}
						});

						next();
					});
				} else if (fileStats.name === 'readme.txt') {
					fs.readFile(filePath, 'utf8', function (err, data) {
						if (err) {
							done(error);
						}

						var result;

						result = data.replace(/=== _s ===/g, '=== ' + _this.props.themename + ' ===');
						result = result.replace(/A starter theme called _s, or underscores./g, _this.props.description);
						result = result.replace(/(== Description ==\n\n)(.+)/g, '$1' + 'Long description here');
						result = result.replace(/== Frequently Asked Questions ==[\s\S]*?== Credits ==/g, '== Credits ==');

						fs.writeFile(filePath, result, 'utf8', function (err) {
							if (err) {
								done(error);
							}
						});

						next();
					});
				} else if (fileStats.name === '_s.pot') {
					fs.readFile(filePath, 'utf8', function (err, data) {
						if (err) {
							done(error);
						}

						var result;

						result = data.replace(/Copyright (C) 2016 Automattic/g, 'Copyright (C) 2017 ' + _this.props.author);
						result = result.replace(/Project-Id-Version: _s/g, 'Project-Id-Version: ' + _this.props.themename);
						result = result.replace(/Report-Msgid-Bugs-To: https:\/\/wordpress.org\/tags\/_s/g, 'Report-Msgid-Bugs-To: ' + _this.props.bugreport);
						result = result.replace(/Language-Team: LANGUAGE <LL@li\.org>/g, 'Language-Team: ' + _this.props.author + '<' + _this.props.authoremail + '>');
						result = result.replace(/@ _s/g, '@ ' + _this.props.themeslug);

						fs.writeFile(filePath, result, 'utf8', function (err) {
							if (err) {
								done(error);
							}
						});

						fs.rename(filePath, './languages/' + _this.props.themeslug + '.pot');

						next();
					});
				} else {
					next();
				}
			});

			walker.on("errors", function (root, nodeStatsArray, next) {
				done(error);
				next();
			});

			walker.on("end", function () {
				done();
			});
		},

		packageFiles: function packageFiles() {
			this.log(chalk.yellow('\nCopying configuration files...'));

			if (this.props.gitignore) {
				this.fs.copy(
					this.templatePath('_gitignore'),
					this.destinationPath('.gitignore')
				);
			}

			if (this.props.editorconfig) {
				this.fs.copy(
					this.templatePath('_editorconfig'),
					this.destinationPath('.editorconfig')
				);
			}

			if (this.props.stylelintrc) {
				this.fs.copy(
					this.templatePath('_stylelintrc'),
					this.destinationPath('.stylelintrc')
				);
			}

			if (this.props.npmrc) {
				this.fs.copy(
					this.templatePath('_npmrc'),
					this.destinationPath('.npmrc')
				);
			}

			if (this.props.npmsetup) {
				this.fs.copyTpl(
					this.templatePath('_package.json'),
					this.destinationPath('package.json'), {
						package_name: this.props.themeslug,
						package_description: this.props.description,
						package_author: this.props.author,
						proxy_address: this.props.proxyname,
						proxy_domain: this.props.domenname,
						theme_domain: this.props.themeslug,
						package_name: this.props.themename,
						theme_bugreport: this.props.bugreport,
						author: this.props.author,
						author_email: this.props.authoremail
					}
				);

				this.fs.copy(
					this.templatePath('_gulpfile.js'),
					this.destinationPath('gulpfile.js'), {
						theme_domain: this.props.themeslug
					}
				);

			}
		}
	},

	install: {
		installPackages: function installPackages() {
			if (this.props.npmsetup) {
				this.log(chalk.yellow('\nInstalling required packages...'));

				this.npmInstall(['autoprefixer'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['browser-sync'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['imagemin-cli'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['jscs'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['mkdirp'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['node-sass'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['npm-run-all'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['onchange'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['postcss-cli'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['rimraf'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['gulp'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['uglify-js'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['wiredep-cli'], {
					'saveDev': true,
					'global': true
				});
				this.npmInstall(['bower'], {
					'saveDev': true,
					'global': true
				});
			}
		}
	},

	end: {
		endMessage: function endMessage() {
			if (this.props.npmsetup) {
				this.log(chalk.red('\nWarning! \nRun: ') + chalk.yellow('npm link gulp') + ' to start the development theme');
			}
			this.log(chalk.green('\nAll Done!!\n------------------------\n'));

			if (this.props.npmsetup) {
				this.log('\nRun ' + chalk.green('npm run watch ') + ' to start the development and ' + chalk.green('npm run build') + ' to create a file in ' + chalk.white('dist/' + this.props.themeslug) + ' ready for production.');
			}
		}
	},
});