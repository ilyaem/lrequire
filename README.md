# lrequire

Another one lightweight module loader; designed for in-browser usage.

This one was wrote for simple module dependency system, compatible with RequireJS, without support in old browsers and bells and whistles for developers. (RequireJS now minified is **15,3 kb**, lrequire is **3,1 kb**)

Check example usage in **example** folder

it exports **requirejs**, **require** and **define** variables.

**requirejs** have only `config` method which support:

* `baseUrl` - by default current page path, could be relative/absolute path with trailing slash
* `waitSeconds` - timeout
* `timeoutSpeed` - how often system check for timeout
* `cacheBuster` - add random number to the end of file
* `paths` - aliases for module names

**define** function accepts:

* `name` - module name (optional, by default file/script name)
* `dependencies` - module dependencies (optional, could be array or string)
* `exports` - module definition (function or object)
* `error callback` - function to execute if one of dependencies cannot be resolved

also **define** exports **amd** variable.

**require** function accepts:

* `dependencies` - module dependencies (could be array or string) - if only one dependency required then it will be returned
* `callback` - function which will be executed when all dependencies resolved (optional)
* `error callback` - function to execute if one of dependencies cannot be resolved

**require** function could be used to load JS, CSS, image or any other files.

Here is also support for extension handling like `ext!some_module`

licensed under CC BY-SA (c) saikstin
