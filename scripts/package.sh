#!/usr/bin/env bash
# Zips extension/ for the Chrome Web Store into dist/.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./extension/manifest.json').version")
mkdir -p dist
rm -f "dist/lares-$VERSION.zip"
(cd extension && zip -r -X -q "../dist/lares-$VERSION.zip" . -x '.*' -x '*.d.ts')
echo "dist/lares-$VERSION.zip"
