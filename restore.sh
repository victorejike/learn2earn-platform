#!/bin/bash
# Restore folder name so workspace CWD is valid again
if [ -d "/home/victor2/1talent-platform" ] && [ ! -d "/home/victor2/learn2earn-platform" ]; then
  mv /home/victor2/1talent-platform /home/victor2/learn2earn-platform
  echo "Restored to learn2earn-platform"
elif [ -d "/home/victor2/learn2earn-platform" ]; then
  echo "Already at learn2earn-platform"
else
  echo "ERROR: neither path found"
  ls /home/victor2/
fi
