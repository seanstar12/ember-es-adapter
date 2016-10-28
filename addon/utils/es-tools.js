import Ember from 'ember';
import config from 'ember-get-config';

const defaultQuerySize = 20;


/**
* ElasticSearch Tools for interfacing
*
* @class EsTools
* @constructor
*/
class EsTools {

  constructor () {
    this.host = config.APP.EsAdapter.host;
    this.namespace = config.APP.EsAdapter.namespace;
  }

  /**
  * Gets the mapping from ElasticSearch in form of array.
  *
  * @method getMapping
  * @private
  * @return {Object} Object containing arrays of mappings. 
  * e.g. {'post':[{mapping:'body', type:'string'}]}
  */
  getMapping() {
    if (!this.host || !this.namespace) {
      console.log('[EsMapper][getMapping]: Host or Namespace not defined.');
      return false;
    }

    let host = this.host,
        namespace = this.namespace;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      fetch(host + '/'+ namespace + '/_mappings')
        .then((resp) => {
          let r = resp.json(),
              types = {};

          r.then((result) => {
              for (var i in result) {
                if (result[i]['mappings']) {
                  let _types = result[i]['mappings'];

                  for (var j in _types) {
                    if (_types[j]) {
                      let _properties = _types[j]['properties'];
                      let _propKeys = Object.keys(_properties);

                      types[j] = [];

                      for (var k=0; k < _propKeys.length; k++) {
                        types[j].push({
                          'mapping': _propKeys[k],
                          'type': _properties[_propKeys[k]].type
                        }); 
                      }

                      resolve(types);
                    }
                    else {
                      reject('[EsMapper][getMapping]: No Types Found.');
                    }
                  }
                }
                else {
                  reject('[EsMapper][getMapping]: No Mappings Found.');
                }
              }
            });

          });

    });
  }

  getTrue() {
    return true;
  }

  getLastId(index,field) {
    let host = this.host,
        namespace = this.namespace,
        queryString = "_search?query=match_all&size=1&fields=" + field + "&sort=" + field + ":desc",
        url = [host, namespace, index, queryString].join('/');

    return new Ember.RSVP.Promise(function(resolve, reject) {
      fetch(url)
        .then((resp) => {
          resp.json()
            .then((json) => {
              if (json && json.hits.hits.length) {
                resolve(parseInt(json.hits.hits[0]._id));
              }
              else {
                reject('[EsMapper][getLastId]: No Response.');
              }
            });
        });
    });
  }

}

/**
* ElasticSearch Tools for interfacing
*
* @class EsTools
* @constructor
*/
class QueryDSL {

  constructor (opts) {
    this.opts = JSON.parse(JSON.stringify(opts)) || null;
    this._query = {};
  }

  query(options) {
    if (options == null) {
      options = {};
    }

    this._query = { query: options };
    this._compound = 'query';

    return this;
  }

  sort(options) {
    if (this._query.sort) {
      this._query['sort'].push(options);
    }
    else {
      if (!Array.isArray(options)) {
        options = [options];
      }

      this._query['sort'] = options;
    }

    return this;
  }

  filter(options) {
    if (options == null) {
      options = {};
    }

    this._query['filter'] = options;
    this._compound = 'filter';

    return this;
  }

  highlight(options) {
    if (options == null) {
      options = {};
    }

    this._query['highlight'] = options;
    this._parent = ['highlight'];

    return this;
  }

  // only for highlight
  fields(options) {
    return this._addObj('fields', options);
  }

  match(options) {
    return this._add('match', options);
  }

  match_phrase(options) {
    return this._add('match_phrase', options);
  }

  multi_match(options) {
    return this._add('multi_match', options);
  }

  common_terms(options) {
    return this._add('common', options);
  }

  query_string(options) {
    return this._add('query_string', options);
  }

  simple_query_string(options) {
    return this._add('simple_query_string', options);
  }

  term(options) {
    return this._add('term', options);
  }

  terms(options) {
    return this._add('terms', options);
  }

  range(options) {
    return this._add('range', options);
  }

  exists(options) {
    return this._add('exists', options);
  }

  prefix(options) {
    return this._add('prefix', options);
  }

