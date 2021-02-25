/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';

const root = path.dirname(path.dirname(__dirname));
<<<<<<< HEAD
const version = process.versions.node;
const node = process.platform === 'win32' ? 'node.exe' : 'node';
const nodePath = path.join(root, '.build', 'node', `v${version}`, `${process.platform}-${process.arch}`, node);

=======
const yarnrcPath = path.join(root, 'remote', '.yarnrc');
const yarnrc = fs.readFileSync(yarnrcPath, 'utf8');
const version = /^target\s+"([^"]+)"$/m.exec(yarnrc)![1];

const platform = process.platform;
const arch = platform === 'darwin' ? 'x64' : process.arch;

const node = platform === 'win32' ? 'node.exe' : 'node';
const nodePath = path.join(root, '.build', 'node', `v${version}`, `${platform}-${arch}`, node);

>>>>>>> 89b6e0164fa770333755b11504e19a4232b1a2d4
console.log(nodePath);
