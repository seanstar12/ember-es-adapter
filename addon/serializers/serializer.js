import DS from 'ember-data';
import Ember from 'ember';
/**
 * Handle ElasticSearch (de)serialization.
 *
 * This serializer adjusts payload data so that it is consumable by
 *
 * @class EsSerializer
 * @extends DS.JSONAPISerializer
 */
export default DS.JSONAPISerializer.extend({
  // Don't need to convert primaryKey because we're doing that with
  // normalize[X]Response
  //primaryKey: '_id',
  isNewSerializerAPI: true,
  attrs: {
    masterImage: { embedded: 'always'}
  },

  serialize: function(snapshot, options) {
    //Ember.Logger.log('%c [es-adapter][serializer]:[serialize]', "color:white; background:brown", {snapshot, options});
    let json = this._super(...arguments),
        item = json.data,
        data = {},
        attrs = Object.getOwnPropertyNames(item.attributes);

    attrs.forEach((attr) => {
      data[attr] = item.attributes[attr];
    });

    return data;
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
    //Ember.Logger.log('%c [es-adapter][serializer]:[normalizeResponse]', 'color:white; background:green', {payload});
    payload = {data: payload};

    return this._super(store, primaryModelClass, payload, id, requestType);
    //return payload;
  },

  normalizeFindAllResponse: function(store, primaryModelClass, payload, id, requestType) {
    //console.log('[es-adapter][serializer]:[normalizeFindAllResponse]');
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
/*        shards: payload._shards,
        timed_out: payload.timed_out,
        took: payload.took,*/
        total: hits.total,
      }
    };

    return this._super(store, primaryModelClass, payload, id, requestType);
  },

  normalizeQueryResponse: function(store, primaryModelClass, payload, id, requestType) {
    let hits = payload.data.hits;

    //payload = this.extractStuff(store, primaryModelClass, payload.data.hits.hits);
    payload = {
      data: payload.data.hits.hits,
      meta: {
        /*shards: payload._shards,
        timed_out: payload.timed_out,
        took: payload.took,*/
        total: hits.total,
      }
    };

    payload = this._super(store, primaryModelClass, payload, id, requestType);

    //Ember.Logger.log('%c [es-adapter][serializer]:[normalizeQueryResponse]', 'color:white; background: #ff00c2', payload);

    // Extract relationships

    return payload;
  },

  normalizeSingleResponse: function(store, primaryModelClass, payload, id, requestType) {
    const serializer = store.serializerFor(primaryModelClass.modelName);
    const primaryKey = serializer.get('primaryKey');

    payload = {
      data: {
        attributes: payload.data._source,
        type: primaryModelClass.modelName,
      },
    };

    payload.data[primaryKey] = id;

    //payload = this.extractStuff(store, primaryModelClass, [payload.data._source]);

    //Ember.Logger.log('%c [es-adapter][serializer]:[normalizeSingleResponse]', 'color:white; background:#33A5FF', {payload});
    //return payload;
    payload = this._super(store, primaryModelClass, payload, id, requestType);
    payload = this.extractIncluded(store, payload);
    return payload;
  },

  extractIncluded: function(store, payload) {
    let included = [];

    if (Ember.typeOf(payload.data) === 'object') {
      if (!payload.data.relationships) return payload;

      included = [payload.data].reduce(this._extractIncluded.bind(this), included);
    }
    else if (Ember.typeOf(payload.data) === 'array') {
      included = payload.data.reduce(this._extractIncluded.bind(this), included);

    }


    payload.included = included.map((item) => {
      const serializer = store.serializerFor(item.type);
      const primaryKey = serializer.get('primaryKey');
      const newItem = {
        attributes: item,
        type: item.type,
      };
      newItem[primaryKey] = item[primaryKey];

      const normalized = store.normalize(item.type, item);
      normalized.data[primaryKey] = item[primaryKey]; // Force primaryKey
      return normalized.data;
    });

    return payload;
  },

  _extractIncluded: function(previousValue, dataItem) {
    const keys = this._getObjectKeys(dataItem.relationships);
    const { included } = keys.reduce(
                           this._extractIncludedReduce.bind(this),
                           {
                             relationships: dataItem.relationships,
                             included: []
                           }
                         );

    return previousValue.concat(included);
  },

  _extractIncludedReduce: function(previousValue, key) {
    const model = previousValue.relationships[key];
    let objs;

    if (Ember.typeOf(model.data) === 'object') objs = [model.data];
    if (Ember.typeOf(model.data) === 'array') objs = model.data;

    previousValue.included = previousValue.included.concat(objs.filter(this._shouldIncludeFilter.bind(this)));
    return previousValue;
  },

  _shouldIncludeFilter: function(item) {
    const numKeys = this._getObjectKeys(item).length;

    return (numKeys > 2); // Do more keys than id and type exist?
  },

  // @TODO does ember do this already?
  _getObjectKeys: function(object) {
    let objKeys = []
    for (let key in object) {
      if (object.hasOwnProperty(key)){
        objKeys.push(key);
      }
    }
    return objKeys;
  },

  normalizeCreateRecordResponse(store, primaryModelClass, payload, id, requestType) {
    //console.log('[es-adapter][serializer]:[normalizeSingleCreateRecordResponse]');
    return this.normalizeSaveResponse(...arguments);
  },

  normalizeArrayResponse(store, primaryModelClass, payload, id, requestType) {
    //console.log('[es-adapter][serializer]:[normalizeArrayResponse]');

    //Ember.Logger.log({primaryModelClass, payload, id, requestType});
    payload.data = payload.data.map((item) => {
      const serializer = store.serializerFor(item._source.type);
      const primaryKey = serializer.get('primaryKey');

      const newItem = {
        attributes: item._source,
        type: item._source.type
      }
      newItem[primaryKey] = item._source[primaryKey];
      return newItem;
    });

    let normalizedDocument = this._super(...arguments);

    normalizedDocument = this.extractIncluded(store, normalizedDocument);

    return normalizedDocument;
  },

  extractRelationships: function(modelClass, resourceHash) {
    let relationships = {};

    if (!resourceHash.attributes) return relationships;

    modelClass.eachRelationship((key, relationshipMeta) => {
      let relationshipKey = this.keyForRelationship(key, relationshipMeta.kind, 'deserialize');
      if (resourceHash.attributes.hasOwnProperty(relationshipKey)) {

        let relationshipHash = {data: resourceHash.attributes[relationshipKey]};
        if(Ember.typeOf(relationshipHash.data) === 'object') {
          relationshipHash.data.type = relationshipMeta.type;
        }
        else if(Ember.typeOf(relationshipHash.data) === 'array') {
          relationshipHash.data = relationshipHash.data.map((val) => {
            if (typeof val === "object") {
              val.type = relationshipMeta.type;
              if (relationshipMeta.type === "image") {
                val.id = val.fid;
              }
              return val;
            }

            // String or number
            return {id: val, type: relationshipMeta.type};
          });
        }
        else { // String or number
          relationshipHash.data = {id: relationshipHash.data, type: relationshipMeta.type};
        }

        relationships[key] = relationshipHash;
      }
    });

    return relationships;
  },
});
