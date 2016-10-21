import JSONAPIAdapter from 'ember-data/adapters/json-api';
import EsQuery from 'ember-es-adapter/utils/es-query-builder';
import extend from 'ember-es-adapter/utils/extend';
import Ember from 'ember';
import config from 'ember-get-config';

const {environment} = config;

export default JSONAPIAdapter.extend({
  config: environment,

  urlForCreateRecord(modelName, snapshot) {
    return [this.buildURL(modelName), snapshot.id].join('/');
  },

  query(store, type, params) {
    const url = [this.buildURL(type.modelName), '_search'].join('/');
    let query = Ember.get(params, 'esQuery') || null,
        esParams = Ember.get(params, 'esParams') || null,
        _params = this.filter(params); // Filter out params we don't know how to handle

    // No EsQuery object was supplied, so we'll make a new one. This
    // allows us to build the query outside of the adapter if needed.
    if (Ember.isEmpty(query)) {
      // Initiate new instance with params if supplied
      // Inject _params into params object 
      let es = new EsQuery(extend(esParams, _params));

      // Add in query if supplied in params;
      if (params.query) {
        es.addBool({"query_string": {"query": params.query}});
      }
      query = es.buildQuery();
    }

    return fetch(url, {
      method: "POST",
      body: JSON.stringify(query)
    })
    .then(function(resp) {
      return resp.json();
    });
  },

  findAll(store, type) {
    const url = [this.buildURL(type.modelName), '_search'].join('/');

    let es = new EsQuery({ 'size': 10000 });

    return fetch(url, {
      method: "post",
      body: JSON.stringify(es.buildQuery())
    })
    .then(function(resp) {
      return resp.json();
    });
  },

  filter(obj) {
    let allowed = ['size', 'from', 'query', 'page'];
    
    for (let i in obj) {
      if (allowed.indexOf(i) < 0) {
        delete obj[i];
      }
    }
    return obj;
  },

  updateRecord(nodelName, type, snapshot) {
    let data = {},
        serializer = this.store.serializerFor(type.modelName);

    serializer.serializeIntoHash(data, type, snapshot, { includeId: true });

    let id = snapshot.id,
        url = this.buildURL(type.modelName, id, snapshot, 'updateRecord');

    return fetch(url, {
      method: "post",
      body: JSON.stringify(data)
    })
    .then(function(resp) {
      return resp.json();
    });

  }

});
