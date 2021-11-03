// This file is a bit weird, so let me explain with some context: we're working
// to implement a tool called "Corepack" in Node. This tool will allow us to
// provide a Yarn shim to everyone using Node, meaning that they won't need to
// run `npm install -g yarn`.
//
// Still, we don't want to break the experience of people that already use `npm
// install -g yarn`! And one annoying thing with npm is that they install their
// binaries directly inside the Node bin/ folder. And Because of this, they
// refuse to overwrite binaries when they detect they don't belong to npm. Which
// means that, since the "yarn" Corepack symlink belongs to Corepack and not npm,
// running `npm install -g yarn` would crash by refusing to override the binary :/
//
// And thus we have this preinstall script, which checks whether Yarn is being
// installed as a global binary, and remove the existing symlink if it detects
// it belongs to Corepack. Since preinstall scripts run, in npm, before the global
// symlink is created, we bypass this way the ownership check.
//
// More info:
// https://github.com/arcanis/pmm/issues/6

if (process.env.npm_config_global) {
    var cp = require('child_process');
    var fs = require('fs');
    var path = require('path');

    try {
        var targetPath = cp.execFileSync(process.execPath, [process.env.npm_execpath, 'bin', '-g'], {
            encoding: 'utf8',
            stdio: ['ignore', undefined, 'ignore'],
        }).replace(/\n/g, '');

        var manifest = require('./package.json');
        var binNames = typeof manifest.bin === 'string'
            ? [manifest.name.replace(/^@[^\/]+\//, '')]
            : typeof manifest.bin === 'object' && manifest.bin !== null
            ? Object.keys(manifest.bin)
            : [];

        binNames.forEach(function (binName) {
            var binPath = path.join(targetPath, binName);

            var binTarget;
            try {
                binTarget = fs.readlinkSync(binPath);
            } catch (err) {
                return;
            }

            if (binTarget.startsWith('../lib/node_modules/corepack/')) {
                try {
                    fs.unlinkSync(binPath);
                } catch (err) {
                    return;
                }
            }
        });
    } catch (err) {
        // ignore errors
    }
}
