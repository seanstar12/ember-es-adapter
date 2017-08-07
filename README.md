# Ember-ES-Adapter
[![Build Status](https://travis-ci.org/seanstar12/ember-es-adapter.svg?branch=master)](https://travis-ci.org/seanstar12/ember-es-adapter)
[![npm version](https://badge.fury.io/js/ember-es-adapter.svg)](https://badge.fury.io/js/ember-es-adapter)
[![Ember Observer Score](http://emberobserver.com/badges/ember-es-adapter.svg)](http://emberobserver.com/addons/ember-es-adapter)
[![Code Climate](https://codeclimate.com/github/seanstar12/ember-es-adapter/badges/gpa.svg)](https://codeclimate.com/github/seanstar12/ember-es-adapter)

An adapter written for Elasticsearch and EmberJS.

#### Demo
[S3 Blog](http://ember-s3-blog-prod.s3-website-us-east-1.amazonaws.com/), this shows just the basics. The repo
can be found here: [ember-s3-blog](https://github.com/seanstar12/ember-s3-blog). This is very much a work in 
progress, but allows me to have a use-case to build the adapter.

#### On the hotplate for [0.1.0]
  - [ ] Add functionality to the Adapter
    - [ ] findMany
    - [ ] queryRecord
    - [-] updateRecord (partially implemented, not fully tested)
    - [x] createRecord
    - [x] deleteRecord (Already works with default)
    - [x] query
    - [x] findAll
  - [ ] Add functionality to the Serializer
    - [x] normalizeCreateRecordResponse (Already works with default)
    - [ ] normalizeDeleteRecordResponse
    - [ ] normalizeQueryRecordResponse
    - [x] normalizeResponse
    - [ ] normalizeUpdateRecordResponse
    - [x] normalizeFindAllResponse
    - [x] normalizeSingleResponse
    - [x] normalizeQueryResponse
    - [x] serialize (not a fan of this, but don't know a better way)
  - [ ] Blueprints
    - [ ] Adapter
    - [ ] Serializer
  - [ ] ES-Tools
    - [ ] QueryDSL
      - [ ] Add MoreLikeThis
      - [ ] Add Aggregations
      - [x] Add Query
        - [x] Add Default Param Override
        - [x] match()
        - [x] match_phrase()
        - [x] multi_match() 
        - [x] common_terms() 
        - [x] query_string() 
        - [x] simple_query_string()
        - [x] term()
        - [x] terms()
        - [x] range()
        - [x] exists()
        - [x] prefix()
        - [x] wildcard()
        - [x] regexp()
        - [x] fuzzy()
        - [x] type()
        - [x] ids()
      - [x] Add Filter
        - [x] Add Default Param Override
      - [x] Add Highlighting
        - [x] Add Default Param Override
        - [x] Add fields
      - [x] Compound Query
        - [x] Add Bool (must, filter, should, must_not)
      - [x] Add sorts
      - [x] Add size
      - [x] Add from
      - [x] Allow params from route
      - [x] Add prototype for detecting page (pagination API)
      - [ ] Add full documentation (yui comments)
      - [x] Make it work
      - [x] Better Readme Examples
  - [ ] Make all the tests
    - [ ] The adapter
    - [ ] The serializer
    - [ ] The QueryDSL

#### The gameplan [0.1.5]
  - [ ] Add functionality to the Adapter
    - [ ] shouldReloadRecord (If needed)
    - [ ] shouldReloadAll (If needed)
  - [ ] Add functionality to the Serializer
    - [ ] normalizeArrayResponse
    - [ ] normalizeFindManyResponse
    - [ ] cleanup serialize
  - [ ] Instant Search Component
  - [ ] Blueprints
    - [ ] Adapter
    - [ ] Serializer
  - [ ] QueryDSL
    - [ ] Add ES versioning
  - [ ] Make all the tests
    - [ ] The extend utility
  - [ ] Definitely more...

#### How to use this

  * Elasticsearch
    
  ```javascript
  // datatypes are pluralized
  // and the content is accessed 
  blog //index
  |- posts 
   |- post-id
  |- pages
   |- page-id
  ```

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
  import Es from 'ember-es-adapter/serializers/serializer';
  export default Es.extend({
  });
  ```
  * In your app 

  ```javascript
  `your_app/routes/index.js`
  import { QueryDSL } from 'ember-es-adapter/utils/es-tools';

  //let the adapter build the query
  export default Ember.Route.extend({
    model(params) {
      //params['size'] = 2,
      //params['page'] = 2,
      return this.store.query('post', params);
    }
  });

  //OR build it yourself and send it on.
  export default Ember.Route.extend({
    model(params) {
      //simulated params
      //if building yourself, these won't be utilized
      params['size'] = 10;
      params['query'] = 'yolo';


     /*  
       QueryDSL is chainable.
       .query({override}) will add a query, but if .bool() is used,
       it will replace the query with a bool type.
       the chaining works as long as a compound query is issued before it.
       (bool, highlight, filter, etc...)

     */

      let dsl = new QueryDSL(params);
      dsl.query({match_all:{}})
        .sort({'date':'desc'})
        .sort('title')

      or 

      dsl.query()
        .bool('must')
        .match('title': 'jerry'})
        .sort({'date':'desc'}) // sorts are agnostic to chains
        .sort('title')         // they are applied to the top level


      //building the query, sending to adapter
      params['esQuery'] = dsl.getQuery();
      return this.store.query('post', params);
    }
  });
  ```

#### ElasticSearch QueryDSL Builder
  * Useage example
    ```javascript
    import QueryDSL from "ember-es-adapter/utils/es-tools";
    let dsl = new QueryDSL({size: 2, from: 200});
    //  dsl = new QueryDSL(); // or no options

    dsl.query({'match': {"title": "Third"}}); //complex queries with no parsing
    dsl.query().match({'title':'Third'});   //same as above, just with chaining

    dsl.sort({'title':'asc'}); //add sort: can be complex
    dsl.title("title");        //add sort: or simple

    let query = es.getQuery();
    ```

  * Using the Query Builder
    ```javascript
    import QueryDSL from 'ember-es-adapter/utils/es-tools';

    let es = new QueryDSL().query({match_all:{}});
    ```
  * Building a Query
    ```javascript
    //Params
    .query({query})           // obj optional override the way you want it sent to ES.
    {
      query: {},            // object  
    } 

    import QueryDSL from 'ember-es-adapter/utils/es-tools';

    let dsl = new QueryDSL();

    //equivalent queries, latter allows for more complex queries
    dsl.query()
      .match({'title':'Third'});

    dsl.query({match:{'title':'Third'}});

    
    //example of using multiple bools within the same query.
    let dsl = new QueryDSL();
    dsl.query()
      .bool('must')
      .term({'user': 'steve'})
      .bool('filter')
      .range({'age': {"gte": 14, "lte": 35}})
    ```

  * Add a filter
    ```javascript
    //Params
    .filter({obj})           // obj optional override the way you want it sent to ES.
    {
      obj: {},              // object  
    } 

    import QueryDSL from 'ember-es-adapter/utils/es-tools';

    let dsl = new QueryDSL();

    dsl.filter()
      .bool('must')
      .match({'title':'Third'});

    ```

  * Adding a Sort
    ```javascript
    //Adds sort option. This can be ran multiple times if more specific sorts
    // are needed. 
    {
      sort: "title" || {},    // string || object  
    } 

    import QueryDSL from 'ember-es-adapter/utils/es-tools';

    let dsl = new esQuery();

    dsl.sort('title');
    dsl.sort({ "name": "asc" });
    dsl.sort({ "post_date": { "order": "asc"} });
    ```

