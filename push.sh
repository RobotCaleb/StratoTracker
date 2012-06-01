#!/bin/bash

git fetch
git rebase
dotcloud push stratotracker
echo Launching Logs
dotcloud logs stratotracker.www
