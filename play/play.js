(function() {
  var key, o, value;

  o = {
    a: 1
  };

  for (key in o) {
    value = o[key];
    console.log(key, value);
  }

}).call(this);
