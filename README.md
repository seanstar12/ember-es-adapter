# Ember-ES-Adapter
[![Build Status](https://travis-ci.org/seanstar12/ember-es-adapter.svg?branch=master)](https://travis-ci.org/seanstar12/ember-es-adapter)
[![npm version](https://badge.fury.io/js/ember-es-adapter.svg)](https://badge.fury.io/js/ember-es-adapter)
[![Ember Observer Score](http://emberobserver.com/badges/ember-es-adapter.svg)](http://emberobserver.com/addons/ember-es-adapter)
[![Code Climate](https://codeclimate.com/github/seanstar12/ember-es-adapter/badges/gpa.svg)](https://codeclimate.com/github/seanstar12/ember-es-adapter)

An adapter written for Elasticsearch and EmberJS.

#### Demo
[S3 Blog](http://ember-s3-blog-prod.s3-website-us-east-1.amazonaws.com/), this shows just the basics. I'm still working on
getting the ember repo into a stable (credential-free) state.

#### On the hotplate for [0.1.0]
  - [ ] Add functionality to the Adapter
    - [ ] findMany
    - [ ] queryRecord
    - [x] createRecord
    - [x] deleteRecord (Already works with default)
    - [x] query
    - [x] findAll
  - [ ] Add functionality to the Serializer
    - [x] normalizeCreateRecordResponse (Already works with default)
    - [ ] normalizeDeleteRecordResponse
    - [ ] normalizeQueryRecordResponse
    - [ ] normalizeResponse
    - [ ] normalizeUpdateRecordResponse
    - [x] normalizeFindAllResponse
    - [x] normalizeQueryResponse
    - [x] serialize (not a fan of this, but don't know a better way)
  - [ ] Blueprints
    - [ ] Adapter
    - [ ] Serializer
  - [ ] Es-Query-Builder -- (Move to EsTools utility)
    - [ ] Add filter function 
    - [ ] Add mustNot function 
    - [ ] Add should function 
    - [x] Add sorts
    - [x] Add use of default sort
    - [x] Allow params from route and filtered params
    - [x] Add prototype for detecting page (pagination API)
    - [x] Add must function 
    - [x] Add bool query template
    - [x] Add documentation (yui comments)
    - [x] Make it work
  - [ ] Make all the tests
    - [ ] The adapter
    - [ ] The serializer
    - [x] The AWS signer
    - [x] The es-query-builder

#### The gameplan [0.1.5]
  - [ ] Add functionality to the Adapter
    - [ ] shouldReloadRecord (If needed)
    - [ ] shouldReloadAll (If needed)
  - [ ] Add functionality to the Serializer
    - [ ] normalizeArrayResponse
    - [ ] normalizeFindManyResponse
    - [ ] cleanup serialize
  - [ ] Blueprints
    - [ ] Adapter
    - [ ] Serializer
  - [ ] Es-Query-Builder
    - [ ] Add Aggregation functionality
    - [ ] Add MoreLikeThis query
    - [ ] Add ES versioning
  - [ ] Finish up the AWS request signer
  - [ ] Make all the tests
    - [ ] The extend utility
  - [ ] Definitely more...

#### How to use this

  * Adapter 

  ```javascript
  `your_app/adapters/your_adapter.js`
  import Es from 'ember-es-adapter/adapters/adapter';
  import config from 'ember-get-config';

  export default Es.extend({
    host: config.EsAdapter.host, 
    namespace: config.EsAdapter.namespace, 
  });
  ```

  * Serializer 

  ```javascript
  `your_app/serializers/your_serializer.js`
  import Es from 'ember-es-adapter/serializer/serializer';
  export default Es.extend({
  });
  ```
  * In your app 

  ```javascript
  `your_app/routes/index.js`
  import EsQuery from 'ember-es-adapter/utils/es-query-builder';

  //let the adapter build the query
  export default Ember.Route.extend({
    model(params) {
      params['esParams'] = {sort: 'date', 'sortType': 'desc'};
      return this.store.query('post', params);
    }
  });

  //OR build it yourself and send it on.
  export default Ember.Route.extend({
    model(params) {
      //simulated params
      params['size'] = 10;
      params['query'] = 'yolo';

      //adding esParams into the default `params`, and initiating new instance
      params['esParams'] = {sort: 'date', 'sortType': 'desc'};
      let es = new EsQuery(params);

      if (params.query) {
        es.addBool({"query_string": {"query":params.query}});
      }

      //building the query, sending to adapter
      params['esQuery'] = es.buildQuery();
      return this.store.query('post', params);
    }
  });
  ```

#### ElasticSearch Query Builder
  * Useage example
    ```javascript
    import esQuery from "ember-es-adapter/utils/es-query-builder";
    let es = new esQuery({size: 2, from: 200});
    //  es = new esQuery(); // or no options
    es.addBool({'match': {"title": "Third"}}); //complex queries
    es.addBoolMatchField('title', 'Third'); //same as above, just simple
    es.addSort({'title':'asc'}); //add sort: can be complex
    es.addSort("title"); //add sort: or simple
    let query = es.buildQuery();
    ```

  * Using the Query Builder
    ```javascript
    //Constructor available params. All Optional
    {
      sort: "title",        // string  
      sortType: "asc:desc", // string  will not be used if sort is not defined
      from: 0,              // int  for offset
      size: 10,             // int  for length to return default: 20
    } 

    import EsQuery from 'ember-es-adapter/utils/es-query-builder';

    let es = new esQuery({size: 14, from: 200});
    ```
  * Building a Query
    ```javascript
    //Params
    .addBool(query, type) //type optional
    {
      query: {},            // object  
      type: optional,       // string defaults to 'must' if not supplied
                            // sets the type of query [must,filter,must_not,should]
    } 

    import EsQuery from 'ember-es-adapter/utils/es-query-builder';

    let es = new esQuery();

    //equivalent queries, latter allows for more complex queries
    es.addBoolMatchField('title', 'Third');
    es.addBool({'match': {"title": "Third"}});
    ```
  * Adding a Sort
    ```javascript
    //Adds sort option. This can be ran multiple times if more specific sorts
    // are needed. 
    {
      sort: "title" || {},    // string || object  
    } 

    import EsQuery from 'ember-es-adapter/utils/es-query-builder';

    let es = new esQuery();

    es.addSort('title');
    es.addSort({ "name": "asc" });
    es.addSort({ "post_date": { "order": "asc"} });
    ```

