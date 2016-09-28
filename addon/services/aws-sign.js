import Ember from 'ember';
import {hmac} from 'ember-es-adapter/utils/cryptojs-hasher';
import config from 'ember-get-config';

const { EsAdapter } = config;

export default Ember.Service.extend({
  reqParams: Ember.A(),

  signReq() {
    var kDate, kRegion, kService, kSigning;
    var reqParams = this.get('reqParams');

    reqParams.clear();

    var data ={
      kDate,
      kRegion,
      kService,
      kSigning
    };
    
    reqParams.pushObject({kDate:this.signKey()});

    
    

    console.log(reqParams);
    return data;
  },

  convertDateAmazon(date, short) {
    date = new Date(EsAdapter.date) || new Date();

    var result = date.toISOString().replace(/[:\-]|\.\d{3}/g, '').substr(0, 17);
    if (short) {
      return result.substr(0, 8);
    }

    return result;
  },

  //signKey(date) {
  //  console.log('signKey');
  //  date = this.convertDateAmazon(EsAdapter.dateStamp || date, true);

  //  return hmac( 'AWS4' + EsAdapter.secretKey, date, {hexOutput: false});
  //},

  signRegion(kDate) {
    console.log('sign region');
    var region = EsAdapter.regionName;

    return hmac(kDate, region, {hexOutput: false, textInput: false});

  },

  signKey() {
    //console.log('signKey'); 
    var key = 'AWS4' + EsAdapter.secretKey,
        date = this.convertDateAmazon(EsAdapter.date || new Date(), true);

    return hmac(key, date);
  },

  signMe(array) {
    array = array || [];
    console.log('signMe'); 
    //console.log(array);

    var date = this.convertDateAmazon(EsAdapter.date || new Date());
    return date;

  },

  signService(service, signedRegion) {
    service = EsAdapter.serviceName || service;

    var crypto = hmac(
      signedRegion,
      service,
      {hexOutput: false, textInput: false}
    );

    return crypto;
  },

  signSigning(service, signedRegion) {
    service = EsAdapter.serviceName || service;

    var crypto = hmac(
      signedRegion,
      service,
      {hexOutput: true, textInput: false}
    );

    return crypto;
  },

  calculateSignature() {
    console.log(EsAdapter);

    var signKey = hmac(
      hmac(
        this.signRegion(null, this.signDate()),
        "ES",
        {hexOutput: false, textInput: false}
      ),
      'aws4_request',
      {hexOutput: false, textInput: false}
    );
    console.log(signKey);
    //ws.signature = hmac(signKey, ws.stringToSign, {textInput: false});
  }

});
