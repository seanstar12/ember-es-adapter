import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize(serialized) {
    return new Date(serialized);
  },

  serialize(deserialized) {
    if (deserialized instanceof Date) {
      return deserialized.toISOString().substr(0,19);
    }
    return deserialized;
  }
});
