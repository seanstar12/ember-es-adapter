import { moduleFor, test } from 'ember-qunit';

moduleFor('adapter:adapter', 'Unit | Adapter | adapter', {
  // Specify the other units that are required for this test.
  // needs: ['serializer:foo']
  subject: function(options, factory) {
    return factory.create({
      'namespace': 'blog'
    });
  }
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let adapter = this.subject();
  assert.ok(adapter);
});

test('buildURL - should use plurals', function(assert) {
  var adapter = this.subject();
  assert.equal(adapter.buildURL('post', 1), "/blog/posts/1");
});

test('Adapter uses proper hostname', function(assert) {
  var adapter = this.subject();
  adapter.set('host', 'sub.domain.com');
  assert.equal(adapter.buildURL('post', 1), "sub.domain.com/blog/posts/1");
});
