import DS from 'ember-data';

/**
 * Handle ElasticSearch (de)serialization.
 *
 * This serializer adjusts payload data so that it is consumable by
 * ElasticSearch.
 *
 * @class EsSerializer
 * @extends DS.JSONAPISerializer
 */
export default DS.JSONAPISerializer.extend({
  // Don't need to convert primaryKey because we're doing that with
  // normalize[X]Response
  //primaryKey: '_id',

  serialize(snapshot, options) {
    console.log('[es-adapter][serializer]:[serialize]');
    var json = this._super(...arguments);
    return json;
  },

  /**
   * Converts ElasticSearch server responses into the format expected by the JSONAPISerializer.
   *
   * @method normalizeResponse
   * @param {DS.Store} store
   * @param {DS.Model} primaryModelClass
   * @param {Object} payload
   * @param {String|Number} id
   * @param {String} requestType
   * @return {Object} JSON-API Document
   */
  normalizeResponse: function(store, primaryModelClass, payload, id, requestType) {
    console.log('[es-adapter][serializer]:[normalizeResponse]');
    //console.log(payload);

    return this._super(store, primaryModelClass, payload, id, requestType);
  },

  normalizeFindAllResponse: function(store, primaryModelClass, payload, id, requestType) {
    console.log('[es-adapter][serializer]:[normalizeFindAllResponse]');
    let hits = payload.hits;

    payload = {
      data: hits.hits.map(function(hit) {
        return {
          id: hit._id,
          type: hit._type,
          attributes: hit._source
        };
      }),
      meta: {
        shards: payload._shards,
        timed_out: payload.timed_out,
        took: payload.took,
        total: hits.total
      }
    };
	  
    return this._super(store, primaryModelClass, payload, id, requestType);
  },

  normalizeQueryResponse: function(store, primaryModelClass, payload, id, requestType) {
    console.log('[es-adapter][serializer]:[normalizeQueryResponse]');
    let hits = payload.hits;

    payload = {
      data: hits.hits.map(function(hit) {
        return {
          id: hit._id,
          type: hit._type,
          attributes: hit._source
        };
      }),
      meta: {
        shards: payload._shards,
        timed_out: payload.timed_out,
        took: payload.took,
        total: hits.total
      }
    };

    return this._super(store, primaryModelClass, payload, id, requestType);
  },

  normalizeSingleResponse: function(store, primaryModelClass, payload, id, requestType) {
    console.log('[es-adapter][serializer]:[normalizeSingleResponse]');

    payload = {
      data: {
        id: payload._id,
        type: payload._type,
        attributes: payload._source
      },
      meta: {
        index: payload._index,
        found: payload.found,
        version: payload._version
      }
    };

    return this._super(store, primaryModelClass, payload, id, requestType);
  }
});
