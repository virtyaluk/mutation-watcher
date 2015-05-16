"use strict";
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            build: {
                options: {
                    banner: '/* \r\n * <%= pkg.name %> \r\n * <%= pkg.homepage %> \r\n * \r\n * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> \r\n * Licensed under the <%= pkg.licenses.type %> license. \r\n */\n\n',
                    sourceMap: true,
                    sourceMapName: '<%= pkg.name %>.min.js.map'
                },
                files: {
                    '<%= pkg.name %>.min.js': ['<%= pkg.name %>.js']
                }
            }
        },
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
            },
        },
        jshint: {
            jshintrc: '.jshintrc',
            files: ['<%= pkg.name %>.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-mocha-phantomjs');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['jshint', 'mocha_phantomjs:build']);
    grunt.registerTask('travis', ['mocha_phantomjs:ci']);
    grunt.registerTask('build', ['uglify']);
    grunt.registerTask('default', ['test', 'build']);
};