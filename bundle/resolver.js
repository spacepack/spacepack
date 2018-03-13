'use strict';

import path from 'path';
const fs = require('fs');
const cache = require('./cache');

const most = require('most');
const {create} = require('@most/create');

const streamFileInfo = require('./stream-file-info');

function mapId(basePath, id) {

    return check(basePath, id + '.ts') ||
        check(basePath, id + '.js') ||
        checkInPackage() || resolvePackage(id) || fail();

    function fail() {
        console.error('map failed for id: ' + id);

        return id;
    }

    function checkInPackage() {
        if (id.indexOf('\\') !== -1) {
            var basePath = path.dirname(resolvePackage(id.substring(0, id.indexOf('\\'))));

            return basePath && check(basePath, id.substring(id.indexOf('\\')) + '.js');
        }
    }

    function resolvePackage(id) {
        if (fs.existsSync('./war/components/' + id)) {
            var baseDir = './war/components/' + id + '/';
            var thisPackage = JSON.parse(fs.readFileSync(path.join(baseDir, '/bower.json')));

            return check(baseDir, id + '.js') ||
                (thisPackage.main && check(baseDir, thisPackage.main)) || path.join(baseDir, '/bower.json');
        }
    }

    function check() {
        var testPath = path.join.apply(path, arguments);
        return fileExists(testPath) && testPath;
    }
}

module.exports = function (config) {

    // const combinedResolver = (id) => {
    //     return cacheResolver(id).then((result) => {
    //         if (result) {
    //             return result;
    //         } else {
    //             return Promise.all(config.map((resolverConfig) => {
    //                 switch (resolverConfig.type) {
    //                     case 'generic':
    //                         return genericResolver(id, resolverConfig);
    //                     default:
    //                         return Promise.resolve({result: false, deps: []});    
    //                 }
    //             }))
    //             .then(results => {
    //                 let deps = [], result;
    //                 for (let i = 0; i < results.length; ++i) {
    //                     result = results[i];
    //                     deps = deps.concat(result.deps);
    //                     if (result.result) {
    //                         break;
    //                     }
    //                 }
    //                 if (result && result.result) {
    //                     cache.haveModuleFileById(id, result.result, deps);
    //                     return result.result;
    //                 } else {
    //                     return false;
    //                 }
    //             });
    //         }
    //     });
    // };

    return function (ids) {
        return Promise.all(ids.map(combinedResolver));
    };
};



// function cacheResolver(id) {
//     return Promise.resolve(cache.getModuleFileById(id));
// }

// function genericResolver(id, config) {
//     return Promise.all(config.extensions.map(ext => fileExists(id, path.join(config.basePath, id + ext))))
//         .then(results => {
//             const resultIndex = results.findIndex(item => item.result === true);
//             let result;
//             if (resultIndex !== -1) {
//                 result = results.splice(resultIndex)[0];
//             } else {
//                 return {result: false, deps: results};
//             }
//             return {result: result.filePath, deps: results};
//         });
// }

/*
    config = [{
        type: 'generic',
            extensions: ['.ts', '.js'],
            basePath: string
        }, {
        type: 'bower',
            extensions: ['.js'],
            methods: ['same-as-package', 'main', 'index']
        }, {
            type: 'node',
            extensions: ['.js'],
            methods: ['esnext', 'index', 'browser', 'same-as-package', 'main']
        }]
 */
function nodeResolver(id, config) {
    let needPackageJson = ['esnext', 'browser', 'main'].some(r => config.methods.includes(r));

    const notFoundYet = most.of(false);
    
    return filePaths.length ? resolve(notFoundYet, ...filePaths) : notFoundYet;
}

function genericResolver(id, config) {
    const filePaths = config.extensions.map((ext) => path.resolve(config.basePath, id + ext));

    const notFoundYet = most.of(false);
    
    return filePaths.length ? resolve(notFoundYet, ...filePaths) : notFoundYet;
}

function resolve(upstream, filePath, ...rest) {
    const result = create((next, end, error) => {
        let stopResolve;
        const stopStream = most.fromPromise(new Promise((resolve) => {
            stopResolve = resolve;
        })).multicast();

        let isActive = false, current = undefined;

        upstream
            .until(stopStream)
            .observe(x => {
                if (!x && !isActive) {
                    isActive = true;
                    if (current) {
                        next(current);
                    }
                }
            });

        streamFileInfo(filePath)
            .until(stopStream)
            .observe(x => {
                current = x ? filePath : false;
                if (isActive) {
                    next(current);
                }                    
            });

        if (rest.length) {
            resolve(result, ...rest)
                .until(stopStream)
                .observe(next);
        }

        return stopResolve;
    }).multicast();

    return result;
}



const log = console.log.bind(console);

//const filePath = path.resolve(__dirname + '/cache.js');

genericResolver('cache', {
        type: 'generic',
        extensions: ['.ts', '.js'],
        basePath: __dirname
    }).observe(log);

// streamFileInfo(__dirname + '/cache.ts').observe(log);