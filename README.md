localmarket
===========

LocalMarket Site

sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080

Set the app to port 8080 to run not as root.

To deploy npm install forever -g

Run server.js with forever and then run nohup sh watchandredeploy.sh >& logfile.log & to capture the watch process

Config
======

Configuration lives in the server/config folder but can also be added as a separate path in Config.js within utils. By default additional configuration can be added to the bootstrapPaths.

Development
===========

Install node supervisor https://github.com/isaacs/node-supervisor to watch files for changes triggering a server restart while coding

supervisor -e dust,js -w ../server/ server.js

The above command ran within the source/server/ directory will watch the entire server directory for changes and will also look for changes in files with the .dust extension, unfortunately there is no way to turn off caching for dust templates at the moment


