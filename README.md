localmarket
===========

LocalMarket Site

    $ sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080

Set the app to port 8080 to run not as root.

To deploy npm install forever -g

Run server.js with forever and then run nohup sh watchandredeploy.sh >& logfile.log & to capture the watch process

Config
======

Configuration lives in the server/config folder but can also be added as a separate path in Config.js within utils. By default additional configuration can be added to the bootstrapPaths.

Development
===========

Grunt is being used so be sure to do a global install of grunt-cli

	$ sudo npm install -g grunt-cli

From here you can initiate a watch process and build after doing npm install by typing grunt in the command line. The default is for development which includes sourcemapping and no minification. If you want to run it in production mode just type
    $ NODE_ENV=production grunt