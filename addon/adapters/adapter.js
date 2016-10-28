import RESTAdapter from 'ember-data/adapters/rest';
import DS from 'ember-data';
import {QueryDSL} from 'ember-es-adapter/utils/es-tools';
import Ember from 'ember';

export default RESTAdapter.extend({

  urlForCreateRecord(modelName, snapshot) {
    return [this.buildURL(modelName), snapshot.id].join('/');
  },

  query(store, type, params) {
    const url = [this.buildURL(type.modelName), '_search'].join('/');

    let query = Ember.get(params, 'esQuery') || null;

    // No EsQuery object was supplied, so we'll make a new one. This
    // allows us to build the query outside of the adapter if needed.
    if (Ember.isEmpty(query)) {
      // Initiate new instance with params if supplied
      // Inject _params into params object 
      let es = new QueryDSL(params);

      query = es.getQuery();
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

    let es = new QueryDSL({ 'size': 10000 });

    return fetch(url, {
      method: "post",
      body: JSON.stringify(es.buildQuery())
    })
    .then(function(resp) {
      return resp.json();
    });
  },

  createRecord(nodelName, type, snapshot) {
    let data = {},
        serializer = this.store.serializerFor(type.modelName);

    serializer.serializeIntoHash(data, type, snapshot, { includeId: true });

    let id = snapshot.id,
        url = this.buildURL(type.modelName, id, snapshot, 'createRecord');
    
    url = [url, '_create'].join('/');

    return fetch(url, {
      method: "post",
      body: JSON.stringify(data)
    })
    .then(function(resp) {
      return resp.json();
    });

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
      console.log(resp);
      return resp.json()
        .then((_resp) => {
          console.log('updateRecord');
          console.log(_resp);
          if (_resp.error) {
            console.log('updateRecord Error');
            console.log(_resp);
            return Ember.RSVP.reject(new DS.InvalidError([
              {
                message: _resp.error.reason,
                cause: _resp.error.caused_by.reason,
                type: _resp.error.type,
                error: _resp.error,
                status: _resp.status
              }
            ]));
          }
          return _resp;
        });
    });

  },

  handleResponse: function(status, headers, payload){
    console.log('handle response');
    console.log({status, headers, payload}); 

    return this._super(...arguments);
  }

});
