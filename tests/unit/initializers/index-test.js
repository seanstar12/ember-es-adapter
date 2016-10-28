import Ember from 'ember';
import IndexInitializer from 'dummy/initializers/index';
import { module, test } from 'qunit';

let application;

module('Unit | Initializer | index', {
  beforeEach() {
    Ember.run(function() {
      application = Ember.Application.create();
      application.deferReadiness();
    });
  }
});

// Replace this with your real tests.
test('it works', function(assert) {
  IndexInitializer.initialize(application);

  // you would normally confirm the results of the initializer here
  assert.ok(true);
});
