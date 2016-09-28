import JSONAPIAdapter from 'ember-data/adapters/json-api';
import Ember from 'ember';
import config from 'ember-get-config';

const {environment} = config;

export default JSONAPIAdapter.extend({
  config: environment,

  query: function(store, type, params) {
    var url = [this.buildURL(type.modelName), '_search'].join('/');
    var page = 0,
        size = 10,
        payload;

    console.log('[adapter][lesson]:[query]: ' + JSON.stringify(params));
    console.log(this.get('config'));

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

});
