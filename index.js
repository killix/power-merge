var debug = require('debug')('power-merge:index')
var R = require('ramda')
var asyncify = require('async.asyncify')
var variadic = require('variadic')
var path = require('path')
var commands = require('require-all')({ dirname: path.join(__dirname, 'lib', 'commands') })
var Context = require('./lib/Context')

function compile(_options, namedCommands) {
    var options = withDefaultOptions(_options)
    var context = new Context({ namedCommands: namedCommands, options: options })
    var rules = preProcessRules(context)
    var merge = buildMerge(options, rules)
    context.set('merge', merge)
    return merge
}

function withDefaultOptions(options) {
    return R.mergeDeepLeft(
        options || {},
        { async: false, variadic: true, direction: 'left', rules: [] }
    )
}

function preProcessRules(context) {
    return R.map(function(rule) {
        return {
            when: rule.when ? rule.when(context) : commands.test(R.T, context),
            then: rule.then(context)
        }
    }, context.get('options').rules)
}

function buildMerge(options, rules) {
    var partial = R.curry(merge)(rules)
    return withApiWrapper(partial, options)
}

function withApiWrapper(fn, config) {
    if (config.direction === 'right') fn = R.compose(fn, R.reverse)
    if (config.variadic) fn = variadic(fn)
    if (config.async) fn = asyncify(fn)
    return fn
}

function merge(rules, args) {
    if (args.length === 0) return
    if (args.length === 1) return args[0] // To clone or not to clone

    var a = args[0]
    for (var i = 1; i < args.length; i++) {
        var b = args[i]
        for (var r = 0; r < rules.length; r++) {
            var rule = rules[r]
            var facts = {
                a: { value: a, type: R.type(a) },
                b: { value: b, type: R.type(b) }
            }
            if (!rule.when(facts)) continue
            a = rule.then(facts)
            break
        }
    }
    return a
}

module.exports = R.merge({ compile: compile }, commands)
