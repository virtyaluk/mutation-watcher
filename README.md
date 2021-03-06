<h1 align="center">
	<img width="256" height="256" src="https://rawgit.com/virtyaluk/mutation-watcher/master/media/mutation-watcher.png" alt="mutation-watcher">
	<br>
	<br>
</h1>

> **MutationWatcher** is a JavaScript library that comes to help make DOM mutation observing fast and easy.

[![Build Status](https://travis-ci.org/virtyaluk/mutation-watcher.svg)](https://travis-ci.org/virtyaluk/mutation-watcher) [![Code Climate](https://codeclimate.com/github/virtyaluk/mutation-watcher/badges/gpa.svg)](https://codeclimate.com/github/virtyaluk/mutation-watcher) [![Dependency Status](https://gemnasium.com/virtyaluk/mutation-watcher.svg)](https://gemnasium.com/virtyaluk/mutation-watcher)

**MutationWatcher** uses [MutationObserver API](https://developer.mozilla.org/en/docs/Web/API/MutationObserver "MutationObserver API") (in new browsers) or old-fashioned (deprecated) way with [Mutation events](https://developer.mozilla.org/en-US/docs/DOM/Mutation_events "Mutation events") (in browsers that doesn't support newest API) as a way to react to changes in DOM. Actually it works in all browsers that support any of this APIs.

## Install

bower:

```
$ bower install mutation-watcher
```

npm

```
$ npm install mutation-watcher
```

## Usage

```js
// Querying the target element
var target = document.querySelector('#signin-button');

// Options
var options = { attributes: [ 'pressed', 'focused', 'active'] };

// Creating the watcher instance
var watcher = new MutationWatcher(function(mutationData) { console.log(mutationData); });

// Finally starting the watcher
watcher.watch(target, options);

// Disconnecting from it
watcher.disconnect();
```

## API

The **MutationWatcher** library exports a single object - class called `MutationWatcher`. The class allows to create a new instance of DOM mutation watcher.

### Constructor

##### MutationWatcher()

Constructor for instantiating new DOM mutation watchers.

```js
MutationWatcher(
	function callback,
	bool customEvents
);
```
###### Parameters

- **`callback`**. *Optional.* Defaults to `null`. The function which will be called per each DOM mutation. The watcher will call this function with two arguments. The first is a **[MutationData](#mutation-data)** object. The second is the current instance of a `MutationWatcher`.
- **`customEvents`**. *Optional.* Defaults to `false` if `callback` provided and `true` if `callback` is `null`. If set to `true` then **[custom events](#custom-events)** will be triggered on specified target.

###### Note

If the class instance created without any argument, then `customEvents` will be set to `true` by default.
If no `callback` provided or it's `null` then all **[MutationData](#mutationdata)** objects will be added to the queue and available to return using **[takeRecords](#takerecords)** method.

### Instance methods

- void [watch](#watch)( Object target, Object options );
- void [disconnect](#disconnect)();
- Array [takeRecords](#takerecords)();

##### watch() #####

Registers the `MutationWatcher` instance to receive notifications of DOM mutations on the specified node.


```js
void watch(
	Object target,
	Object options
);
```

###### Parameters

- **`target`**. *Optional.* Defaults to `window.document`. The [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node "Node") or a string representing the CSS selector for target node on which to observe DOM mutations.
- **`options`**. *Optional.* Defaults to `all`. An **[options](#mutationwatcher-options)** object specifies which DOM mutations should be reported.

###### Note

If no `target` provided then the `window.document` will be used. 
If `options` object not provided then default **[options](#mutationwatcher-options)**  will be used.

##### disconnect()

Stops the `MutationWatcher` instance from receiving notifications of DOM mutations. Until the **[watch()](#watch)** method is used again, watcher's callback will not be invoked.

```js
void disconnect();
```

##### takeRecords()

Empties the `MutationWatcher` instance's record queue and returns what was in there.

```js
Array takeRecords();
```

###### Return value
Returns an Array of **[MutationData](#mutationdata)** objects.

### MutationWatcher Options

`MutationWatcher` options  is an object which can specify the following properties:

- **`attributes`** - Set to `true` if mutations to target's attributes are to be observed.
- **`elements`** - Set to `true` if additions and removals of the target node's child elements (including text nodes) are to be observed.
- **`characterData`** - Set to `true` if mutations to target's data are to be observed.
- **`subtree`** - Set to `true` if mutations to not just target, but also target's descendants are to be observed.
- **`attributeOldValue`** - Set to `true` if attributes is set to `true` and target's attribute value before the mutation needs to be recorded.
- **`characterDataOldValue`** - Set to `true` if characterData is set to `true` and target's data before the mutation needs to be recorded.
- **`matchAttributes`** - Set to an array of attribute local names (without namespace) if not all attribute mutations need to be observed.
- **`matchElements`** - Set to an array of CSS selectors or html elements if not all element mutations need to be observed.
- **`matchCharacterDataElements`** - Set to an array of CSS selectors or html elements if not all characterData mutations need to be observed.
- **`all`** - Shorthand. Set to true if `attributes`, `elements` and `characterData` need to be observed.

#### Default options

Options can be passed to **[watch()](#watch)** method as a plain string with single option or as an object with a combination of options.

```js
// Single option can be passed as a string
var singleOption = 'attributes'; // or 'elements', 'characterData', 'all'
watcher1.watch(callback, singleOption);

// To combine options use object notation
var optionsObj = {
	elements: true,
	subtree: true,
	// Filter elements
	matchElements: ['img.photo', 'div.wall-post', actualNodeElement]
};
watcher2.watch(callback, optionsObj);

// or
optionsObj = {
	elements: ['img.photo', 'div.wall-post', actualNodeElement],
	subtree: true
};
watcher3.watch(callback, optionsObj); 
```

If **[watch()](#watch)** called without the options or it's `null` then default options will be used. The default options object looks following:

```js
var watcher = new MutationWatcher(callback);
watcher.watch(target, null);
console.log(watcher._config);
/* prints out
{
    attributes: true,
    elements: true,
    characterData: true,
    attributeOldValue: true
    characterDataOldValue: true,
    subtree: false
}
*/
```

### MutationData

`MutationData` is the object that will be passed to the observer's `callback`. It has the following properties:

 **Property** | **Type** | **Description** 
 --- | --- | --- 
 type | String | Returns `attributes` if the mutation was an attribute mutation, `characterData` if it was a mutation to a CharacterData node, and `elements` if it was a mutation to the tree of nodes. 
 target | [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node "Node") | Returns the node the mutation affected, depending on the type. For attributes, it is the element whose attribute changed. For characterData, it is the CharacterData node. For elements, it is the node whose children changed. 
 addedNodes | [NodeList](https://developer.mozilla.org/en-US/docs/Web/API/NodeList "NodeList") | Return the nodes added. Will be a `null` if no nodes were added.
 removedNodes | [NodeList](https://developer.mozilla.org/en-US/docs/Web/API/NodeList "NodeList") | Return the nodes removed. Will be a `null` if no nodes were removed. 
 previousSibling | [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node "Node") | Return the previous sibling of the added or removed nodes, or `null`. 
 nextSibling | [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node "Node") | Return the next sibling of the added or removed nodes, or `null`. 
 attributeName | String | Returns the local name of the changed attribute, or `null`. 
 attributeNamespace | String | Returns the namespace of the changed attribute, or `null`. 
 oldValue | String | The return value depends on the type. For attributes, it is the value of the changed attribute before the change. For characterData, it is the data of the changed node before the change. For elements, it is `null`. 
 newValue | String | The return value dependents on the type. For attributes, it is the value of the changed attribute after the change. For characterData, it is the data of the changed node after the change. For elements, it is `null`. 

### Custom Events

It's possible to subscribe to custom mutation events instead of using `callback` passed to the constructor.
Default event names can be changed using the static object called `customEventsNames` on **MutationWatcher** class.

To enable custom events on a specific target, it needs to set `customEvents` property to `true` and invoke **[watch()](#watch)** method with or without any arguments.

```js
var watcher = new MutationWatcher(null,  true);
watcher.watch(myButton);

// Subscribing for attribute change
myButton.addEventListener(MutationWatcher.customEventsNames.attributes, function(event) {
	// Mutation data available in `details` property
	var mutationData = event.details;
}, false);
```

## Supported browsers:

- Chrome
- Firefox
- IE9+
- Safari
- Opera

## Running tests

Install dependencies:

```shell
$ npm install
```

Run them:

```shell
$ grunt test
```

## Changelog

##### 1.0.2 - September 7, 2015
* Moved from jshint to eslint
* Test improvements
* Updated npm dependencies
* Bug fixes

## Author

### Bohdan Shtepan

**[http://modern-dev.com](http://modern-dev.com)**

Please feel free to reach out to me if you have any questions or suggestions.

## License

MIT