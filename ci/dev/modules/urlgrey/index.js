var url = require("fast-url-parser");
var querystring = require('querystring');
var isBrowser = (typeof window !== "undefined");

// the node url library is quite slow & is often a code bottleneck
// this wraps fast-url-parser to return url-parser-like results
function urlParse(href) {
  var parsed = url.parse(href);
  var result = {
    // fields from fast-url-parser
    _protocol: parsed._protocol,
    _href: parsed._href,
    _port: parsed._port,
    _query: parsed._query,
    auth: parsed.auth,
    slashes: parsed.slashes,
    host: parsed.host,
    hostname: parsed.hostname,
    hash: parsed.hash,
    search: parsed.search,
    pathname: parsed.pathname,
    _prependSlash: parsed._prependSlash,

    // fields that node url library returns too
    port: parsed._port === -1 ? null : parsed._port.toString(),
    path: (parsed.pathname || "") + (parsed.search || ""),
    href: href,
    query: parsed.search ? parsed.search.slice(1) : parsed.search,
    protocol: parsed._protocol + ":"
  };

  return result;
}

var getDefaults = function () {
  var defaultUrl = "http://localhost:80";
  if (isBrowser) {
    defaultUrl = window.location.href.toString();
  }
  var defaults = urlParse(defaultUrl);
  return defaults;
};

