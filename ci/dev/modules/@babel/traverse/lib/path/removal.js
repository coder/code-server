"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.remove = remove;
exports._removeFromScope = _removeFromScope;
exports._callRemovalHooks = _callRemovalHooks;
exports._remove = _remove;
exports._markRemoved = _markRemoved;
exports._assertUnremoved = _assertUnremoved;

var _removalHooks = require("./lib/removal-hooks");

var _cache = require("../cache");

var _index = _interopRequireWildcard(require("./index"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function remove() {
  var _this$opts;

  this._assertUnremoved();

  this.resync();

  if (!((_this$opts = this.opts) != null && _this$opts.noScope)) {
    this._removeFromScope();
  }

  if (this._callRemovalHooks()) {
    this._markRemoved();

    return;
  }

  this.shareCommentsWithSiblings();

  this._remove();

  this._markRemoved();
}

function _removeFromScope() {
  const bindings = this.getBindingIdentifiers();
  Object.keys(bindings).forEach(name => this.scope.removeBinding(name));
}

function _callRemovalHooks() {
  for (const fn of _removalHooks.hooks) {
    if (fn(this, this.parentPath)) return true;
  }
}

function _remove() {
  if (Array.isArray(this.container)) {
    this.container.splice(this.key, 1);
    this.updateSiblingKeys(this.key, -1);
  } else {
    this._replaceWith(null);
  }
}

function _markRemoved() {
  this._traverseFlags |= _index.SHOULD_SKIP | _index.REMOVED;
  if (this.parent) _cache.path.get(this.parent).delete(this.node);
  this.node = null;
}

function _assertUnremoved() {
  if (this.removed) {
    throw this.buildCodeFrameError("NodePath has been removed so is read-only.");
  }
}