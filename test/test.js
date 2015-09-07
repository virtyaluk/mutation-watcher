describe('MutationWatcher', function() {
    'use strict';

    var MW = root.MutationWatcher,
        that = this;

    beforeEach(function() {
        this.watcher = null;
        this.divsPool = null;
    });

    describe('Launching and disconnecting', function() {
        before(function() {
            this.divsPool = [root.document.createElement('div')];
        });

        it('should successfully create a new instance of the watcher', function() {
            this.watcher = new MW(null, false);

            expect(this.watcher).to.be.not.a('null');
            expect(this.watcher).to.be.an.instanceof(MW);
        });

        it('should start observing the changes & have the value of `isObserving` equals to true', function() {
            this.watcher.watch(this.divsPool[0]);

            expect(this.watcher).to.have.property('_isObserving').and.be.equal(true);
        });

        it('should have default configuration if no other options were passed', function() {
            expect(this.watcher._config).to.have.property('attributes').and.be.equal(true);
            expect(this.watcher._config).to.have.property('childList').and.be.equal(true);
            expect(this.watcher._config).to.have.property('characterData').and.be.equal(true);
            expect(this.watcher._config).to.have.property('subtree').and.be.equal(false);
        });

        it('should successfully disconnect the watcher', function() {
            this.watcher.disconnect();

            expect(this.watcher).to.have.property('_isObserving').and.be.equal(false);
        });
    });


    describe('attributes', function() {
        beforeEach(function() {
            this.divsPool = [root.document.createElement('div'), root.document.createElement('div')];
        });

        afterEach(function() {
            if (this.wathcer instanceof MW) {
                this.watcher.disconnect();
            }
        });

        it('should successfully observe changing of the attribute', function(done) {
            this.watcher = new MW(function(mutation) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('attributes');
                expect(mutation).to.have.property('attributeName').and.be.equal('name');
                done();
            });

            this.watcher.watch(this.divsPool[0], 'attributes');
            this.divsPool[0].setAttribute('name', 'Mr. Robot');
        });

        it('should successfully observing changing of the attribute based on attribute filter', function(done) {
            this.watcher = new MW(function(mutation) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('attributes');
                expect(mutation).to.have.property('attributeName').and.be.equal('organization');
                done();
            });

            this.watcher.watch(this.divsPool[0], {
                attributes: ['organization']
            });
            this.divsPool[0].setAttribute('name', 'Mr. Robot');
            this.divsPool[0].setAttribute('organization', 'fsociety');
        });

        it('should successfully observe changing of the attribute on the specified target and it`s descendants', function(done) {
            that = this;

            this.watcher = new MW(function(mutation) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('attributes');
                expect(mutation).to.have.property('attributeName').and.be.equal('occupation');
                expect(mutation.target).to.be.equal(that.divsPool[1]);
                done();
            });

            this.divsPool[0].appendChild(this.divsPool[1]);
            this.watcher.watch(this.divsPool[0], {
                attributes: true,
                subtree: true
            });
            this.divsPool[1].setAttribute('occupation', 'hacker');
        });

        it('should successfully observe changing of the attribute on the specified target and it`s descendants based on attribute filter', function(done) {
            that = this;

            this.watcher = new MW(function(mutation) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('attributes');
                expect(mutation).to.have.property('attributeName').and.be.equal('name-2');
                expect(mutation.target).to.be.equal(that.divsPool[1]);
                done();
            });

            this.divsPool[0].appendChild(this.divsPool[1]);
            this.watcher.watch(this.divsPool[0], {
                attributes: ['name-2'],
                subtree: true
            });
            this.divsPool[0].setAttribute('name-1', 'Tyrell Wellick');
            this.divsPool[1].setAttribute('name-2', 'Elliot Alderson');
        });
    });


    describe('elements', function() {
        beforeEach(function() {
            this.divsPool = [root.document.createElement('div'), root.document.createElement('div')];
            that = this;
        });

        afterEach(function() {
            if (this.wathcer instanceof MW) {
                this.watcher.disconnect();
            }
        });

        it('should successfully observe node insertion', function(done) {
            this.watcher = new MW(function(mutation, inst) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('elements');
                expect(mutation).to.have.property('addedNodes').and.have.length(1);
                expect(mutation.addedNodes[0]).to.be.equal(that.divsPool[1]);
                expect(mutation.target).to.be.equal(inst._target);
                done();
            });

            this.watcher.watch(this.divsPool[0], 'elements');
            this.divsPool[0].appendChild(this.divsPool[1]);
        });

        it('should successfully observe node removing', function(done) {
            this.watcher = new MW(function(mutation, inst) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('elements');
                expect(mutation).to.have.property('removedNodes').and.have.length(1);
                expect(mutation.removedNodes[0]).to.be.equal(that.divsPool[1]);
                expect(mutation.target).to.be.equal(inst._target);
                done();
            });

            this.divsPool[0].appendChild(this.divsPool[1]);
            this.watcher.watch(this.divsPool[0], 'elements');
            this.divsPool[0].removeChild(this.divsPool[0].firstChild);
        });

        it('should successfully observe elements mutation based on elements filter', function(done) {
            this.divsPool[2] = root.document.createElement('div');

            this.watcher = new MW(function(m, inst) {
                expect(m).to.be.not.a('null');
                expect(m).to.have.property('type').and.be.equal('elements');
                expect(m).to.have.property('addedNodes').and.have.length(1);
                expect(m.addedNodes[0]).to.be.equal(that.divsPool[2]);
                expect(m.target).to.be.equal(inst._target);
                done();
            });

            this.divsPool[1].className = 'foo';
            this.divsPool[2].className = 'bar';
            this.watcher.watch(this.divsPool[0], {
                elements: ['div.bar']
            });
            this.divsPool[0].appendChild(this.divsPool[1]);
            this.divsPool[0].appendChild(this.divsPool[2]);
        });

        it('should successfully observe elements mutation on specified target and it`s descendants', function(done) {
            this.divsPool[2] = root.document.createElement('div');

            this.watcher = new MW(function(m, inst) {
                expect(m).to.be.not.a('null');
                expect(m).to.have.property('type').and.be.equal('elements');
                expect(m).to.have.property('removedNodes').and.have.length(1);
                expect(m.removedNodes[0]).to.be.equal(that.divsPool[2]);
                expect(m.target.parentNode).to.be.equal(inst._target);
                done();
            });

            this.divsPool[0].className = 'container';
            this.divsPool[1].className = 'mutable';
            this.divsPool[2].className = 'most-inner';
            this.divsPool[1].appendChild(this.divsPool[2]);
            this.divsPool[0].appendChild(this.divsPool[1]);

            this.watcher.watch(this.divsPool[0], {
                elements: true,
                subtree: true
            });

            this.divsPool[0].firstElementChild.removeChild(this.divsPool[0].firstElementChild.firstChild);
        });
    });


    describe('characterData', function() {
        beforeEach(function() {
            this.divsPool = [root.document.createElement('div')];
            that = this;
        });

        afterEach(function() {
            if (this.wathcer instanceof MW) {
                this.watcher.disconnect();
            }
        });

        it('should successfully observe characterData mutation', function(done) {
            this.watcher = new MW(function(m) {
                expect(m).to.be.not.a('null');
                expect(m).to.have.property('type').and.be.equal('characterData');
                expect(m).to.have.property('newValue').and.be.equal('FooBar');
                expect(m.target).to.be.equal(that.divsPool[0]);
                expect(m).to.have.property('data').and.be.not.a('null');
                done();
            });

            this.divsPool[0].innerHTML = 'Foo';

            this.watcher.watch(this.divsPool[0], {
                characterData: true,
                subtree: true
            });

            this.divsPool[0].firstChild.appendData('Bar');
        });

        it('should successfully observe characterData mutation on specified targets based on elements filter', function(done) {
            this.divsPool[1] = root.document.createElement('div');
            this.divsPool[2] = root.document.createElement('div');
            this.divsPool[1].innerHTML = 'Text1';
            this.divsPool[2].innerHTML = 'Text2';
            this.divsPool[1].className = 'foo';
            this.divsPool[2].className = 'bar';
            this.divsPool[0].appendChild(this.divsPool[1]);
            this.divsPool[0].appendChild(this.divsPool[2]);

            this.watcher = new MW(function(m) {
                expect(m).to.be.not.a('null');
                expect(m).to.have.property('type').and.be.equal('characterData');
                expect(m).to.have.property('newValue').and.be.equal('Text2Data2');
                expect(m.target).to.be.equal(that.divsPool[2]);
                expect(m).to.have.property('data').and.be.not.a('null');
                done();
            });

            this.watcher.watch(this.divsPool[0], {
                characterData: ['div.bar'],
                subtree: true
            });

            this.divsPool[1].firstChild.appendData('Data1');
            this.divsPool[2].firstChild.appendData('Data2');
        });
    });


    describe('Custom events', function() {
        beforeEach(function() {
            this.divsPool = [root.document.createElement('div')];
            this.watcher = new MW(null, true);
            this.watcher.watch(this.divsPool[0]);
            that = this;
        });

        afterEach(function() {
            if (this.wathcer instanceof MW) {
                this.watcher.disconnect();
            }
        });

        it('should successfully subscribe to the custom event and get notification when attribute would change', function(done) {
            this.divsPool[0].addEventListener(MW.customEventsNames.attributes, function(ev) {
                expect(ev).to.be.not.a('null');
                expect(ev).to.have.property('detail');
                that.eventData = ev.detail;
                expect(that.eventData).to.have.property('type').and.be.equal('attributes');
                expect(that.eventData).to.have.property('attributeName').and.be.equal('foo');
                expect(that.eventData).to.have.property('target').and.be.equal(that.divsPool[0]);
                done();
            }, false);

            this.divsPool[0].setAttribute('foo', 'bar');
        });

        it('should successfully subscribe to the custom event and get notification when target descendants are changing', function(done) {
            this.divsPool[1] = root.document.createElement('div');

            this.divsPool[0].addEventListener(MW.customEventsNames.elements, function(ev) {
                expect(ev).to.be.not.a('null');
                expect(ev).to.have.property('detail');
                that.eventData = ev.detail;
                expect(that.eventData).to.have.property('type').and.be.equal('elements');
                expect(that.eventData).to.have.property('addedNodes').and.have.length(1);
                expect(that.eventData.addedNodes[0]).to.be.equal(that.divsPool[1]);
                done();
            }, false);

            this.divsPool[0].appendChild(this.divsPool[1]);
        });

        it('should successfully subscribe to the custom event and get notification when characterData would change', function(done) {
            this.divsPool[0].innerHTML = 'Foo';

            this.divsPool[0].addEventListener(MW.customEventsNames.characterData, function(ev) {
                expect(ev).to.be.not.a('null');
                expect(ev).to.have.property('detail');
                that.eventData = ev.detail;
                expect(that.eventData).to.have.property('type').and.be.equal('characterData');
                expect(that.eventData).to.have.property('newValue').and.be.equal('FooBar');
                expect(that.eventData.target).to.be.equal(that.divsPool[0]);
                expect(that.eventData).to.have.property('data').and.be.not.a('null');
                done();
            }, false);

            // fix to passing the test in ie9 & phantomjs
            setTimeout(function() {
                that.divsPool[0].firstChild.appendData('Bar');
            }, 50);
        });
    });
});