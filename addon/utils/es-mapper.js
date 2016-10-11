import config from 'ember-get-config';
import Ember from 'ember';

/**
* Queries ElasticSearch to get mappings.
*
* @class EsMapper
* @constructor
*/
class EsMapper {

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
}

export default EsMapper;
