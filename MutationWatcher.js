/**
 * @license
 * @author Bohdan Shtepan
 *
 * MutationWatcher 1.0.2
 * https://github.com/virtyaluk/mutation-watcher
 *
 * Copyright (c) 2015 Bohdan Shtepan
 * Licensed under the MIT license.
 */

(function(root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(function() {
            return factory(root);
        });
    } else if (typeof module !== 'undefined') {
        module.exports = factory(root);
    } else {
        root.MutationWatcher = factory(root);
    }
}(this, function(root) {
    'use strict';

    // Some shorthands
    var _elp = root.Element.prototype,

        _isAr = Array.isArray,

        MutationObserver = root.MutationObserver || root.WebKitMutationObserver || root.MozMutationObserver,

        MutationWatcher,

        _matches = _elp.matches ||
            _elp.webkitMatchesSelector ||
            _elp.mozMatchesSelector ||
            _elp.msMatchesSelector ||
            _elp.oMatchesSelector ||
            _elp.matchesSelector,

        _isObj = function(obj) {
            return typeof obj === 'object' && obj !== null;
        },

        _isFn = function(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        },

        _arrOrNull = function() {
            return [].filter.call(arguments, function(e) {
                return _isAr(e);
            })[0];
        },

        _isUndef = function(o) {
            return typeof o === 'undefined';
        },

        _customEventsNames = {
            attributes: 'attribute-change',
            elements: 'element-change',
            characterData: 'characterdata-change'
        },

        /**
         * Fires custom event on given `target` with given `data`
         *
         * @type {Function}
         * @param {HTMLElement} target - Target element
         * @param {String} name - Event name
         * @param {Object} data - Custom event data
         * @private
         * @returns {Undefined} Returns null.
         */
        _triggerEvent = function(target, name, data) {
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

        /**
         * Transforms Mutation Event or MutationEntry into MutationData object
         *
         * @type {Function}
         * @param {Object} mr - Mutation record
         * @returns {Object} - MutationData
         */
        _getMutationData = function(mr) {
            var md = {},
                props = ['target', 'attributeName', 'attributeNameNamespace', 'oldValue', 'newValue',
                    'attributeChange', 'relatedNode', 'addedNodes', 'removedNodes', 'previousSibling', 'nextSibling', 'type'];

            // Gets default values from MutationEntry
            props.forEach(function(prop) {
                md[prop] = mr[prop] || null;
            });

            // Overwrites data with MutationEvent data, if provided
            if (mr.type === 'DOMAttrModified') {
                md.type = 'attributes';
                md.attributeName = mr.attrName;
                md.oldValue = mr.prevValue;
                md.attributeChange = mr.attrChange; // 0 = UNRECOGNIZED, 1 = MODIFICATED, 2 = ADDED, 3 REMOVED/
            } else if (mr.type === 'DOMCharacterDataModified') {
                md.type = 'characterData';
                md.oldValue = mr.prevValue;
            } else if (mr.type === 'DOMNodeInserted' || mr.type === 'DOMNodeRemoved') {
                md.type = 'elements';
                md.target = mr.relatedNode;

                if (mr.type === 'DOMNodeInserted') {
                    md.addedNodes = [mr.target];
                } else {
                    md.removedNodes = [mr.target];
                }

                md.nextSibling = mr.target.nextSibling || null;
                md.previousSibling = mr.target.previousSibling || null;
            }

            return md;
        },

        /**
         * Determines if given `sequence` of elements contains given `target`
         *
         * @param {Array} sequence - Array of elements
         * @param {HTMLElement|String} target - Target element or its selector to compare with
         * @private
         * @returns {Boolean} True if input `sequence` contains `target`, otherwise false;
         */
        _testEl = function(sequence, target) {
            return !sequence || !target ? false : !![].filter.call(sequence, function(el) {
                return typeof el === 'string' ? _matches.call(target, el) : target === el;
            }).length;
        },

        /**
         * Handles MutationData
         *
         * @type {Function}
         * @param {Object} mutationData - MutationData
         * @private
         * @returns {Undefined} Returns null.
         */
        _publisher = function(mutationData) {
            var that = this,
                mutation = _getMutationData(mutationData),
                cond;

            mutation.type = mutation.type === 'childList' ? 'elements' : mutation.type;

            // Handles mutation data if `attributes` mutation allowed
            if (that._config.attributes && mutation.type === 'attributes') {
                cond = that._config.attributeFilter;

                // Deletes mutation data if `matchAttributes` array provided and none attribute is not matched
                if (cond && cond.length && cond.indexOf(mutation.attributeName) === -1) {
                    mutation = null;
                }

                // Handles mutation data if `elements` mutation allowed
            } else if (that._config.childList && mutation.type === 'elements') {
                cond = that._config.matchElements;

                // Deletes mutation data if `matchElements` array provided and none elements is not matched
                if (cond && cond.length && !_testEl(cond, (mutation.addedNodes || mutation.removedNodes)[0])) {
                    mutation = null;
                }

                // Handles mutation data if `characterData` mutation allowed
            } else if (that._config.characterData && mutation.type === 'characterData') {
                mutation.newValue = mutation.target.data || mutation.target.nodeValue;
                mutation.data = mutation.target;
                mutation.target = mutation.data.parentNode;
                cond = that._config.matchCharacterDataElements;

                if (cond && cond.length && !_testEl(cond, mutation.target)) {
                    mutation = null;
                }
            } else {
                mutation = null;
            }

            if (mutation && !that._config.subtree && mutation.type !== 'characterData' && mutation.target !== that._target) {
                mutation = null;
            }

            // Publishing mutation data
            if (mutation) {
                // Fires custom events if it's allowed
                if (that.allowCustomEvents) {
                    _triggerEvent(that._target, MutationWatcher.customEventsNames[mutation.type], mutation);
                }

                if (that._callback) {
                    that._callback(mutation, that);
                }

                that._records.push(mutation);
            }
        },

        _takeRecords = function() {
            var r = [];

            if (this._records) {
                r = this._records.slice(0);
                this._records.splice(0, this._records.length);
            }

            return r;
        },

        /**
         * Sets config to the main instance
         *
         * @type {Function}
         * @param {Array} obj - Configuration object
         * @private
         * @returns {Undefined} Returns null.
         */
        _setConfig = function(obj) {
            var that = this;

            that._config = {
                attributes: obj.attributes || that.allowCustomEvents,
                childList: obj.elements || that.allowCustomEvents,
                matchElements: obj.matchElements,
                characterData: obj.characterData || that.allowCustomEvents,
                subtree: obj.subtree || that.allowCustomEvents,
                matchCharacterDataElements: obj.matchCharacterDataElements
            };

            if (that._config.characterData && obj.characterDataOldValue && !that.allowCustomEvents) {
                that._config.characterDataOldValue = obj.characterDataOldValue;
            } else if (that.allowCustomEvents) {
                that._config.characterDataOldValue = true;
            }

            if (that._config.attributes && obj.attributeOldValue && !that.allowCustomEvents) {
                that._config.attributeOldValue = obj.attributeOldValue;
            } else if (that.allowCustomEvents) {
                that._config.attributeOldValue = true;
            }

            if (_isAr(obj.matchAttributes)) {
                that._config.attributeFilter = obj.matchAttributes;
            }
        },

        /**
         * Parses presented options.
         *
         * @param {HTMLElement} [target] - Target html element.
         * @param {Object} [opt] - The options object.
         * @private
         * @type {Function}
         * @returns {Undefined} - Returns null.
         */
        _getConfig = function(target, opt) {
            var that = this,
                options = opt || { all: true, subtree: false },
                toSet = {
                    elements: false,
                    matchElements: null,
                    attributes: false,
                    matchAttributes: null,
                    characterData: false,
                    subtree: false,
                    attributeOldValue: true,
                    characterDataOldValue: true,
                    matchCharacterDataElements: null
                };

            // Setting target
            if (target instanceof root.Node) {
                that._target = target;
            } else if (typeof target === 'string') {
                that._target = root.document.querySelector(target);
            } else {
                that._target = root.document;
            }

            if (options === 'all' || options.all) {
                toSet.attributes = toSet.elements = toSet.characterData = true;
                toSet.subtree = !!options.subtree || false;
            } else if (typeof options === 'string') {
                toSet.attributes = options === 'attributes';
                toSet.elements = options === 'elements';
                toSet.characterData = options === 'characterData';
            } else if (_isObj(options)) {
                toSet.attributes = !!options.attributes;
                toSet.attributeOldValue = !!options.attributeOldValue || toSet.attributes;
                toSet.matchAttributes = _arrOrNull(options.attributes, options.matchAttributes);

                toSet.elements = !!options.elements;
                toSet.matchElements = _arrOrNull(options.elements, options.matchElements);

                toSet.characterData = !!options.characterData;
                toSet.characterDataOldValue = !!options.characterDataOldValue || toSet.characterData;
                toSet.matchCharacterDataElements = _arrOrNull(options.characterData, options.matchCharacterDataElements);

                toSet.subtree = !!options.subtree;
            }

            _setConfig.call(that, toSet);
        },

        _watch = function(target, options) {
            var that = this;

            // Checks if there is observing that started earlier, if so - stops it
            if (that._isObserving) {
                that.disconnect();
            }

            if (!_isAr(that._records)) {
                that._records = [];
            }

            that._getConfig(target, options);

            // Finally starts observing
            if (MutationObserver) {
                // Creates instance of `MutationObserver` in userAgents that support it
                that._mutationObserver = new MutationObserver(function(mutations) {
                    mutations.forEach(that._publisher);
                });

                // Starting observer
                that._mutationObserver.observe(that._target, that._config);
            } else {
                // Old fashioned way to observe DOM mutations in environment  that don't support modern way using `MutationObserver`
                if (that._config.attributes) {
                    that._target.addEventListener('DOMAttrModified', that._publisher, false);
                }

                if (that._config.childList) {
                    that._target.addEventListener('DOMNodeInserted', that._publisher, false);
                    that._target.addEventListener('DOMNodeRemoved', that._publisher, false);
                }

                if (that._config.characterData) {
                    that._target.addEventListener('DOMCharacterDataModified', that._publisher, false);
                }
            }

            that._isObserving = true;

            return that;
        },

        _disconnect = function() {
            if (MutationObserver && this._mutationObserver) {
                // Disconnecting in modern browsers
                this._mutationObserver.disconnect();
            } else {
                // Disconnection in IE
                this._target.removeEventListener('DOMAttrModified', this._publisher, false);
                this._target.removeEventListener('DOMNodeInserted', this._publisher, false);
                this._target.removeEventListener('DOMNodeRemoved', this._publisher, false);
                this._target.removeEventListener('DOMCharacterDataModified', this._publisher, false);
            }

            this._isObserving = false;

            return _takeRecords.call(this);
        };

    /**
     * Constructor for instantiating new DOM mutation watchers.
     *
     * @param {cb} [callback] - The function which will be called per each DOM mutation.
     * @param {Boolean} [customEvents] - If set to true then custom events will be triggered on specified target.
     * @returns {MutationWatcher} - Returns the new instance of MutationWatcher.
     * @constructor
     */
    MutationWatcher = function(callback, customEvents) {
        var that = this;

        if (!(that instanceof MutationWatcher)) {
            return new MutationWatcher(callback, customEvents);
        }

        that._isObserving = false;
        that._target = null;
        that._records = null;
        that._config = null;
        that._mutationObserver = null;
        that._callback = _isFn(callback) ? callback : null;
        that._publisher = _publisher.bind(that);

        // If no callback provided - the custom events will be enabled automatically
        that.allowCustomEvents = _isUndef(customEvents) ? !(!_isUndef(callback) && callback !== null) : customEvents;

        return that;
    };

    MutationWatcher.prototype._getConfig = _getConfig;

    /**
     * The watcher will call this function with two arguments.
     *
     * @callback cb
     * @param {Object} md - The MutationData object.
     * @param {MutationWatcher} mw - Current MutationWatcher instance.
     */

    /**
     * Registers the MutationWatcher instance to receive notifications of DOM mutations on the specified node.
     *
     * @param {Node|String} [el] - The Node or a string representing the CSS selector for target node on which to observe DOM mutations.
     * @param {Object} [options] - An options object specifies which DOM mutations should be reported.
     * @type {Function}
     * @returns {MutationWatcher} Returns current instance for chaining.
     */
    MutationWatcher.prototype.watch = _watch;

    /**
     * Stops the MutationWatcher instance from receiving notifications of DOM mutations.
     *
     * @type {Function}
     * @returns {Object} Returns the MutationWatcher instance's record queue.
     */
    MutationWatcher.prototype.disconnect = _disconnect;

    /**
     * Returns queue of MutationData records
     *
     * @type {Function}
     * @returns {Array} MutationData records.
     */
    MutationWatcher.prototype.takeRecords = _takeRecords;

    /**
     * Holds default event names for custom events
     *
     * @type {{attributes: string, elements: string, characterData: string}}
     */
    MutationWatcher.customEventsNames = _customEventsNames;

    return MutationWatcher;
}));