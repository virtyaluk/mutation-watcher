"use strict";

describe('MutationWatcher', function () {
    var MW = root.MutationWatcher;
    
    beforeEach(function(){
            this.watcher = null;
            this.div = root.document.createElement('div');
            this.innerDiv = root.document.createElement('div');
        });

    describe('Start watching and disconnect', function () {
        var watcher,div;
        before(function(){
            watcher = new MW();
            div = root.document.createElement('div');
            watcher.watch(div);
        });
        
        it('should create a new instace of `MutationWatcher` class', function () {
            expect(watcher).to.be.not.a('null');
            expect(watcher).to.be.an.instanceof(MW);
        });

        it('should return default options', function () {
            expect(watcher._scope.options).to.have.property('attributes').and.be.equal(true);
            expect(watcher._scope.options).to.have.property('elements').and.be.equal(true);
            expect(watcher._scope.options).to.have.property('characterData').and.be.equal(true);
            expect(watcher._scope.options).to.have.property('subtree').and.be.equal(false);
        });
    
        // Stupid PhantomJS was always fail the following test or next if it`s ommited, so this test doesn`t make any sense
        // And I asking you, why that guys from PhantomJS team even can't make this things to work fine? What they do out there at all?
        it('should successfully sets elemtn`s attribute and disconnect the watcher', function (done) {
            watcher = new MW();

            watcher.watch(div);
            expect(watcher._scope).to.have.property('isObserving').and.be.equal(true);
            div.setAttribute('foo', '');

            // need to await for records
            root.setTimeout(function () {
                var records = watcher.disconnect();
                expect(watcher._scope).to.have.property('isObserving').and.be.equal(false);
                records = null;
                done();
            }, 50); // 100ms that even in PhantomJS will work
        });
    });

    describe('Attributes mutations', function () {
        
        it('should observe attribute mutations on specified target', function (done) {
            this.watcher = new MW(function (mutation) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('attributes');
                expect(mutation).to.have.property('attributeName').and.be.equal('arrow');
                done();
            });

            this.watcher.watch(this.div, 'attributes');
            this.div.setAttribute('arrow', 'Oliver Queen');
        });

        it('should observe specified attribute mutations', function (done) {
            this.watcher = new MW(function (mutation) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('attributes');
                expect(mutation).to.have.property('attributeName').and.be.equal('atom');
                done();
            });

            this.watcher.watch(this.div, {
                attributes: ['atom']
            });
            this.div.setAttribute('atom', 'Ray Palmer');
        });

        it('should observe attribute mutations not only on specified target but also on it`s descendants', function (done) {
            var id = this.innerDiv;
            this.watcher = new MW(function (mutation) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('attributes');
                expect(mutation).to.have.property('attributeName').and.be.equal('the-flash');
                expect(mutation.target).to.be.equal(id);
                done();
            });

            this.div.appendChild(this.innerDiv);
            this.watcher.watch(this.div, {
                attributes: true,
                subtree: true
            });
            this.innerDiv.setAttribute('the-flash', 'Barry Allen');
        });

        it('should observe specified attribute mutations on specified target and on it`s descendants', function (done) {
            var id = this.innerDiv;
            this.watcher = new MW(function (mutation) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('attributes');
                expect(mutation).to.have.property('attributeName').and.be.equal('firestorm');
                expect(mutation.target).to.be.equal(id);
                done();
            });

            this.div.appendChild(this.innerDiv);
            this.watcher.watch(this.div, {
                attributes: ['firestorm'],
                subtree: true
            });
            this.innerDiv.setAttribute('the-flash', 'Barry Allen');
            this.innerDiv.setAttribute('firestorm', 'Ronnie Raymond');
        });
    });

    describe('Elements mutations', function () {
        it('should observe node insertion', function (done) {
            var id = this.innerDiv;
            this.watcher = new MW(function (mutation, inst) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('elements');
                expect(mutation).to.have.property('addedNodes').and.have.length(1);
                expect(mutation.addedNodes[0]).to.be.equal(id);
                expect(mutation.target).to.be.equal(inst._scope.target);
                done();
            });

            this.watcher.watch(this.div, 'elements');
            this.div.appendChild(this.innerDiv);
        });

        it('should observe node removing', function (done) {
            var id = this.innerDiv;
            this.watcher = new MW(function (mutation, inst) {
                expect(mutation).to.be.not.a('null');
                expect(mutation).to.have.property('type').and.be.equal('elements');
                expect(mutation).to.have.property('removedNodes').and.have.length(1);
                expect(mutation.removedNodes[0]).to.be.equal(id);
                expect(mutation.target).to.be.equal(inst._scope.target);
                done();
            });

            this.div.appendChild(this.innerDiv);
            this.watcher.watch(this.div, 'elements');
            this.div.removeChild(this.div.firstChild);
        });

        it('should observe target`s descendants mutations by specified filter', function (done) {
            this.watcher = new MW(function (m, inst) {
                expect(m).to.be.not.a('null');
                expect(m).to.have.property('type').and.be.equal('elements');
                expect(m).to.have.property('addedNodes').and.have.length(1);
                expect(m.addedNodes[0]).to.be.equal(innerDiv2);
                expect(m.target).to.be.equal(inst._scope.target);
                done();
            });
            var innerDiv2 = root.document.createElement('div');

            this.innerDiv.className = 'foo';
            innerDiv2.className = 'bar';
            this.watcher.watch(this.div, {
                elements: ['div.bar']
            });
            this.div.appendChild(this.innerDiv);
            this.div.appendChild(innerDiv2);
        });
    });

    describe('Custom events', function () {
        it('should successfully subscribe to custom event and to observe its changes', function (done) {
            this.watcher = new MW(null, true);
            this.watcher.watch(this.div);
            
            var td = this.div;

            this.div.addEventListener(MW.customEventsNames.attributes, function (ev) {
                expect(ev).to.have.property('detail');
                var m = ev.detail;
                expect(m).to.have.property('type').and.be.equal('attributes');
                expect(m).to.have.property('attributeName').and.be.equal('foo');
                expect(m).to.have.property('target').and.be.equal(td);
                done();
            }, false);

            this.div.setAttribute('foo', 'bar');
        });
    });
});