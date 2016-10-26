import config from 'ember-get-config';
import Ember from 'ember';
import extend from 'ember-es-adapter/utils/extend';

const defaultQuerySize = 20;

/**
* ElasticSearch Tools for interfacing
*
* @class EsTools
* @constructor
*/
class EsTools {

  constructor () {
    this.host = config.EsAdapter.host;
    this.namespace = config.EsAdapter.namespace;
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

  /**
  * Private: 
  * Sets the options variable for the class.
  *
  * @method _options
  * @private
  * @param {Object} options Overrides for the class.
  * @return {Object} default = { 'sortType': 'desc', 'sort': '_score' };
  */
  _options(options) {
    options = options ? options : {};
    options.esParams = options.esParams ? options.esParams: {};

    let defaults = {
      'from': 0,
      'size': defaultQuerySize
    };

    options = extend(defaults, options, options.esParams);

    if (options.page) {
      options.from = this._getOffsetFromPage(options.page, options.size);
    }

    return options;
  }

  query() {
    this._query = { query: {} };
    this._queue = [];
    return this;
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

  bool(kind) {
    let params = {};
    params[kind] = [];

    return this._add('bool', params);
  }

  getThis() {
    return this;
  }

  _add(type, options, fn) {
    if (options == null) {
      options = {};
    }

    let params = {};
    params[type] = options;

    this._query.query[type] = options;
    return this;
  }

  _addParent(type, kind) {
    let params = {};
    params[type] = {};
    params[type][kind] = {};

    return this._query[type] = params;
  }

  /**
  * Private:  
  * Convert page to offset for use with pagination
  
  * @method _getOffsetFromPage
  * @private
  * @param {Integer} page Page that request is on.
  * @param {Integer} size Size of pages (optional).
  * @return {Integer} Returns offset.
  */
  _getOffsetFromPage(page, size) {
    size = size ? size : defaultQuerySize;
  
    return page * size;
  }
  
  /**
  * Public: 
  * Returns options from the class.
  *
  * @method getOptions
  * @return {Object} { 'sortType': 'desc', 'sort': '_score' }
  */
  getOptions() {
    return this.options;
  }
  
  /**
  * Private: 
  * Generates the template for a "Bool" query.
  *   ```json
  *   {
  *     "query": {
  *       "bool": {
  *         "must": [],  
  *         "filter": [],  
  *         "must_not": [],  
  *         "should": [],  
  *       }
  *     }
  *   }
  *   ```
  *
  * @method _templateBoolQuery
  * @private
  * @return {Object} Returns the default structure for the query.
  */
  _templateBoolQuery() {
    return {
       "query": {
         "bool": {
           "must": [],  
           "filter": [],  
           "must_not": [],  
           "should": []
         }
       }
    };
  }
  
  /**
  * Adds a sort param. Takes a string or object. These are stackable
  * so multiple sorts can be applied.
  * 
  *   ```json
  *   Example use:
  *   let es, myQuery;
  *   es = new esQuery();
  *   es.addSort('title');
  *   es.addSort({'date' : { 'order': 'asc'}});
  *   ```
  *
  *   ```json
  *   Example Sorts
  *   `simple sort`
  *   "user"
  *
  *   `less simple sort`
  *   { "name": "asc" }
  *
  *   `complexish simple sort`
  *   { "post_date": { "order": "asc"} }
  *
  * @method addSort
  * @param {Object} sort Sort object/string to be added.
  */
  addSort(sort) {
    this.sort.push(sort);
  }
  
  /**
  * Adds a sort param.
  *
  * @method _addDefaultSort
  * @private
  */
  _addDefaultSort() {
    let options = this.options;
    let sort;
  
    if (options.sort) {
      if (options.sortType) {
        let defaultSort = {};

        defaultSort[options.sort] = options.sortType;
        sort = defaultSort;
      }
      else {
        sort = options.sort;
      }
  
      this._defaultSortSet = true;
      this.addSort(sort);
    }
  }
  
  /**
  * Public: 
  * Adds a query to Bool. Allows for complex queries.
  *
  *   ```json
  *   Example objects:
  * 
  *   `complex match`
  *   {
  *     "match": {
  *       "message": {
  *         "query": "to be or not to be",
  *         "operator": "and",
  *         "zero_terms_query": "all"
  *       }
  *     }
  *   }
  * 
  *   `simple match`
  *   {
  *     "match": {
  *       "message": "this is a test"
  *     }
  *   }
  * 
  *   `other queries`
  *   {
  *     "term": {
  *       "tag": "tech"
  *     }
  *   }
  *   ```
  *
  * @method addBool
  * @param {Object} query Query parameters
  * @param {String} type Type of Bool query should be applied to. 
  *                 [must,filter,must_not,should]. Defaults to 'must'.
  */
  addBool(obj, type) {
    type = type ? type : 'must';
    
    this._addBool(obj, type);
  }
  
  /**
  * Private: 
  * Adds a query to Bool. Secrely.
  *
  * @method _addBool
  * @private
  * @param {Object} query Query parameters
  * @param {String} type Type of Bool query should be applied to. 
  *                 [must,filter,must_not,should]. Defaults to 'must'.
  */
  _addBool(obj, type) {
    let query = this.query.query;

    if (query.bool[type]) {
      if (typeof obj === 'object') {
        query.bool[type].push(obj);
      }
    }
  }
  
  /**
  * Public: 
  * Adds a query to Bool with the type 'match'.
  *   ```json
  *   {
  *     "match": {
  *       "{field}": "{value}"
  *     }
  *   }
  *   ```
  *
  * @method addBoolMatchField
  * @param {String} field Field name to run query against.
  * @param {String} value Value of field.
  */
  addBoolMatchField(fieldName, value) {
    let bool = {
      "match": {}
    };
  
    bool.match[fieldName] = value;
  
    this._addBool(bool, 'must');
  }
  
  /**
  * Public: 
  * Builds the return query.
  *
  * @method buildQuery
  * @return {Object} Returns full query object.
  */
  buildQuery() {
    if (!this._defaultSortSet) {
      this._addDefaultSort();
    }
  
    let sort = this.sort;
    let query = this.query;
    let { from, size } = this.options;
  
    return { query, sort, from, size };
  }

}

export {
  EsTools,
  QueryDSL
};
