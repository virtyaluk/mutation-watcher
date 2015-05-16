/*
 * MutationWatcher
 * https://github.com/virtyaluk/mutation-watcher
 *
 * Copyright (c) 2015 Bohdan Shtepan
 * Licensed under the MIT license.
 */

;(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        define('MutationWatcher', [], factory(root));
    } else if (typeof module !== 'undefined') {
        module.exports = factory(root);
    } else {
        root.MutationWatcher = factory(root);
    }
}(this, function (root) {
    "use strict";

    // Cross-browser way to get built-in `MutationObserver` if it exists
    root.MutationObserver = root.MutationObserver || root.WebKitMutationObserver || root.MozMutationObserver;

    // Some shorthands
    var _elp = root.Element.prototype,
        _isAr = Array.isArray,

        // Capturing `matches` function in cross-browser way
        _matches = _elp.matches || _elp.webkitMatchesSelector || _elp.mozMatchesSelector || _elp.msMatchesSelector || _elp.oMatchesSelector || _elp.matchesSelector,


        _isObj = function (obj) {
            return typeof obj === 'object' && obj !== null;
        },
        _isFn = function (obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        },

        // Holds default event names for custom events
        _customEventsNames = {
            attributes: 'attribute-change',
            elements: 'element-change',
            characterData: 'characterdata-change'
        },

        // Fires custom event on given `target` with given `data`
        _triggerEvent = function (target, name, data) {
            var event;

            try {
                event = new root.CustomEvent(name, {
                    detail: data
                });
            } catch (ex) {
                event = root.document.createEvent('CustomEvent');
                event.initCustomEvent(name, true, true, data);
            }

            target.dispatchEvent(event);
        },

        // Builds `options` object
        _setOptions = function (at, el, cd, st) {
            var options = {};

            options.attributes = at && at[0];
            options.matchAttributes = at && at[0] && at[1] ? at[1] : null;

            options.elements = el && el[0];
            options.matchElements = el && el[0] && el[1] ? el[1] : null;

            options.characterData = cd && cd[0];

            options.subtree = st;

            return options;
        },

        // Handles MutationData
        _mutationsPublisher = function (mutation) {
            var obj = new MutationData(mutation),
                send = null,
                that = this;

            obj.type = obj.type == 'childList' ? 'elements' : obj.type;

            if (!_isAr(that._scope.records)) {
                that._scope.records = [];
            }

            // Handles mutation data if `attributes` mutation allowed
            if (that._scope.options.attributes && obj.type === 'attributes') {
                send = obj;

                // Deletes mutation data if `matchAttributes` array provided and none attribute is not matched
                if (that._scope.options.matchAttributes && that._scope.options.matchAttributes.length && that._scope.options.matchAttributes.indexOf(obj.attributeName) === -1) {
                    send = null;
                }

                // Handles mutation data if `elements` mutation allowed
            } else if (that._scope.options.elements && obj.type === 'elements') {
                send = obj;

                // Deletes mutation data if `matchElements` array provided and none elements is not matched
                if (that._scope.options.matchElements && that._scope.options.matchElements.length) {
                    var cond = false,
                        element = obj.addedNodes && obj.addedNodes.length ? obj.addedNodes[0] : obj.removedNodes[0],
                        selector;
                    for (var i = 0, l = that._scope.options.matchElements.length; i < l; i++) {
                        selector = that._scope.options.matchElements[i];

                        if (_matches.call(element, selector)) {
                            cond = true;
                        }
                    }

                    if (!cond) {
                        send = null;
                    }
                }

                // Handles mutation data if `charachterData` mutation allowed
            } else if (that._scope.options.characterData && obj.type === 'characterData') {
                send = obj;
            }

            // Fires custom events if it's allowed
            if (that.allowCustomEvents) {
                _triggerEvent(that._scope.target, MutationWatcher.customEventsNames[obj.type], obj);
            }

            // Deletes mutation data if `subtree` is set to true and mutation target is not matched observing target
            if ((that._scope.options.attributes || that._scope.options.characterData) && (that._scope.options.subtree && obj.target !== that.target)) {
                obj = null;
            }

            // Publishing mutation data
            if (send) {
                if (that._scope.callback) {
                    that._scope.callback(send, that);
                }

                that._scope.records.push(obj);
            }
        },

        // Returns queue of MutationData records
        _takeRecords = function () {
            var r = [];

            if (this._scope.records) {
                r = this._scope.records.slice(0);
                this._scope.records.splice(0, this._scope.records.length);
            }

            return r;
        },

        // Parses presented options
        _getOptions = function (target, options) {
            var that = this,
                o = null;

            // Sets Node as target
            if (target && target instanceof root.Node) {
                that._scope.target = target;
            } else {
                // Queries target using given css selector
                if (typeof target === 'string') {
                    that._scope.target = root.document.querySelector(target);
                }

                // Sets `window.document` as target if nothing was provided
                if (!that._scope.target) {
                    that._scope.target = root.document;
                }
            }

            // If no options and callback provided - no worries. The data will be sended to the Gargantua black hole. Cooper was waiting for this for a long time :)
            if (!options) {
                options = {
                    all: true
                };
            }

            // Builds options object
            if (typeof options === 'string') {
                options = options.toLocaleLowerCase().trim();

                switch (options) {
                case 'attributes':
                    o = _setOptions([true, null], null, null, false);
                    break;
                case 'elements':
                    o = _setOptions(null, [true, null], null, false);
                    break;
                case 'characterdata':
                    o = _setOptions(null, null, [true], false);
                    break;
                default:
                    o = _setOptions([true, null], [true, null], [true, null], false);
                    break;
                }
            } else if (_isObj(options)) {
                var at = [],
                    el = [],
                    cd = [],
                    st = !!options.subtree;

                if (options.all || (!options.attributes && !options.elements && !options.characterData)) {
                    at = [true, null];
                    el = [true, null];
                    cd = [true, null];
                } else {
                    if (_isAr(options.attributes)) {
                        at[0] = true;
                        at[1] = options.attributes;
                    } else {
                        at[0] = !!options.attributes;
                        at[1] = (options.matchAttributes && at[0]) ? options.matchAttributes : null;
                    }

                    if (_isAr(options.elements)) {
                        el[0] = true;
                        el[1] = options.elements;
                    } else {
                        el[0] = !!options.elements;
                        el[1] = (options.matchElements && el[0]) ? options.matchElements : null;
                    }

                    if (_isAr(options.characterData)) {
                        cd[0] = true;
                        cd[1] = options.characterData;
                    } else {
                        cd[0] = !!options.characterData;
                        cd[1] = (options.characterData && cd[0]) ? options.characterData : null;
                    }
                }

                o = _setOptions(at, el, cd, st);
            }

            that._scope.options = o;
        },

        // Observers logic
        _watch = function (target, options) {
            var that = this;

            // Checks if there is observing that started earlier, if so - stops it
            if (that._scope.isObserving) {
                that.disconnect();
            }

            _getOptions.call(that, target, options);

            // Finally starts observing
            if (root.MutationObserver) {
                // Creates instance of `MutationObserver` in userAgents that supports it
                that._scope.mutationObserver = new root.MutationObserver(function (mutations) {
                    mutations.forEach(that._scope.mutationPublisher);
                });

                // Subscribes for all types of mutations
                var config = {
                    attributes: true,
                    childList: true,
                    characterData: true,
                    attributeOldValue: true,
                    characterDataOldValue: true,
                    subtree: that._scope.options.subtree
                };

                if (_isAr(that._scope.options.matchAttributes)) {
                    config.attributeFilter = that._scope.options.matchAttributes;
                }

                // Starts observing
                that._scope.mutationObserver.observe(that._scope.target, config);
            } else {
                // Old way to observe DOM mutations in useragents that doesn't support modern way using `MutationObserver`
                that._scope.target.addEventListener('DOMAttrModified', that._scope.mutationPublisher, false);
                that._scope.target.addEventListener('DOMNodeInserted', that._scope.mutationPublisher, false);
                that._scope.target.addEventListener('DOMNodeRemoved', that._scope.mutationPublisher, false);
                that._scope.target.addEventListener('DOMCharacterDataModified', that._scope.mutationPublisher, false);
            }

            that._scope.isObserving = true;

            return that;
        },
        _disconnect = function () {
            if (root.MutationObserver && this._scope.mutationObserver) {
                // Disconnecting in modern browsers
                this._scope.mutationObserver.disconnect();
            } else {
                // Disconnection in IE
                this._scope.target.removeEventListener('DOMAttrModified', this._scope.mutationPublisher, false);
                this._scope.target.removeEventListener('DOMNodeInserted', this._scope.mutationPublisher, false);
                this._scope.target.removeEventListener('DOMNodeRemoved', this._scope.mutationPublisher, false);
                this._scope.target.removeEventListener('DOMCharacterDataModified', this._scope.mutationPublisher, false);
            }

            this._scope.isObserving = false;

            return _takeRecords.call(this);
        },

        // Main constructor
        MutationWatcher = function (callback, customEvents) {
            if (this instanceof MutationWatcher) {
                var that = this;

                that._scope = {
                    records: null,
                    callback: _isFn(callback) ? callback : null,
                    mutationPublisher: _mutationsPublisher.bind(that),
                    isObserving: false,
                    mutationObserver: null,
                    target: null,
                    options: null
                };

                // Seal it, just in case
                Object.seal(that._scope);

                // If no callback provided - the custom events will be enabled automatically
                that.allowCustomEvents = _isFn(callback) ? !!customEvents : true;

                return that;
            } else {
                return new MutationWatcher(callback, customEvents);
            }
        },

        // Transforms Mutation Event or MutationEntry into MutationData instance
        MutationData = function (mr) {
            if (this instanceof MutationData) {
                var that = this;

                // Gets default values from MutationEntry, if provided
                that.target = mr.target || null;
                that.type = mr.type || null;
                that.attributeName = mr.attributeName || null;
                that.attributeNamespace = mr.attributeNamespace || null;
                that.oldValue = mr.oldValue || null;
                that.newValue = mr.newValue || null;
                that.attributeChange = 0;
                that.relatedNode = mr.relatedNode || null;
                that.addedNodes = mr.addedNodes || null;
                that.removedNodes = mr.removedNodes || null;
                that.previousSibling = mr.previousSibling || null;
                that.nextSibling = mr.nextSibling || null;

                // Overvrites data with Mutation Event data, if provided
                switch (mr.type) {
                case 'DOMAttrModified':
                    {
                        that.target = mr.target;
                        that.type = 'attributes';
                        that.attributeName = mr.attrName;
                        that.oldValue = mr.prevValue;
                        that.newValue = mr.newValue;
                        that.attributeChange = mr.attrChange; // 0 = UNRECOGNIZED, 1 = MODIFICATED, 2 = ADDED, 3 REMOVED/

                        if (mr.relatedNode) {
                            that.relatedNode = mr.relatedNode;
                        }
                    }
                    break;
                case 'DOMCharacterDataModified':
                    {
                        that.em.type = 'characterData';
                        that.target = mr.target;
                        that.oldValue = mr.prevValue;
                        that.newValue = mr.newValue;
                    }
                    break;
                case 'DOMNodeInserted':
                case 'DOMNodeRemoved':
                    {
                        that.type = 'elements';
                        that.target = mr.relatedNode;
                        if (mr.type === 'DOMNodeInserted') {
                            that.addedNodes = [mr.target];
                        } else {
                            that.removedNodes = [mr.target];
                        }
                        that.nextSibling = mr.target.nextSibling || null;
                        that.previousSibling = mr.target.previousSibling || null;
                    }
                    break;
                }

                return that;
            } else {
                return new MutationData(mr);
            }
        };

    MutationWatcher.prototype.watch = _watch;
    MutationWatcher.prototype.disconnect = _disconnect;
    MutationWatcher.prototype.takeRecords = _takeRecords;
    MutationWatcher.customEventsNames = _customEventsNames;

    return MutationWatcher;
}));