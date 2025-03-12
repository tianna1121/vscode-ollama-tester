#!/bin/bash
rm -rf dist/

npm run compile

# npm install -g vsce
vsce package
ls *.vsix