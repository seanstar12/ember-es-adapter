import extend from 'ember-es-adapter/utils/extend';

const defaultQuerySize = 20;
/**
* Builds queries for ElasticSearch.
* Usage: 
*   ```javascript
*   let es, myQuery;
*   es = new esQuery();
*   es.addBoolMatchField('title', 'ECO');
*   myQuery = es.getQuery();
*   ```
*
* @class esQueryBuilder
* @constructor
*/
let esQueryBuilder = function(opts) {
  opts = opts ? opts : {};

  this.opts = JSON.parse(JSON.stringify(opts)); //clone input options
  this.sort = [];
  this.options = this._options(opts);
  this.query = this._templateBoolQuery();
  this._defaultSortSet = false;
};

/**
* Private: 
* Sets the options variable for the class.
*
* @method _options
* @private
* @param {Object} options Overrides for the class.
* @return {Object} default = { 'sortType': 'desc', 'sort': '_score' };
*/
esQueryBuilder.prototype._options = function(options) {
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
};

/**
* Private:  
* Convert page to offset for use with pagination

* @method _getOffsetFromPage
* @private
* @param {Integer} page Page that request is on.
* @param {Integer} size Size of pages (optional).
* @return {Integer} Returns offset.
*/
esQueryBuilder.prototype._getOffsetFromPage = function(page, size) {
  size = size ? size : defaultQuerySize;

  return page * size;
};

/**
* Public: 
* Returns options from the class.
*
* @method getOptions
* @return {Object} { 'sortType': 'desc', 'sort': '_score' }
*/
esQueryBuilder.prototype.getOptions = function() {
  return this.options;
};

/**
* Public: 
* Gets the query in it's current state.
*
* @method getQuery
* @return {Object} Object state of query. 
*/
esQueryBuilder.prototype.getQuery = function() {
  return this.query;
};

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
esQueryBuilder.prototype._templateBoolQuery = function() {
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
};

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
*   es.getQuery(); 
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
esQueryBuilder.prototype.addSort = function(sort) {
  this.sort.push(sort);
};

/**
* Adds a sort param.
*
* @method _addDefaultSort
* @private
*/
esQueryBuilder.prototype._addDefaultSort = function() {
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
};

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
esQueryBuilder.prototype.addBool = function(obj, type) {
  type = type ? type : 'must';
  
  this._addBool(obj, type);
};

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
esQueryBuilder.prototype._addBool = function(obj, type) {
  if (this.query.query.bool[type]) {
    if (typeof obj === 'object') {
      this.query.query.bool[type].push(obj);
    }
  }
};

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
esQueryBuilder.prototype.addBoolMatchField = function(fieldName, value) {
  let bool = {
    "match": {}
  };

  bool.match[fieldName] = value;

  this._addBool(bool, 'must');
};

esQueryBuilder.prototype.buildQuery = function() {
  if (!this._defaultSortSet) {
    this._addDefaultSort();
  }

  let sort = this.sort;
  let query = this.query;
  let { from, size } = this.options;

  return { query, sort, from, size };
};

export default esQueryBuilder;
