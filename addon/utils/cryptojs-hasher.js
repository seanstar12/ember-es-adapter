import CryptoJS from 'cryptojs';
import SHA256 from 'cryptojs/sha256';
import HmacSHA256 from 'cryptojs/hmac-sha256';
import extend from 'ember-es-adapter/utils/extend';

function hmac(key, input, options) {
  let hmac = new HmacSHA256(input, key, {asBytes: true});
  options = extend({hexOutput: false, textInput: true}, options);
  
  return options.hexOutput ? toHex(hmac): hmac;
}

function hash(input, options) {
  let hash = SHA256(input);
  options = extend({hexOutput: false, textInput: true}, options);

  return options.hexOutput ? toHex(hash): hash;
}

function toHex(input) {
  return input.toString(CryptoJS.enc.Hex);
}

export {
  hash,
  hmac,
  toHex
};
