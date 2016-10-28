import EsQuery from 'dummy/utils/es-query-builder';
import { module, test } from 'qunit';

module('Unit | Utility | esQueryBuilder');

// Replace this with your real tests.
test('It imports', function(assert) {
  let result = new EsQuery();
  assert.ok(result);
});

test('Constructor constructs with properties', function(assert) {
  let obj = { 'from' : 10 };
  let es = new EsQuery(obj);
  
  console.log(es);
  assert.equal(es.options.page, obj.page, "From number is the same.");
});

test('Constructor default sort', function(assert) {
  assert.expect(2);

  let obj = { 'sort' : 'title' };
  let es = new EsQuery(obj);
  let query = es.buildQuery();
  
  assert.deepEqual(query.sort, ['title'], "Adds default sort properly.");

  obj = { 'sort' : 'title', 'sortType' : 'asc' };
  es = new EsQuery(obj);
  query = es.buildQuery();

  assert.deepEqual(query.sort, [{'title':'asc'}], "Adds default with sort-order properly.");
});

test('Adds correct sort params', function(assert) {
  let sorts = [
    'title',
    { 'date' : { 'order' : 'asc' } },
    { 'name' : 'desc' }
  ];

  let es = new EsQuery();

  es.addSort('title');
  es.addSort({ 'date' : { 'order' : 'asc' } });
  es.addSort({ 'name' : 'desc' });
  
  assert.deepEqual(es.sort, sorts, "Query sort matches test array.");
});

test('_getOffsetFromPage', function(assert) {
  assert.expect(2);

  let es = new EsQuery();
  let offset = es._getOffsetFromPage(3, 5);
  
  assert.equal(offset, 15, "Offset returns correct value");

  offset = es._getOffsetFromPage(3);
  assert.equal(offset, 60, "Offset returns correct value using default size");
});

test('Builds Complex Query with sort and constructor', function(assert) {
  let expected = {
    "query": {
      "query":{
        "bool":{
          "must":[
            {"match": {"title":"Im a title"} },
            {"match":{
              "message":{
                "query":"to be or not to be",
                "operator":"and",
                "zero_terms_query":"all"
            }}}
          ],
          "filter":[],"must_not":[],"should":[]
      }}
    },
    "sort":[{"name":"desc"},{"title":"asc"}],
    "from":2,
    "size":17
  };
  let cons = {
    from: 2,
    size: 17,
    sort: 'title',
    sortType: 'asc'
  };

  let es = new EsQuery(cons);
  es.addSort({ 'name' : 'desc' });
  es.addBoolMatchField('title', 'Im a title');
  es.addBool({
    'match': {
      'message': {
        'query': 'to be or not to be',
        'operator': 'and',
        'zero_terms_query': 'all'
      }
    }
  });

  let query = es.buildQuery();
  assert.deepEqual(query, expected, "Query was built properly");
});
