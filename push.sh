#!/bin/bash

git fetch
git rebase origin
dotcloud push stratotracker
echo Launching Logs
dotcloud logs stratotracker.www