if (!Array.isArray) {
  Array.isArray = function (arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

var objectEach = function (obj, cb) {
  for (var k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      cb(obj[k], k);
    }
  }
};

var argsArray = function (obj) {
  if (!obj) { return []; }
  if (Array.isArray(obj)) { return obj.slice(); }
  var args = [];
  objectEach(obj, function (v, k) {
    args[k] = v;
  });
  return args;
};

var arrLast = function (arr) {
  return arr[arr.length - 1];
};

var arrFlatten = function (input, output) {
  if (!output) { output = []; }
  for (var i = 0; i < input.length; i++) {
    var value = input[i];
    if (Array.isArray(value)) {
      arrFlatten(value, output);
    } else {
      output.push(value);
    }
  }
  return output;
};


var UrlGrey = function (url) {
  if (!url && isBrowser) {
    url = window.location.href.toString();
  }
  this.url = url;
  this._parsed = null;
};

UrlGrey.prototype.parsed = function () {
  if (!this._parsed) {
    this._parsed = urlParse(this.url);
    var defaults = getDefaults();
    var p = this._parsed;
    p.protocol = p._protocol || defaults._protocol;
    if (p.hash) {
      p.hash = p.hash.substring(1);
    }
    p.username = '';
    p.password = '';
    if (p.protocol !== 'file') {
      p.port = parseInt(p.port, 10);
      if (p.auth) {
        var auth = p.auth.split(':');
        p.username = auth[0];
        p.password = auth[1];
      }
    }
    if (isBrowser) {
      p.hostname = p.hostname || defaults.hostname;
    }
  }

  // enforce only returning these properties
  this._parsed = {
    protocol: this._parsed.protocol,
    auth: this._parsed.auth,
    host: this._parsed.host,
    port: this._parsed.port,
    hostname: this._parsed.hostname,
    hash: this._parsed.hash,
    search: this._parsed.search,
    query: this._parsed.query,
    pathname: this._parsed.pathname,
    path: this._parsed.path,
    href: this._parsed.href,
    username: this._parsed.username,
    password: this._parsed.password
  };


  return this._parsed;
};


UrlGrey.prototype.extendedPath = function (url) {
  if (url) {
    var p = urlParse(url);
    var obj = new UrlGrey(this.toString());
    if (p.hash) {
      p.hash = p.hash.substring(1);
    }
    obj.parsed().hash = p.hash;
    obj.parsed().query = p.query;
    obj = obj.path(p.pathname);
    return obj;
  } else {
    var href = this.path();
    href += this.queryString() ? '?' + this.queryString() : '';
    href += this.hash() ? '#' + this.hash() : '';
    return href;
  }
};


UrlGrey.prototype.port = function (num) {
  var hostname = this.parsed().hostname;

  // setter
  if (num) {
    if (this.protocol() === 'file') {
      throw new Error("file urls don't have ports");
    }
    var obj = new UrlGrey(this.toString());
    obj.parsed().port = parseInt(num, 10);
    return obj;
  }

  // getter
  var output = this._parsed.port;
  if (!output) {
    switch (this.protocol()) {
      case 'http': return 80;
      case 'https': return 443;
      default: return null;
    }
  }
  return parseInt(output, 10);
};

UrlGrey.prototype.query = function (mergeObject) {
  if (arguments.length === 0) {
    return querystring.parse(this.queryString());
  } else if (mergeObject === null || mergeObject === false) {
    return this.queryString('');
  } else {
    // read the object out
    var oldQuery = querystring.parse(this.queryString());
    objectEach(mergeObject, function (v, k) {
      if (v === null || v === false) {
        delete oldQuery[k];
      } else {
        oldQuery[k] = v;
      }
    });
    var newString = querystring.stringify(oldQuery);
    var ret = this.queryString(newString);
    return ret;
  }
};


UrlGrey.prototype.rawQuery = function (mergeObject) {
  if (arguments.length === 0) {
    if (this.queryString().length === 0) { return {}; }

    return this.queryString().split("&").reduce(function (obj, pair) {
      pair = pair.split("=");
      var key = pair[0];
      var val = pair[1];
      obj[key] = val;
      return obj;
    }, {});
  } else if (mergeObject === null || mergeObject === false) {
    return this.queryString('');
  } else {
    // read the object out
    var oldQuery = querystring.parse(this.queryString());
    objectEach(mergeObject, function (v, k) {
      if (v === null) {
        delete oldQuery[k];
      } else {
        oldQuery[k] = v;
      }
    });
    var pairs = [];
    objectEach(oldQuery, function (v, k) {
      pairs.push(k + '=' + v);
    });
    var newString = pairs.join('&');

    return this.queryString(newString);
  }
};

addPropertyGetterSetter('protocol');
addPropertyGetterSetter('username');
addPropertyGetterSetter('password');
addPropertyGetterSetter('hostname');
addPropertyGetterSetter('hash');
// add a method called queryString that manipulates 'query'
addPropertyGetterSetter('query', 'queryString');
addPropertyGetterSetter('pathname', 'path');

UrlGrey.prototype.path = function () {
  var args = arrFlatten(argsArray(arguments));
  if (args.length !== 0) {
    var obj = new UrlGrey(this.toString());
    var str = args.join('/');
    str = str.replace(/\/+/g, '/'); // remove double slashes
    str = str.replace(/\/$/, '');  // remove all trailing slashes
    args = str.split('/');
    for (var i = 0; i < args.length; i++) {
      args[i] = this.encode(args[i]);
    }
    str = args.join('/');
    if (str[0] !== '/') { str = '/' + str; }
    obj.parsed().pathname = str;
    return obj;
  }
  return this.parsed().pathname;
};

UrlGrey.prototype.rawPath = function () {
  var args = arrFlatten(argsArray(arguments));
  if (args.length !== 0) {
    var obj = new UrlGrey(this.toString());
    var str = args.join('/');
    str = str.replace(/\/+/g, '/'); // remove double slashes
    str = str.replace(/\/$/, '');  // remove all trailing slashes
    if (str[0] !== '/') { str = '/' + str; }
    obj.parsed().pathname = str;
    return obj;
  }
  return this.parsed().pathname;
};

UrlGrey.prototype.encode = function (str) {
  try {
    return encodeURIComponent(str);
  } catch (ex) {
    return querystring.escape(str);
  }
};

UrlGrey.prototype.decode = function (str) {
  return decode(str);
};

UrlGrey.prototype.parent = function () {
  // read-only.  (can't SET parent)
  var pieces = this.path().split("/");
  var popped = pieces.pop();
  if (popped === '') {  // ignore trailing slash
    popped = pieces.pop();
  }
  if (!popped) {
    throw new Error("The current path has no parent path");
  }
  return this.query(false).hash('').path(pieces.join("/"));
};

UrlGrey.prototype.rawChild = function (suffixes) {
  if (suffixes) {
    suffixes = argsArray(arguments);
    return this.query(false).hash('').rawPath(this.path(), suffixes);
  } else {
    // if no suffix, return the child
    var pieces = this.path().split("/");
    var last = arrLast(pieces);
    if ((pieces.length > 1) && (last === '')) {
      // ignore trailing slashes
      pieces.pop();
      last = arrLast(pieces);
    }
    return last;
  }
};

UrlGrey.prototype.child = function (suffixes) {
  suffixes = argsArray(arguments);
  if (suffixes.length > 0) {
    return this.query(false).hash('').path(this.path(), suffixes);
  }

  // if no suffix, return the child
  var pieces = pathPieces(this.path());
  var last = arrLast(pieces);
  if ((pieces.length > 1) && (last === '')) {
    // ignore trailing slashes
    pieces.pop();
    last = arrLast(pieces);
  }
  return last;
};

UrlGrey.prototype.toJSON = function () {
  return this.toString();
};

UrlGrey.prototype.toString = function () {
  var p = this.parsed();
  var retval = this.protocol() + '://';
  if (this.protocol() !== 'file') {
    var userinfo = p.username + ':' + p.password;
    if (userinfo !== ':') {
      retval += userinfo + '@';
    }
    retval += p.hostname;
    var port = portString(this);
    if (port !== '') {
      retval += ':' + port;
    }
  }
  retval += this.path() === '/' ? '' : this.path();
  var qs = this.queryString();
  if (qs) {
    retval += '?' + qs;
  }
  if (p.hash) {
    retval += '#' + p.hash;
  }
  return retval;
};

var pathPieces = function (path) {
  var pieces = path.split('/');
  for (var i = 0; i < pieces.length; i++) {
    pieces[i] = decode(pieces[i]);
  }
  return pieces;
};

var decode = function (str) {
  try {
    return decodeURIComponent(str);
  } catch (ex) {
    return querystring.unescape(str);
  }
};

var portString = function (o) {
  if (o.protocol() === 'https') {
    if (o.port() === 443) {
      return '';
    }
  }
  if (o.protocol() === 'http') {
    if (o.port() === 80) {
      return '';
    }
  }
  return '' + o.port();
};


/*
UrlGrey.prototype.absolute = function(path){
  if (path[0] == '/'){
    path = path.substring(1);
  }
  var parsed = urlParse(path);
  if (!!parsed.protocol){  // if it's already absolute, just return it
    return path;
  }
  return this._protocol + "://" + this._host + '/' + path;
};

// TODO make this interpolate vars into the url.   both sinatra style and url-tempates
// TODO name this: 
UrlGrey.prototype.get = function(nameOrPath, varDict){
  if (!!nameOrPath){
    if (!!varDict){
      return this.absolute(this._router.getUrl(nameOrPath, varDict));
    }
    return this.absolute(this._router.getUrl(nameOrPath));
  }
  return this.url;
};*/

/*
// TODO needs to take a template as an input
UrlGrey.prototype.param = function(key, defaultValue){
  var value = this.params()[key];
  if (!!value) { 
    return value; 
  }
  return defaultValue;
};

// TODO extract params, given a template?
// TODO needs to take a template as an input
UrlGrey.prototype.params = function(inUrl){
  if (!!inUrl){
    return this._router.pathVariables(inUrl);
  }
  if (!!this._params){
    return this._params;
  }
  return this._router.pathVariables(this.url);
};
*/

// TODO relative()  // takes an absolutepath and returns a relative one
// TODO absolute() // takes a relative path and returns an absolute one.



module.exports = function (url) { return new UrlGrey(url); };

function addPropertyGetterSetter(propertyName, methodName) {
  if (!methodName) {
    methodName = propertyName;
  }
  UrlGrey.prototype[methodName] = function (str) {
    if (!str && str !== "") {
      return this.parsed()[propertyName];
    } else {
      var obj = new UrlGrey(this.toString());
      obj.parsed()[propertyName] = str;
      return obj;
    }
  };
}