  wildcard(options) {
    return this._add('wildcard', options);
  }

  regexp(options) {
    return this._add('regexp', options);
  }

  fuzzy(options) {
    return this._add('fuzzy', options);
  }

  type(options) {
    return this._add('type', options);
  }

  ids(options) {
    return this._add('ids', options);
  }

  bool(kind) {
    return this._addCompound('bool', kind);
  }

  /**
  * Public:  
  * Adds size to query
  
  * @method size
  * @param {Integer} size Size of query
  * @return {Object} Returns this for chaining.
  */
  size(size) {
    return this._addToQuery('size', size);
  }

  /**
  * Public:  
  * Adds from to query
  
  * @method from
  * @param {Integer} from Start of offset for query
  * @return {Object} Returns this for chaining.
  */
  from(from) {
    return this._addToQuery('from', from);
  }

  /**
  * Public:  
  * Gets full query ready to send to elasticsearch
  
  * @method getQuery
  * @return {Object} Returns query object.
  */
  getQuery() {
    if (this.opts) {
      let opts = this.opts,
          keys = Object.getOwnPropertyNames(opts);

      for (let i=0; i < keys.length; i++) {
        if (typeof this[keys[i]] === "function") {
          if (keys[i] === 'query') {
            this._query['query'] = {
              "query_string": {"query": opts[keys[i]]}
            };
          }
          else {
            this[keys[i]](opts[keys[i]]);
          }
        }
      }
    }
    return this._query;
  }

  /**
  * Private:  
  * Gets context for debugging
  
  * @method getThis
  * @private
  * @return {Object} Returns this
  */
  getThis() {
    return this;
  }

  /**
  * Private:  
  * Adds item to query
  
  * @method _addCompound
  * @private
  * @param {String} type Type of item being added to query
  * @param {String} kind Kind of item being added to query.
  * @return {Object} Returns this for chaining.
  */
  _add(type, options) {
    if (options == null) {
      options = {};
    }

    let params = {};
    params[type] = options;

    if (this._parent) {
      // using eval so we can have objects of any length
      eval('this._query.' + this._parent.join('.')).push(params);
    }
    else {
      this._query.query = params;
    }

    return this;
  }

  /**
  * Private:  
  * Adds Object to _parent path. Used only for highlight right now
  
  * @method _addObj
  * @private
  * @param {String} type Type of item being added to query
  * @param {Object} options Overrideable contents for highlight
  * @return {Object} Returns this for chaining.
  */
  _addObj(type, options) {
    if (options == null) {
      options = {};
    }

    // using eval so we can have objects of any length
    eval('this._query.' + this._parent.join('.'))[type] = options;

    return this;
  }

  /**
  * Private:  
  * Adds compound query type to query
  
  * @method _addCompound
  * @private
  * @param {String} type Type of item being added to query
  * @param {String} kind Kind of item being added to query.
  * @param {Array} path Custom path if desired.
  * @return {Object} Returns this for chaining.
  */
  _addCompound(type, kind, path) {
    path = path ? path : [this._compound, type, kind];

    if (!this._query[path[0]]) {
      this._query[path[0]] = {};
    }
    else if (!this._query[path[0]][type]) {
      this._query[path[0]][type] = {};
    }
    this._query[path[0]][type][kind] = [];

    this._parent = path;

    return this;
  }

  
  /**
  * Private:  
  * Adds any passed variable to the root of the returned query
  
  * @method _addToQuery
  * @private
  * @param {String} type Type of item being added to root of query
  * @param {Object||String||Array} options Object being added to query.
  * @return {Object} Returns this for chaining.
  */
  _addToQuery(type, options) {
    if (options == null) {
      options = "";
    }

    this._query[type] = options;

    return this;
  }


  /**
  * Private:  
  * Convert page to offset for use with pagination
  * @TODO: could cause race condition if size ins't
  * set first
  * 
  * @method page
  * @private
  * @param {Integer} page Page that request is on.
  * @param {Integer} size Size of pages (optional).
  * @return {Integer} Returns offset.
  */
  page(page) {
    let size = this._query.size ? this._query.size : defaultQuerySize;
  
    this.from(page * size);
  }
  
}

export {
  EsTools,
  QueryDSL
};
