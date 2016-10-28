import VERSION from 'ember-es-adapter/version';
import Ember from 'ember';

export function initialize(/* application */) {
  Ember.libraries.register('Ember Elasticsearch Adapter', VERSION);
}

export default {
  name: 'index',
  initialize
};
