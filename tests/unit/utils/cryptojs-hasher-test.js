import {hmac, hash, toHex} from 'ember-es-adapter/utils/cryptojs-hasher';
import { module, test } from 'qunit';

module('Unit | Utility | cryptojs hasher');

let testString = "I am a test";
let testKey = "DEADBEEF";

test('Can import functions from utility', function(assert) {
  assert.ok(hmac, "Imported hmac");
  assert.ok(hash, "Imported hash");
  assert.ok(toHex, "Imported toHex");
});

test('hmac returns correct sum', function(assert) {
  assert.expect(3);

  var validSum = '47a43d4701628beeb5a50b2030f019c64645a4444390d71e26ad3f9de35d3aab';
  let sum = hmac(testKey, testString, {hexOutput: true});
  assert.equal(sum, validSum, "hmac sum matches");

  let validWords = [
    1201945927,
    23235566,
    -1247474912,
    821041606,
    1178969156,
    1133565726,
    648888221,
    -480429397
  ];

  let bit = hmac(testKey, testString); 
  assert.deepEqual(bit.words, validWords, "hmac bits match");

  let badSum = hmac("BAD_KEY", testString, {hexOutput: true});
  assert.notEqual(badSum, validSum, "hmac fails on bad key");
});

test('hash returns correct sums', function(assert) {
  assert.expect(3);

  let validSum = '5f49192e05c579bb12c6afdd44819a572bf367336a32329c75b960e2ab1ce98e';
  let sum = hash(testString, {hexOutput: true});
  assert.equal(sum, validSum, "hash sum matches");

  let validWords = [
    -218574635,
    -2131887363,
    -1564292616,
    -709744177,
    307720452,
    181592480,
    52436556,
    -1014247134
  ];

  let bit = hash(testKey); 
  assert.deepEqual(bit.words, validWords, "hmac bits match");

  let badSum = hash("BAD_KEY", testString, {hexOutput: true});
  assert.notEqual(badSum, validSum, "hash fails on bad key");
});
