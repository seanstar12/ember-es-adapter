import {QueryDSL, EsTools} from 'dummy/utils/es-tools';
import { module, test } from 'qunit';

module('Unit | Utility | es-tools');

// Replace this with your real tests.
test('It imports', function(assert) {
  assert.expect(2);

  let queryDsl = new QueryDSL();
  let esTools = new EsTools();
  assert.ok(queryDsl);
  assert.ok(esTools);
});

test('Constructor constructs with properties', function(assert) {
  assert.expect(4);

  let obj = { 'from' : 10 };
  let es = new QueryDSL(obj);
  let query = es.getQuery();
  
  assert.equal(query.from, obj.from, "From number is the same.");

  obj = { 'page' : 10 };
  es = new QueryDSL(obj);
  query = es.getQuery();

  assert.equal(query.from, obj.page * 20, "Page is converted to From and maths are correct with default size.");

  obj = { 'page' : 10, 'size': 2};
  es = new QueryDSL(obj);
  query = es.getQuery();

  assert.equal(query.from, obj.page * obj.size, "Page is converted to From and maths are correct with override size");

  obj = { 'query': 'iamquery'};
  es = new QueryDSL(obj);
  query = es.getQuery();

  assert.equal(query.query.query_string.query, obj.query, "Query builds and matches");
});

test('Can Add Sort with Construct and chain', function(assert) {
  assert.expect(4);

  let sorts = {
    a: [
      'title'
    ],
    b: [
      { 'title': 'asc' }
    ],
    c: [
      'title',
      { 'date': 'desc' }
    ],
    d: [
      'title',
      { 'date': 'desc' },
      { 'date': { 'order' : 'asc' } }
    ]
  };

  let obj = { 'sort' : 'title' };
  let es = new QueryDSL(obj);
  let query = es.getQuery();
  
  assert.deepEqual(query.sort, sorts.a, "Adds constructed sort properly.");

  obj = { sort: {title : 'asc'}};
  es = new QueryDSL(obj);
  query = es.getQuery();

  assert.deepEqual(query.sort, sorts.b, "Adds constructed with sort-order properly.");

  obj = { 'sort' : 'title' };
  es = new QueryDSL(obj);
  query = es.sort({date: 'desc'}).getQuery();

  assert.deepEqual(query.sort, sorts.c, "Adds constructed with chained sort-order properly.");

  es = new QueryDSL();
  query = es.sort('title')
            .sort({date: 'desc'})
            .sort({ 'date' : { 'order' : 'asc' } })
            .getQuery();

  assert.deepEqual(query.sort, sorts.d, "Adds constructed with chained sort-order properly.");
});

test('Builds Complex Query with sort and constructor', function(assert) {
  let expected = {
    "query": {
        "bool":{
          "must":[
            {"match": {"title":"Im a title"} },
          ],
          "must_not":[
            {"match":{
              "message":{
                "query":"to be or not to be",
                "operator":"and",
                "zero_terms_query":"all"
            }}}
          ]
      }
    },
    "sort":[{"name":"desc"},{"title":"asc"}],
    "from":2,
    "size":17
  };

  let cons = {
    from: 2,
    size: 17
  };

  let es = new QueryDSL(cons);
  es.query()
    .sort({ 'name' : 'desc' })
    .sort({'title' : 'asc'})
    .bool('must')
    .match({ 'title':'Im a title' })
    .bool('must_not')
    .match({
      'message': {
        'query': 'to be or not to be',
        'operator': 'and',
        'zero_terms_query': 'all'
      }
    });

  let query = es.getQuery();
  //console.log({es, query});
  assert.deepEqual(query, expected, "Query was built properly");

  expected = {
    "query": {
        "bool":{
          "must":[
            {"match":{
              "message":{
                "query":"to be or not to be",
                "operator":"and",
                "zero_terms_query":"all"
            }}}
          ]
      }
    },
    "from":2,
    "size":17
  };

  es = new QueryDSL(cons);
  es.query(expected);

  query = es.getQuery();
  assert.deepEqual(query, expected, "Query was overloaded properly");
});
