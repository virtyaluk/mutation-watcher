module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        eslint: {
            target: ['<%= pkg.main %>', 'Gruntfile.js', 'test/test.js']
        },
        uglify: {
            build: {
                options: {
                    compress: {
                        properties: true,
                        drop_debugger: true,
                        conditionals: true,
                        booleans: true,
                        loops: true,
                        unused: true,
                        join_vars: true,
                        drop_console: true
                    },
                    preserveComments: false,
                    screwIE8: true,
                    banner: '/** \r\n * <%= pkg.name %> <%= pkg.version %> \r\n * <%= pkg.homepage %> \r\n' +
                    ' * \r\n * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> \r\n' +
                    ' * Licensed under the <%= pkg.license %> license. \r\n */\n\n',
                    sourceMap: true,
                    sourceMapName: 'dist/mutationwatcher.min.js.map'
                },
                files: {
                    'dist/mutationwatcher.min.js': ['MutationWatcher.js']
                }
            }
        },
        clean: ['dist', 'test/results'],
        /*eslint camelcase: 0*/
        mocha_phantomjs: {
            ci: {
                options: {
                    reporter: 'xunit',
                    output: 'test/results/result.xml'
                },
                files: {
                    src: ['test/index.html']
                }
            },
            build: {
                options: {
                    reporter: 'spec'
                },
                files: {
                    src: ['test/index.html']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha-phantomjs');
    grunt.loadNpmTasks('grunt-bell');

    grunt.registerTask('test', ['eslint', 'mocha_phantomjs:build']);
    grunt.registerTask('ci', ['eslint', 'mocha_phantomjs:ci']);
    grunt.registerTask('build', ['clean', 'uglify']);
    grunt.registerTask('default', ['test', 'build', 'bell']);
};