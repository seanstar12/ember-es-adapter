# Ember-ES-Adapter
[![Build Status](https://travis-ci.org/seanstar12/ember-es-adapter.svg?branch=master)](https://travis-ci.org/seanstar12/ember-es-adapter)
[![npm version](https://badge.fury.io/js/ember-es-adapter.svg)](https://badge.fury.io/js/ember-es-adapter)
[![Ember Observer Score](http://emberobserver.com/badges/ember-es-adapter.svg)](http://emberobserver.com/addons/ember-es-adapter)
[![Code Climate](https://codeclimate.com/github/seanstar12/ember-es-adapter/badges/gpa.svg)](https://codeclimate.com/github/seanstar12/ember-es-adapter)

An adapter written for Elasticsearch and EmberJS.

#### Demo
[S3 Blog](http://ember-s3-blog-prod.s3-website-us-east-1.amazonaws.com/), this shows just the basics. I'm still working on
getting the ember repo into a stable (credential-free) state.

#### TODO
 - [ ] Add all functionality to the Adapter
 - [ ] Blueprints
 - [ ] Finish up the AWS request signer
 - [ ] Figure out how to test the thing
 - [ ] Definitely more...

#### What's the point of this?
I'm building a 'static' blog written in Ember with an Elasticsearch backend.
This is one of the key aspects to the project.

#### ElasticSearch Query Builder
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

#### A Rough Example of the adapter
`your_app/adapters/post.js`

```
import Ember from "ember";
import ES from 'ember-es-adapter/adapters/elasticsearch';
import fetch from "ember-network/fetch";
import config from 'ember-get-config';

export default ES.extend({
  host: config.DS.host,
  namespace: config.DS.namespace,

  //pathForType: function(type) {
  //   return type;
  //},

  query: function(store, type, params) {
    var url = [this.buildURL(type.modelName), '_search'].join('/');
    var page = 0,
        size = 10,
        payload;

    console.log('[adapter][lesson]:[query]: ' + JSON.stringify(params));

    if (params.page) {
      page = params.page - 1;
    }
    if (params.per_page) {
      size = params.per_page;
    }

    // Default Payload
    payload = { 
      sort: [ { "_score": "desc" } ], 
      from: page * size,
      size: size,
      query: {"match_all":{}}
    };

    if (params.sort) {
      var [ field, sort ] = params.sort.split('-');

      payload.sort = [];
      payload.sort.push({});
      payload.sort[0][field] = {
        missing: "_last", 
        order : sort
      };
    }
    //console.log(params);

    if (params.query) {
      payload.query = { "query_string": { "query": params.query } };
    }
    if (params.aggs) {
      payload.aggs = params.aggs;
    }
    if (params.filter) {
      payload.filter = params.filter;
    }

    if (Ember.isPresent(params.alt_query)) {
      payload = params.alt_query;
      //console.log('[adapter][lesson]:[query][alt_query]: ');
      //console.log(payload);
    }
      //console.log('[adapter][lesson]:[query][alt_query]: ');
      //console.log(payload);

    return fetch(url, {
      method: "POST",
      body: JSON.stringify(payload)
    })
    .then(function(resp) {
      return resp.json();
    });
  },

  findAll: function(store, type) {
    var url = [this.buildURL(type.modelName), '_search'].join('/');

    var payload = JSON.stringify({
      "query": { "match_all": {} },
      "sort": { "date" : { "order" : "desc" } },
      "from": 0,
      "size": 10 // @TODO: max limit of ES. should be refactored
    });

    return fetch(url, {
      method: "post",
      body: payload
    })
    .then(function(response) {
      var resp = response.json();
      return resp;
    });
  }
});
```
