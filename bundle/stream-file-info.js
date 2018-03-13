const fs = require('fs');
const cache = require('./cache');

const most = require('most');
const {create} = require('@most/create');
const createEventTarget = require('./watcher');

module.exports = function streamFileInfo(filePath) {
    return create((next, end, error) => {
        const fileTarget = createEventTarget(filePath);
        let stopResolve;
        const stopStream = most.fromPromise(new Promise((resolve) => {
            stopResolve = resolve;
        })).multicast();
        const getStatAsStream = () => most.fromPromise(getFileMtime());

        {
            const cachedValue = cache.getFileMtime(filePath);
            if (cachedValue !== undefined) {
                next(cachedValue);
                addRemoveSubscriptions(cachedValue);
            } else {
                getFileMtime()
                    .then((stat) => {
                        cache.setFileMtime(filePath, stat);
                        next(stat);
                        addRemoveSubscriptions(stat);
                    });
            }
        }

        return stopResolve;

        function addRemoveSubscriptions(stat) {
            let stream;

            if (stat === false) {
                stream = most.fromEvent('add', fileTarget)
                    .chain(getStatAsStream)
                    .take(1)
                    .tap(updateStatAndSubscription);
            } else {
                const unlinkStream = most.fromEvent('unlink', fileTarget).multicast();

                stream = most.merge(
                    most.fromEvent('change', fileTarget)
                        .chain(getStatAsStream).until(unlinkStream),
                    unlinkStream
                        .constant(false)
                        .take(1)
                        .tap(updateStatAndSubscription)
                );
            }

            stream.until(stopStream)
                .observe(next);
        }

        function updateStatAndSubscription(stat) {
            cache.setFileMtime(filePath, stat);
            addRemoveSubscriptions(stat);
        }
    });

    function getFileMtime() {
        return new Promise((resolve) => {
            fs.stat(filePath, (err, stat) => {
                if (!err) {
                    resolve(stat.isFile() && stat.mtime.getTime());
                } else {
                    resolve(false);
                }
            });
        }).catch(() => false);
    }
};
