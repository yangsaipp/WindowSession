//demonstrates use of expected exceptions
describe("WindowSession", function() {
  var sessionId = param('sessionId');
  var windowSession = getWindowSession(sessionId);

  describe('(self window)', function () {
    it("should be equal parent window session", function() {
      expect(windowSession).not.toBeNull();
      expect(windowSession).toEqualSession(window.opener['window_seesion_'+ sessionId]);
    });

    it('should add window item data success', function () {
      // 必须要使用传递过来的expect，否则会提示expect无spec，执行失败。
      var openerWinData = {name:'opener',index:1};
      expect(windowSession.setItem('openerWinData', openerWinData)).toEqual(openerWinData);
    });

    it("应该增加window监听事件成功", function () {
      expect(windowSession.on('openerCall', function (name, index, expect, event) {
        expect(event.targetWin).toEqual(window.opener);
        expect(this).toEqual(window);
        expect(name).toEqual('root');
        expect(index).toEqual(0);
      })).not.toBeNull();
    });

  });

  describe('(parent window)', function () {
    // 与父窗口的交互都需要等待2s
    beforeEach(function(done) {
      setTimeout(function () {
        done();
      }, 2000);
    });

    it("应该能获取到父窗口里设置的对象", function(done) {
      var rootWin = windowSession.getItem('rootWinData');
      expect(rootWin).not.toBeNull();
      expect(rootWin.name).toEqual('root');
      expect(rootWin.index).toEqual(0);
      done();
    });

    it("应该触发父窗口监听的rootWindowCall事件成功", function(done) {
      var event = windowSession.emit('rootWindowCall','opener', 1, expect);
      expect(event).not.toBeUndefined();
      expect(event.targetWin).toEqual(window);
      done();
    });
  });
});