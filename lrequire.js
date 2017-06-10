/* lrequire 0.1 (c) 2015, saikstin (licensed under CC BY-SA) */
var requirejs, require, define, describe;
(function() {
    var _modules = {};
    _modules.modules = _modules;
    var _loaders = {};
    var _handlers = {};
    var _options = {
        baseUrl: location.origin + (location.pathname.substr(0, location.pathname.lastIndexOf("/") + 1) || "/"),
        waitSeconds: 15,
        timeoutSpeed: 10,
        cacheBuster: false,
        paths: {}
    };
    var _delayed = {};
    _modules.requirejs = _modules.module = requirejs = {
        config: function(options) {
            if(options) {
                for(var key in options) {
                    if(options[key] && typeof options[key] === 'object') {
                        _options[key] = _options[key] || {};
                        for(var path in options[key]) {
                            _options[key][path] = options[key][path];
                        }
                    } else {
                        _options[key] = options[key];
                    }
                }
            } else {
                return _options;
            }
        }
    };
    
    _modules.describe = describe = function(name, other_args) {
        var args = Array.prototype.slice.call(arguments);
        if(args.length < 5) {
            for(var i=0; i<5-args.length; i++) args.push(undefined);
        }
        args[4] = true; // skipExisting as true
        _delayed[name] = args;
    };

    var _define_delayed = function(dep) {
        var args = _delayed[dep];
        delete _delayed[dep];
        _modules.define.apply(_modules, args);
    };
    _modules.define = define = function(name, deps, arg, callback_error, skipExisting) {
        if(typeof name === 'undefined' && typeof deps === 'undefined' && typeof arg === 'undefined') {
            for(var key in _delayed) {
                _define_delayed(key);
            }
            return;
        }
        if(typeof name !== 'string') {
            deps = name, arg = deps;
            var scripts = document.getElementsByTagName('script');
            var script = scripts[scripts.length - 1];
            name = script.getAttribute('data-requiremodule');
            if(!name) {
                var filePath = script.src || window.location.href;
                var fileName = filePath.match(/.*\/([^/]+)\.[^\.]+$/);
                name = fileName && fileName[1] || "";
            }
        } else if(_modules[name] && skipExisting) {
            return;
        }
        if(typeof arg === 'undefined') arg = deps, deps = null;
        var isHandlerDefinition = (deps && deps.indexOf('module') !== -1 || false);
        var loader = _createLoader(name);
        _resolve(deps, function(resolved) {
            if(typeof arg === 'function') {
                _modules[name] = arg.apply(_modules, resolved);
            } else {
                _modules[name] = arg;
            }
            _resolveLoader(loader, true);
            if(isHandlerDefinition) _handlers[name] = _modules[name];
            
        }, function() {
            if(typeof callback_error === 'function') callback_error.call(_modules);
        });
    };
    define.amd = {};
    
    _modules.require = require = function(deps, callback, callback_error) {
        if(typeof deps === 'string') deps = [ deps ];
        
        var resolvedDeps = _resolve(deps, function(resolved) {
            callback && callback.apply(_modules, resolved);
        }, function() {
            callback_error && callback_error.call(_modules);
        });
        
        return resolvedDeps && (resolvedDeps.length === 1 ? resolvedDeps[0] : resolvedDeps);
    };
    
    var _resolve = function(deps, callback, callback_error) {
        if(deps) {
            if(typeof deps === 'string') deps = [ deps ];
            var depNames = deps.slice(0);
            var queueCount = 0;
            var checkQueue = function() {
                if(queueCount === 0) {
                    callback.call(_modules, deps);
                }
                return queueCount === 0;
            };
            for(var i=0; i<deps.length; i++) {
                var dep = _options.paths[deps[i]] || deps[i];
                var handler = dep.substr(0, dep.indexOf('!'));
                var loader = _loaders[deps[i]];
                (function(depIndex) {
                    if(handler && _handlers[handler]) {
                        queueCount++;
                        dep = dep.substr(dep.indexOf('!')+1);
                        _handlers[handler].load(dep, require, function loadCallback(loaded) {
                            _modules[depNames[depIndex]] = deps[depIndex] = loaded;
                            queueCount--;
                        }, requirejs.config);
                        
                    } else if(loader && !loader._loaded) {
                        queueCount++;
                        loader._loadHandlers.push(function() {
                            deps[depIndex] = _modules[deps[depIndex]];
                            queueCount--;
                            checkQueue();
                        });
                        
                    } else if(_modules[deps[i]]) {
                        deps[i] = _modules[deps[i]];
                        
                    } else {
                        queueCount++;
                        loader = _createLoader(depNames[depIndex]);
                        var loadResult = function(loaded) {
                            if(loaded === null) {
                                callback_error.call(_modules);
                                loader._failed = true;
                                throw new Error("cannot load dependency " + depNames[depIndex]);
                            } else {
                                _modules[depNames[depIndex]] = deps[depIndex] = (_modules[depNames[depIndex]] || loaded);
                                queueCount--;
                                checkQueue();
                            }
                        };
                        if(_delayed[dep]) {
                            var module = _define_delayed(dep);
                            loadResult(module);
                        } else {
                            _load(dep, loadResult);
                        }
                    }
                })(i);
            }
            if(checkQueue()) {
                return deps;
            }
        } else {
            callback();
        }
    };
    
    var _createLoader = function(name) {
        return name in _loaders ? _loaders[name] : _loaders[name] = {
            _name: name,
            _loaded: false,
            _loadHandlers: []
        };
    };
    var _resolveLoader = function(loader, success) {
        loader = typeof(loader) === 'string' ? _loaders[loader] : loader;
        loader._loaded = success;
        for(var i=0; i<loader._loadHandlers.length; i++) {
            var handler = loader._loadHandlers[i];
            (typeof(handler) === 'function') && handler.call();
        }
    };
    
    var _getUrl = function(path) {
        return _options.baseUrl + path;
    };
    var _load = function(path, callback) {
        var extIndex = path.lastIndexOf('.');
        var ext = path.substr(extIndex === -1 ? path.length : extIndex + 1);
        var url = _getUrl(path);
        var element;
        if(ext === 'js' || ext === '') {
            element = document.createElement("script");
            element.type = "text/javascript";
            element.setAttribute('data-requiremodule', path);
            _bind(element, callback);
            element.src = url + (ext === '' ? '.js' : '') + (_options.cacheBuster ? '?r=' + Math.random() : '');
            document.head.appendChild(element);
            
        } else if(ext === 'css') {
            element = document.createElement("link");
            element.rel = 'stylesheet';
            element.type = 'text/css';
            _bind(element, callback);
            element.href = url + (_options.cacheBuster ? '?r=' + Math.random() : '');
            document.head.appendChild(element);
            
        } else if(['jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'bmp', 'ico', 'svg'].indexOf(ext) !== -1) {
            element = document.createElement('img');
            _bind(element, callback);
            element.src = url + (_options.cacheBuster ? '?r=' + Math.random() : '');
            
        } else {
            var finished = false;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.timeout = _options.waitSeconds * 1000;
            _options.cacheBuster && xhr.setRequestHeader('Cache-Control', 'no-cache');
            xhr.onreadystatechange = function() {
                if(finished) return;
                if(xhr.readyState == 4) {
                    finished = true;
                    if(xhr.status === 0) {
                        callback(null);
                    } else {
                        callback(xhr.responseText);
                    }
                }
            };
            setTimeout(function() {
                if(finished) return; else finished = true;
                xhr.abort();
                callback(null);
            }, _options.waitSeconds * 1000);
            xhr.send();
        }
    };
    
    var _bind = function(element, callback) {
        var finished = false;
        element.addEventListener('load', function() {
            if(finished) return; else finished = true;
            callback(element);
        });
        element.addEventListener('error', function() {
            if(finished) return; else finished = true;
            callback(null);
        });
        setTimeout(function() {
            if(finished) return; else finished = true;
            document.head.removeChild(element);
            callback(null);
        }, _options.waitSeconds * 1000);
        return element;
    };
})();
