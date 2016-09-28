/*jshint node:true*/
'use strict';

module.exports = function(/* environment, appConfig */) {
  var ENV = {
    EsAdapter: {
      accessKey: '0123456789ABCDEF',
      secretKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
      date: '2012-02-15T01:00:00',
      dateStamp: '20120215',
      regionName: 'us-east-1',
      serviceName: 'es',
    }
  };

  return ENV;
};
