import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';

moduleForModel('elasticsearch', 'Unit | Serializer | elasticsearch', {
  // Specify the other units that are required for this test.
  needs: ['serializer:elasticsearch']
});

// Replace this with your real tests.
test('it serializes records', function(assert) {
  let record = this.subject();
  let serializedRecord;

  Ember.run(function(){
    record.set('name', 'testName');
    record.set('formula_readonly', 'testreadonly');

    serializedRecord = record.serialize();

    assert.ok(serializedRecord);
    assert.equal(serializedRecord['name'], 'testName');
    assert.equal(serializedRecord['formula_readonly'], undefined);
  });

  assert.ok(serializedRecord);
});
