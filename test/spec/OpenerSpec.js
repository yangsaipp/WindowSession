//demonstrates use of expected exceptions
describe("child window", function() {
  var sessionId = param('sessionId');
  var windowSession = getWindowSession(sessionId);
  var parentWin = window.opener || window.parent;
  console.log("get sessionId:%s from param.", sessionId);
  
  it("should be equal parent window session", function() {
    expect(windowSession).not.toBeNull();
    expect(windowSession).toEqualSession(parentWin['window_seesion_'+ sessionId]);
  });

  it('should add item data success', function () {
    // 必须要使用传递过来的expect，否则会提示expect无spec，执行失败。
    var openerWinData = {name:'opener',index:1};
    expect(windowSession.setItem('openerWinData', openerWinData)).toEqual(openerWinData);
  });

  it("should add listenner success", function () {
    expect(windowSession.on('openerCall', function (name, index, expect, event) {
      expect(event.targetWin).toEqual(parentWin);
      expect(this).toEqual(window);
      expect(name).toEqual('root');
      expect(index).toEqual(0);
    })).not.toBeNull();
  });

  it("should get parent window session data success", function(done) {
    var rootWin = windowSession.getItem('rootWinData');
    expect(rootWin).not.toBeNull();
    expect(rootWin.name).toEqual('root');
    expect(rootWin.index).toEqual(0);
    done();
  });

  it("should be emit parent window listener success", function(done) {
    var event = windowSession.emit('rootWindowCall','opener', 1, expect);
    expect(event).not.toBeUndefined();
    expect(event.targetWin).toEqual(window);
    done();
  });
});