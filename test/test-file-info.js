// @flow

import test from 'ava';
import proxyquire from 'proxyquire';
import * as most from 'most';
import sinon from 'sinon';

proxyquire.noCallThru();

test.cb('existing file', t => {
    const addEventListener = sinon.spy();
    const removeEventListener = sinon.spy();
    const setFileMtime = sinon.spy();
    const stat = sinon.spy((fileName, cb) =>
        setTimeout(() => cb(null, {isFile: () => true,  mtime: {getTime: () => 1001}}), 0));

    const watcherMock = sinon.spy(fileName => ({
        addEventListener,
        removeEventListener
    }));

    const streamFileInfo = proxyquire('../bundle/stream-file-info', {
        './watcher': (...args) => watcherMock(...args),
        'fs': {
            stat
        },
        './cache': {
            getFileMtime: () => undefined,
            setFileMtime
        }
    });

    let stopResolve;
    const stopStream = most.fromPromise(new Promise((resolve) => {
        stopResolve = resolve;
    }));

    streamFileInfo('test-file-info.js')
        .until(stopStream)
        .observe(x => {
            t.true(watcherMock.calledWith('test-file-info.js') && watcherMock.calledOnce, 'watcher set up correctly on file');
            t.true(addEventListener.calledWith('unlink'), 'watching file unlink');
            t.true(addEventListener.calledWith('change'), 'watching file change');
            t.true(stat.calledWith('test-file-info.js'), 'get file stats');
            t.true(x === 1001, 'some mtime returned');
            t.true(setFileMtime.calledWith('test-file-info.js', 1001), 'saved file stats in cache');

            stopResolve();

            t.end();
        });
});

test.cb('existing file from cache', t => {
    const streamFileInfo = proxyquire('../bundle/stream-file-info', {
        './cache': {
            getFileMtime: () => 1001
        }
    });

    let stopResolve;
    const stopStream = most.fromPromise(new Promise((resolve) => {
        stopResolve = resolve;
    }));

    streamFileInfo('test-file-info.js')
        .until(stopStream)
        .observe(x => {
            t.true(x === 1001, 'mtime from cache returned');

            stopResolve();

            t.end();
        });
});

test.cb('non existing file', t => {
    const streamFileInfo = proxyquire('../bundle/stream-file-info', {
    });

    let stopResolve;
    const stopStream = most.fromPromise(new Promise((resolve) => {
        stopResolve = resolve;
    }));

    streamFileInfo('test-file-info.js')
        .until(stopStream)
        .observe(x => {
            t.true(x === false, 'false returned');

            stopResolve();

            t.end();
        });
});

test.cb('existing file removed', t => {
    let storedCb;

    const addEventListener = sinon.spy(((event, cb) => {
        if (event === 'unlink') {
            storedCb = cb;
        }
    }));
    const removeEventListener = sinon.spy();
    const setFileMtime = sinon.spy();
    const stat = sinon.spy((fileName, cb) =>
        setTimeout(() => cb(null, {isFile: () => true,  mtime: {getTime: () => 1001}}), 0));

    const watcherMock = sinon.spy(fileName => ({
        addEventListener,
        removeEventListener
    }));

    const streamFileInfo = proxyquire('../bundle/stream-file-info', {
        './watcher': (...args) => watcherMock(...args),
        'fs': {
            stat
        },
        './cache': {
            getFileMtime: () => undefined,
            setFileMtime
        }
    });

    let stopResolve;
    const stopStream = most.fromPromise(new Promise((resolve) => {
        stopResolve = resolve;
    }));

    streamFileInfo('test-file-info.js')
        .until(stopStream)
        .observe(x => {
            if (x) {
                t.true(!!storedCb, 'unlink callback defined');

                setTimeout(() => storedCb(), 0);
            } else {
                t.true(x === false, 'received update false');

                stopResolve();

                t.end();
            }
        });
});

test.cb('non existing file added', t => {
    let storedCb, firstTime = true;

    const addEventListener = sinon.spy(((event, cb) => {
        if (event === 'add') {
            storedCb = cb;
        }
    }));

    const removeEventListener = sinon.spy();
    const setFileMtime = sinon.spy();
    const stat = sinon.spy((fileName, cb) =>
        setTimeout(() => cb(null, {isFile: () => {
            if (firstTime) {
                firstTime = false;
                return false;
            } else {
                return true;
            }
        },  mtime: {getTime: () => 1001}}), 0));

    const watcherMock = sinon.spy(fileName => ({
        addEventListener,
        removeEventListener
    }));

    const streamFileInfo = proxyquire('../bundle/stream-file-info', {
        './watcher': (...args) => watcherMock(...args),
        'fs': {
            stat
        },
        './cache': {
            getFileMtime: () => undefined,
            setFileMtime
        }
    });

    let stopResolve;
    const stopStream = most.fromPromise(new Promise((resolve) => {
        stopResolve = resolve;
    }));

    streamFileInfo('test-file-info.js')
        .until(stopStream)
        .observe(x => {
            if (!x) {
                t.true(!!storedCb, 'add callback defined');

                setTimeout(() => storedCb(), 0);
            } else {
                t.true(x === 1001, 'received update mtime');

                stopResolve();

                t.end();
            }
        });
});

test.cb('exception', t => {
    const streamFileInfo = proxyquire('../bundle/stream-file-info', {
        'fs': {
            stat : () =>
            {
                throw new Error();
            }
        }
    });

    let stopResolve;
    const stopStream = most.fromPromise(new Promise((resolve) => {
        stopResolve = resolve;
    }));

    streamFileInfo('test-file-info.js')
        .until(stopStream)
        .observe(x => {
            t.true(x === false, 'false returned');

            stopResolve();

            t.end();
        });
});