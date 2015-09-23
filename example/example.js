var log = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    var logType = 'log';
    if([ 'info', 'error', 'good' ].indexOf(args[args.length-1]) !== -1) logType = args.pop();
    for(var i=0; i<args.length; i++) args[i] = logType ? args[i] : JSON.stringify(args[i]);
    var element = document.createElement('div');
    element.className = logType;
    element.innerHTML = args.join(', ');
    document.getElementById('output').appendChild(element);
};

var localEnvironment = (location.protocol === 'file:');
if(localEnvironment) {
	var titleEl = document.getElementsByClassName('title')[0];
	titleEl.innerText = titleEl.innerText.substr(0, titleEl.innerText.length - 1) + " (remember that XHR isn't possible in file:// protocol):";
}

log("1. configuring some stuff - sub directory for including files, timeout and aliases", 'info');
requirejs.config({
    baseUrl: 'trash/',
    waitSeconds: 25,
    paths: {
        'lib': 'some.library.js'
    }
});

log("2. defining simple module (module1) with constructor but without dependencies", 'info');
define('module1', function() {
    log("module1 initialized");
    return { "property": "module1 property" };
});
log("3. defining module (module2) without constructor and dependencies but with self-executing function", 'info');
define('module2', {
    'init': (function() { log("module2 initialized") })(),
    'property': "module2 property"
});
log("4. defining module (module3) with constructor and dependencies on two previous modules", 'info');
define('module3', [ 'module1', 'module2' ], function(module1, module2) {
    log("module3 initialized", module1.property, module2.property);
    return { 'property': "module3 property" }
});
log("5. requiring first and third module with some handler", 'info');
require([ 'module1', 'module3' ], function(module1, module3) {
    log("required successfully " + module1.property + ", " + module3.property)
});
log("6. just requiring second module and read property without callback (as module already defined)", 'info');
log(require("module2").property);

log("7. defining extension (ext) handler for require() function with dependency on module1", 'info');
define('ext', [ 'module1', 'module' ], function(module1, module) {
    log("ext extension initialized");
    return {
        load:function(dependency, req, callback, config) {
            var success = dependency === 'test';
            log("ext handler " + (success ? 'successed' : 'failed'), success ? 'good' : 'error');
            callback({ 'passed':true });
        }
    };
});

log("8. usage of extension", 'info');
require("ext!test", function(test) {
    var success = test && test.passed;
    log("functionality 'test' is " + (success ? "loaded" : "not loaded") + " through ext handler", success ? 'good' : 'error');
});

log("9. defining module which dependent on few external files - library, JSON file and stylesheet", 'info');
if(localEnvironment) log("XHR isn't possible in file:// protocol", 'error');
define('module4', [ 'lib', 'example.json', '../style.css' ], function(lib, json, css) {
    log("delayed from step 9 (module4 initialized)");
	log(" > lib.capitalize('method') = " + lib.capitalize("method"));
    log(" > json loaded", JSON.stringify(JSON.parse(json)));
    log(" > css loaded", css);
	return { 'property':"module4 property" };
});
log("...", 'info');

log("10. ..and now requiring that module (it should be delayed until external dependencies from previous module will be resolved)", 'info');
require([ 'module4', 'lib' ], function(module4, lib) {
	log("delayed from step 10", "module4 and library was required successfully");
	log(" > module4 property = " + module4.property);
	log(" > lib.capitalize('word') = " + lib.capitalize("word"));
});
log("...", 'info');
