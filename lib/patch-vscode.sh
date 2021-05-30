#!/bin/bash

# rm $(find . | grep '/.DS_Store$'); rm $(find . | grep '/yarn.lock$'); git diff --minimal vscode-1.56.2 vscode >vscode-diff.patch
# rm $(find . | grep '/.DS_Store$'); rm $(find . | grep '/yarn.lock$'); git diff --minimal vscode-1.56.2 vscode | grep '/dev/null' -A 1 | grep -v '^--' | sed 's/^+++ b\/vscode\///g' | grep -v 'yarn.lock' >b

# cp -r vscode/coder.js                                         vscode-diff/coder.js                                       
# cp -r vscode/src/typings/electron.d.ts                        vscode-diff/src/typings/electron.d.ts                      
# cp -r vscode/src/typings/keytar.d.ts                          vscode-diff/src/typings/keytar.d.ts                        
# cp -r vscode/src/typings/native-keymap.d.ts                   vscode-diff/src/typings/native-keymap.d.ts                 
# cp -r vscode/src/vs/server                                    vscode-diff/src/vs/server                                  
# cp -r vscode/src/vs/workbench/services/localizations/browser  vscode-diff/src/vs/workbench/services/localizations/browser
# rm vscode-diff/src/vs/server/common/util.ts

cp -rf vscode-diff/* vscode/
patch -d vscode -p 2 <vscode-diff.patch
ln -s ../../../../../../src/node/proxy_agent.ts  vscode/src/vs/base/node/proxy_agent.ts
ln -s ../../../../typings/ipc.d.ts               vscode/src/vs/ipc.d.ts
ln -s ../../../../../../src/common/util.ts       vscode/src/vs/server/common/util.ts