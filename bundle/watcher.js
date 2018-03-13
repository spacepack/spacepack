// @flow

import chokidar from 'chokidar';
import finished from '../async/finished';

// wrapper around chokidar (can be anything) to use with most.fromEvent

const watcher = chokidar.watch();

function add(fileName: string) {
    if (fileName in files) {
        ++files[fileName];
    } else {
        files[fileName] = 1;
        watcher.add(fileName);
    }
}

function unwatch(fileName: string) {
    if (fileName in files) {
        --files[fileName];
        if (files[fileName] < 1) {
            delete files[fileName];
            watcher.unwatch(fileName);
        }
    }
}

finished.then(() => watcher.close());

const files: {[key: string]: number} = /* :: {} || */ Object.create(null);

module.exports = function(fullPath: string) {
    return {
        addEventListener: function(event: string, cb: () => void) {
            add(fullPath);
            watcher.on(event, function(p: string) {
                if (fullPath === p) {
                    cb();
                }
            });
        },
        removeEventListener: function(event: string, cb: () => void) {
            unwatch(fullPath);
        }
    }
};
