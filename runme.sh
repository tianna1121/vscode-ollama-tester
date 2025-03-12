#!/bin/bash
npm run compile

# npm install -g vsce
vsce package
ls *.vsix