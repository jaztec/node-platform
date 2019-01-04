/*
 * Panflux Node Platform
 * (c) Omines Internetbureau B.V. - https://omines.nl/
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const validate = require('../src/platform-config').validate;

testValidConfig('defaults.yml', (config) => {
    expect(config.name).toBe('test-platform');
    expect(config.friendly_name).toBe('Test platform');
    expect(config.main_file).toBe('test-platform.js');
    expect(config.authors).toHaveLength(0);
});

testValidConfig('valid-platform-1.yaml', (config) => {
    expect(config.name).toBe('test-platform');
    expect(config.friendly_name).toBe('Test Platform');
    expect(config.main_file).toBe('test-platform.js');
    expect(config.authors).toHaveLength(1);
    expect(config.version).toBe('1.2.3-beta.1');
    expect(config.keywords).toHaveLength(3);
    expect(config.keywords).toContain('aap');
});

testValidConfig('expand-authors.yml', (config) => {
    expect(config.authors).toHaveLength(1);
    expect(config.authors[0].name).toBe('John Doe');
});

testValidConfig('arbitrary-entities.yaml', (config) => {
    expect(config.entities.class_name.config.host).toBe('string');
});

test('Undefined config throws', () => {
    expect(() => validate(undefined)).toThrow();
});
test('Empty config throws', () => {
    expect(() => validate({})).toThrow();
});
test('Invalid config throws', () => {
    expect(() => validate(loadConfig('invalid.yaml'))).toThrow();
});
test('Invalid version throws', () => {
    expect(() => validate({name: 'foo', version: '1-2-3'})).toThrow();
});

/**
 * Helper functions.
 */

/**
 * @param {string} name
 * @return {object}
 */
function loadConfig(name) {
    return yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'fixtures', 'configs', name)));
}

/**
 * @param {string} name
 * @param {function} cb
 */
function testValidConfig(name, cb) {
    test(`Valid configuration for file ${name}`, () => {
        cb(validate(loadConfig(name)));
    });
}
