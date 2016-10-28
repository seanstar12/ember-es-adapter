/*jshint node:true*/
'use strict';

module.exports = function(/* environment, appConfig */) {
  var ENV = {
    APP: {
      EsAdapter: {
        host: 'localhost',
        namespace: 'ns'
      }
    }
  };

  return ENV;
};
