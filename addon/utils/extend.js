// Simple version of the `extend` function, known from Angular 
// and Backbone. It merges the second (and all succeeding) 
// argument(s) into the object, given as first argument. This 
// is done recursively for all child objects, as well.

export default function extend(dest) {
  var objs = [].slice.call(arguments, 1);
  objs.forEach(function (obj) {
    if (!obj || typeof(obj) !== 'object') {
      return;
    }
    Object.keys(obj).forEach(function (key) {
      var src = obj[key];
      if (typeof(src) === 'undefined') {
        return;
      }
      if (src !== null && typeof(src) === 'object') {
        dest[key] = (Array.isArray(src) ? [] : {});
        extend(dest[key], src);
      } else {
        dest[key] = src;
      }
    });
  });

  return dest;
}
