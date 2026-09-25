#!/usr/bin/env bash
set -e

# Remove any cached GUI opencv package if present
pip uninstall -y opencv-python 2>/dev/null || true

# Pre-install headless opencv so downstream dependencies don't attempt to pull GUI opencv
pip install --no-cache-dir opencv-python-headless

pip install -r requirements.txt
