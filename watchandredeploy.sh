#!/bin/bash

$(echo "Starting Watch Script")

# what repository do we want to watch.
repository="origin/master"
serverFile="app.js"
latest_revision="none"

# loop forever, need to kill the process.
while [ 1 ]; do

    # get the latest revision SHA.
    current_revision=$(git rev-parse $repository)

    # if we haven't seen that one yet, then we know there's new stuff.
    if [ $latest_revision != $current_revision ]; then

        # mark the newest revision as seen.
        latest_revision=$current_revision

        # restart the node forever.
        echo "Retrieving New Master Code"
        `git pull origin master`
        echo "Restarting forever process"
        `sudo forever restart $serverFile`

    fi
    sleep 60
done