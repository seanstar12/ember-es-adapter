import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
  normalizeFindAllResponse: function(store, primaryModelClass, payload, id, requestType) {
    //console.log('[serializer][lesson]:[normalizeFindAllResponse]');
    let hits = payload.hits;
	  
    payload = {
      data: hits.hits.map(function(hit) {
        return {
	  type: hit._type,      
          id: hit._id,      
          attributes: hit._source,      
        };
      }),
      meta: {
        total: hits.total,
        sort: hits.sort
      }
    };

    return this._super(store, primaryModelClass, payload, id, requestType);
  },

  normalizeQueryResponse: function(store, primaryModelClass, payload, id, requestType) {
    //console.log('[serializer][lesson]:[normalizeQueryResponse]');
    let hits = payload.hits;

    payload = {
      data: hits.hits.map(function(hit) {
        return {
	  type: hit._type,      
          id: hit._id,      
          attributes: hit._source,      
        };
      }),
      meta: {
        total: hits.total,
      }
    };

    return this._super(store, primaryModelClass, payload, id, requestType);
  },

  normalizeSingleResponse: function(store, primaryModelClass, payload, id, requestType) {
    //console.log('[serializer][lesson]:[normalizeSingleResponse]');

    payload = {
      data: {
        id: payload._id,
        type: payload._type,
        attributes: payload._source
      },
      meta: {
        index: payload._index,
        exists: payload.exists,
        version: payload._version,
      }
    };

    return this._super(store, primaryModelClass, payload, id, requestType);
  }
});
