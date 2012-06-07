#!/bin/bash

git fetch
git rebase origin master
dotcloud push stratotracker
echo Launching Logs
dotcloud logs stratotracker.www
