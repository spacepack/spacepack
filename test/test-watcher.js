// @flow

import test from 'ava';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

proxyquire.noCallThru();

const close = sinon.spy();
const add = sinon.spy();
const unwatch = sinon.spy();
const on = sinon.spy((e: string, f: (name: string) => void) => {
    f('test-target');
    f('test-target2'); //fake target to filter
});
const cb = sinon.spy();
const cb2 = sinon.spy();
const finished = sinon.spy((f: () => void) => f());

const createEventTarget = proxyquire('../bundle/watcher', {
    'chokidar': {
        watch: () => ({
            close,
            add,
            unwatch,
            on
        })
    },
    '../async/finished': {
        then: finished
    }
});

test(t => {
    t.true(finished.calledOnce, 'subscribed on finished');
    t.true(close.calledOnce, 'closed watcher when done');
    t.true(add.notCalled, 'not yet called add');
    t.true(unwatch.notCalled, 'not yet called unwatch');
    
    
    const et = createEventTarget('test-target');
    
    et.addEventListener('some-event', cb);
    
    t.true(add.calledWith('test-target') && add.calledOnce, 'file added to watcher');
    t.true(cb.calledOnce, 'callback called');
    
    et.addEventListener('some-event', cb2);
    
    t.true(add.calledOnce, 'file added to watcher');
    
    
    et.removeEventListener('some-event', cb);
    
    t.true(unwatch.notCalled, 'not yet unwatched');
    
    et.removeEventListener('some-event', cb2);
    
    t.true(unwatch.calledWith('test-target') && unwatch.calledOnce, 'unwatched');
    
    et.removeEventListener('some-fake-event', () => undefined);
    
    t.true(unwatch.calledOnce, 'still unwatched once');
});