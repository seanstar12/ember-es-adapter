import DS from 'ember-data';
import {QueryDSL} from 'ember-es-adapter/utils/es-tools';
import Ember from 'ember';
import fetch from 'fetch';

export default DS.JSONAPIAdapter.extend({
  urlForCreateRecord(modelName, snapshot) {
    //Ember.Logger.info('[ES-Adapter][urlForCreateRecord]');
    return [this.buildURL(modelName), snapshot.id].join('/');
  },

  //used for GET requests from elasticsearch
  urlForQuery(query, modelName) {
    // http://stackoverflow.com/a/34209399/707580
    const esc = encodeURIComponent;
    const get = Object.keys(query)
          .map(k => esc(k) + '=' + esc(query[k]))
          .join('&');

    const model = this._super.apply(this, arguments);
    const url = [model, '_search'].join('/');

    return [url, get].join('?');
  },

  query(store, type, params) {
    let options = {};
    let query;

    if (params.method === 'get') {
      query = {
        size: params.size,
        from: params.from,
        sort: params.sort,
        q: this.buildGetQuery(params.query)
      };

      if (params.hasOwnProperty('_source_include')) {
        query._source_include = params._source_include;
      }
    }
    else if (params.method === 'post') {
      let es = new QueryDSL(params.post);
      let dsl = es.getQuery();

      options = {
        method: 'post',
        body: JSON.stringify(dsl),
        headers: this.headersForRequest()
      }
    }

    let url = this.buildURL(type.modelName, null, null, 'query', query);

    //Ember.Logger.debug('[ES-Adapter][query]',{url, params});

    return fetch(url, options).then((resp) => this.handleResponse(resp.status, resp.headers, resp.json(), { url: resp.url} ));
  },

  buildGetQuery(query) {
    if (query.hasOwnProperty('items') // we are stil nesting
        && Ember.isArray(query.items)) {
      const result = query.items.map(this.buildGetQuery.bind(this));
      return '('
           + result.join(' ' + query.type + ' ')
           + ')';
    }

    // build out the individual item
    const esc = encodeURIComponent;
    return Object.keys(query).map(k => esc(k) + ':' + esc(query[k]));
  },

  findAll(store, type) {
    //Ember.Logger.info('[ES-Adapter][findAll]');
    const url = [this.buildURL(type.modelName), '_search'].join('/');

    let es = new QueryDSL({ 'size': 10000 });

    return fetch(url, {
      method: "post",
      body: JSON.stringify(es.getQuery()),
      headers: this.headersForRequest()
    })
    .then((resp) => {
      return this.handleResponse(resp.status, resp.headers, resp.json(), { url: resp.url} );
    });
  },

  createRecord(nodelName, type, snapshot) {
    //Ember.Logger.info('[ES-Adapter][createRecord]');
    let data = {},
        serializer = this.store.serializerFor(type.modelName);

    serializer.serializeIntoHash(data, type, snapshot, { includeId: true });

    let id = snapshot.id,
        url = this.buildURL(type.modelName, id, snapshot, 'createRecord');

    url = [url, '_create'].join('/');

    return fetch(url, {
      method: "post",
      body: JSON.stringify(data),
      headers: this.headersForRequest()
    })
    .then((resp) => {
      return this.handleResponse(resp.status, resp.headers, resp.json(), { url: resp.url} );
    });
  },

  updateRecord(nodelName, type, snapshot) {
    //Ember.Logger.info('[ES-Adapter][updateRecord]');
    let data = {},
        serializer = this.store.serializerFor(type.modelName);

    serializer.serializeIntoHash(data, type, snapshot, { includeId: true });

    let id = snapshot.id,
        url = this.buildURL(type.modelName, id, snapshot, 'updateRecord');

    return fetch(url, {
      method: "post",
      body: JSON.stringify(data),
      headers: this.headersForRequest()
    })
    .then((resp) => {
      //console.log(resp);
      return resp.json()
        .then((_resp) => {
          //console.log('updateRecord');
          //console.log(_resp);
          if (_resp.error) {
            //console.log('updateRecord Error');
            //console.log(_resp);
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

  //normalizeErrorResponse: function(status, headers, payload) {
  //  Ember.Logger.debug('[ES-Adapter][normalizeErrorResponse]', {status, headers, payload});
  //  if (payload && typeof payload === 'object' && payload.errors) {
  //    return payload.errors;
  //  } else {
  //    return [
  //      {
  //        status: `${status}`,
  //        title: "The backend responded with an error",
  //        detail: `${payload}`
  //      }
  //    ];
  //  }
  //},

  handleResponse: function(status, headers, payload){
    //Ember.Logger.debug('[ES-Adapter][handleResponse]');

    if (typeof payload === 'undefined') payload = {};

    if (String(status).charAt(0) === '4' || String(status).charAt(0) === '5') {
      payload['errors'] = [];

      payload.errors.push({
        status: `${status}`,
        title: "Not Found",
        detail: "Document " + payload._id + " was not found"
      });
      return DS.AdapterError(payload.errors, "Document " + payload._id + " was not found");
    }

    return this._super(status, headers, payload);
  }

});
