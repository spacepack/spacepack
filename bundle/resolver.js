'use strict';

import path from 'path';
const fs = require('fs');
const cache = require('./cache');

const most = require('most');
const {create} = require('@most/create');

const streamFileInfo = require('./stream-file-info');

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