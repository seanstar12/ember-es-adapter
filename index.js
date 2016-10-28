/*jshint node:true*/
module.exports = {
  name: 'ember-es-adapter',

  isDevelopingAddon: function() {
    return true;
  },

  treeForAddon: function(dir) {
    var version = require('./lib/version');
    var merge = require('broccoli-merge-trees');

    return this._super.treeForAddon.call(this, merge([version(), dir]));
  }

};
