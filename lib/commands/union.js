var debug = require('debug')('power-merge:commands:union')
var R = require('ramda')

module.exports = function __union() {

    return function _union(context) {

        return function union(facts) {

            debug('facts: %o', facts)
            var result = R.union(facts.a.value, facts.b.value)

            debug('return: %o', result)
            return result
        }
    }
}
