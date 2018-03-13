// @flow

import test from 'ava';
import * as cache from '../bundle/cache';

test (t => {
    t.is(cache.getFileMtime('testFile1'), undefined, 'not cached file is undefined');

    cache.setFileMtime('testFile1', 1);
    t.is(cache.getFileMtime('testFile1'), 1, 'cached file returns its mtime');

    t.is(cache.getModuleFileById('testModule1'), undefined, 'not cached module is undefined');

    cache.haveModuleFileById('testModule1', 'testPath');
    t.is(cache.getModuleFileById('testModule1'), 'testPath', 'cached module returns its path');
});


