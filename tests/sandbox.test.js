/*
 * Panflux Node Platform
 * (c) Omines Internetbureau B.V. - https://omines.nl/
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const fork = require('child_process').fork;
const path = require('path');

const dummies = require('./fixtures/dummies');

describe('Sandbox messages', () => {
    test('start/stop', () => {
        const sandbox = dummies.createSandbox();
        const ev = jest.fn();

        sandbox.on('start', ev);
        process.emit('message', {name: 'start', args: {bar: 'foo'}});
        expect(ev).toHaveBeenCalledWith({bar: 'foo'});
    });

    test('entity adoption', (done) => {
        const sandbox = dummies.createSandbox();

        sandbox.on('adopt', (entity) => {
            expect(typeof entity).toBe('object');
            expect(entity.id).toBe('684');
            done();
        });
        process.emit('message', {name: 'adopt', args: {id: '684', name: 'foo', type: 'foo-bar'}});
    });

    test('process change queue', () => {
        const sandbox = dummies.createSandbox();
        const ev = jest.fn();
        sandbox.processChangeQueue = ev;
        sandbox.processMessage('processChangeQueue');
        expect(ev).toHaveBeenCalled();
    });

    test('unknown message', (done) => {
        process.send = (msg) => {
            expect(msg.name).toBe('log');
            expect(msg.args.level).toBe('error');
            expect(msg.args.message).toMatch(/unknown message/i);
            done();
        };
        process.emit('message', {name: 'foo', args: 'bar'});
    });

    test('proper exception when queueing false data', () => {
        const sandbox = dummies.createSandbox();
        expect(() => sandbox.queueStateChange('dummy', {foo: 'bar'})).toThrow('There is no platform entity "undefined"');
    });
});

test('Sandbox functions', () => {
    const sandbox = dummies.createSandbox();
    const ps = jest.fn();

    process.send = ps;

    sandbox.reportDiscovery({type: 'foo-bar', id: '684'});
    expect(ps).toHaveBeenCalledWith({name: 'discovery', args: {type: 'foo-bar', id: '684', name: 'foo-bar-684'}});

    // Test repeated discovery does not trigger new messages
    sandbox.reportDiscovery({type: 'foo-bar', id: '684'});
    expect(ps).toHaveBeenCalledTimes(1);
});

test('not to send anything on process on empty queue', () => {
    const sandbox = dummies.createSandbox();
    const ps = jest.fn();

    process.send = ps;
    sandbox.processChangeQueue();
    expect(ps).toBeCalledTimes(0);
});

// Set up fork for IPC tests
const child = fork(path.join(__dirname, 'fork-bouncer.js'));

test('Sandbox IPC', async () => {
    const promise = new Promise((resolve) => {
        child.on('message', (msg) => resolve(msg));
    });
    child.send({name: 'discover'});

    await expect(promise).resolves.toEqual({
        name: 'discovery',
        args: {
            id: '684',
            name: 'fake-684',
            type: 'fake',
        },
    });
});
