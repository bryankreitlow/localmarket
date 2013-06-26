/*jslint node:true, es5:true */
"use strict";

var child_process = require('child_process'),
  path = require('path'),
  imageMapper = require('./source/server/util/ImageMapper'),
  jsAssets = require('./source/client/config/default.js').build_config;

var mode = (process.env.NODE_ENV === 'production') ? 'production' : 'development';
var mode_filter = (mode === 'production') ? 'development' : 'production';

var gruntConfig = {
  pkg: require('./package.json'),

  concurrent: {
    production: {
      tasks: [ 'nodemon:production', 'watch'],
      options: {
        logConcurrentOutput: true
      }
    },
    development: {
      tasks: [ 'nodemon:development', 'watch'],
      options: {
        logConcurrentOutput: true
      }
    }
  },

  nodemon: {
    development: {
      options: {
        file: 'server.js',
        watchedExtensions: ['restart'],
        debug: false
      }
    },
    production: {
      options: {
        file: 'server.js',
        watchedExtensions: ['restart'],
        debug: false
      }
    }
  },

  watch: {
    developer_config: {
      files: ['./source/server/config/*.json', './source/client/config/default.js'],
      tasks: ['uglify', 'uglify-patch', 'restart']
    },
    html_images: {
      files: ['static/assets/images/*'],
      tasks: ['image_mapper', 'less', 'restart']
    },
    html_less: {
      files: ['views/**/*.less'],
      tasks: ['less']
    },
    server_js: {
      files: ['server.js', 'source/server/**/*.js'],
      tasks: ['restart']
    },
    html_js: {
      files: [jsAssets, 'source/client/source/js/**/*.js'],
      tasks: ['uglify', 'uglify-patch']
    },
    ng_templates: {
      files: ['source/client/source/js/**/*.tpl.html'],
      tasks: ['html2js']
    },
    html_views: {
      files: ['views/**/*.html'],
      tasks: ['restart']
    }
  },

  less: {
    development: {
      options: {
        paths: ['source'],
        dumpLineNumbers: 'all',
        compress: false
      },
      files: { 'static/assets/css/all-dev.css' : 'source/client/source/less/all.less' }
    },
    production: {
      options: {
        paths: ['source'],
        dumpLineNumbers: false,
        yuicompress: true
      },
      files: { 'static/assets/css/all-min.css' : 'source/client/source/less/all.less' }
    }

  },

  html2js: {
    /**
     * These are the templates from `src/app`.
     */
    app: {
      options: {
        base: 'source/client/source/js/app'
      },
      src: [  'source/client/source/js/app/**/*.tpl.html' ],
      dest: 'source/client/source/js/build/templates-app.js'
    },

    /**
     * These are the templates from `src/components`.
     */
    component: {
      options: {
        base: 'source/client/source/js/components'
      },
      src: [ 'source/client/source/js/components/**/*.tpl.html' ],
      dest: 'source/client/source/js/build/templates-components.js'
    }
  },

  uglify: {
    development: {
      options: {
        mangle: false,
        preserveComments: 'all',
        compress: false,
        beautify: true,

        sourceMap: 'static/assets/js/build-dev.map.js',
        sourceMapPrefix: 1,
        sourceMapRoot: 'file://'+process.cwd()+'/source',
        sourceMappingURL: '/js/build-dev.js.map'

      },
      files: { 'static/assets/js/build-dev.js' : jsAssets }
    },
    production: {
      options: {
        mangle: true,
        preserveComments: false,
        compress: {
          unused:false
        }
      },
      files: { 'static/assets/js/build-min.js' : jsAssets }
    }
  }
};

//
//  Function to remove either production or development objects from the config
//
var filter = function(options, mode) {
  for(var key in options) {
    if (options[key].hasOwnProperty(mode))
      delete options[key][mode];
  }
};

// preform the filter
filter(gruntConfig, mode_filter);



module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig(gruntConfig);

  //
  //  TASK: Reboot node.js app
  //
  grunt.registerTask('restart','', function() {
    grunt.log.writeln('triggering restart');
    child_process.exec("touch grunt.restart");
  });

  //
  //  TASK: Build image maps for LESS and Node.js
  //
  grunt.registerTask('image_mapper','', function() {
    imageMapper.build('static/assets/images', '/assets/images', '.');
  });

  //
  //  TASK: Patch Uglify map files until issue #58 resolved re: update to sourcemap comment format
  //  https://github.com/gruntjs/grunt-contrib-uglify/issues/58
  //
  grunt.registerTask('uglify-patch','', function() {
    if (mode === 'development') {
      child_process.exec("sed 's|//#|//@|' public/js/build-dev.js > /tmp/build-dev.js && cp /tmp/build-dev.js public/js/build-dev.js");
    }
  });

  //
  // If any of the destination files do not exist build them
  //
  grunt.registerTask('build-if-not-exist','', function() {
    var mode_ext = (mode === 'production') ? 'min' : 'dev';

    if (!grunt.file.exists('source/client/source/less/image-map.less') ||
      !grunt.file.exists('source/server/gen.source/image-map.json') ||
      !grunt.file.exists('static/assets/css/all-'+ mode_ext +'.css') ||
      !grunt.file.exists('static/assets/js/build-'+ mode_ext +'.js')) {
      grunt.task.run(['build']);
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-html2js');

  // Default task(s).
  grunt.registerTask('default', ['build-if-not-exist', 'concurrent']);
  grunt.registerTask('build', ['image_mapper', 'less', 'html2js', 'uglify', 'uglify-patch']);

};
