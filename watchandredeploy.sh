#!/bin/bash

$(echo "Starting Watch Script")

# what repository do we want to watch.
REPOSITORY="origin/master"
SERVERFILE="app.js"
LATEST_REVISION="none"

# loop forever, need to kill the process.
while [ 1 ]; do

    # get the latest revision SHA.
    CURRENT_REVISION=$(git rev-parse $REPOSITORY)

    # if we haven't seen that one yet, then we know there's new stuff.
    if [ $LATEST_REVISION != $CURRENT_REVISION ]; then

        # mark the newest revision as seen.
        LATEST_REVISION=$CURRENT_REVISION

        # pull down the latest code
        $(echo "Retrieving New Master Code")
        $(git pull origin master)

        # restart the forever process
        $(echo "Restarting forever process")
        $(sudo forever restart $SERVERFILE)

    fi
    sleep 60
done