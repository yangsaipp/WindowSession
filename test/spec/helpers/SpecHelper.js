beforeEach(function () {
  jasmine.addMatchers({
    toEqualSession: function () {
      return {
        compare: function (actual, expected) {
          var windowSession = actual;
          return {
            pass: windowSession.equal(expected)
          };
        }
      };
    }
  });
});


function param(name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); 
  var r = window.location.search.substr(1).match(reg); 
  if (r != null) return unescape(r[2]); 
  return null; 
}