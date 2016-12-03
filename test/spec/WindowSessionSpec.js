describe("WindowSession", function() {

  var rootWindow = window;
  var windowSession = getWindowSession();
  var sessionId = windowSession.getSessionId();

  

  describe("[One Window Test]", function() {
    afterAll(function () {
      windowSession.clear();
    });

    beforeEach(function() {
      windowSession.clear();
    });

    it("should be get same WindowSession object when sessionId is same", function() {
      expect(getWindowSession(sessionId)).toEqualSession(windowSession);
    });

    it("should be get right item vaule after set item", function() {
      windowSession.setItem('name', 'zhangshan');
      expect(windowSession.getItem('name')).toEqual('zhangshan');
      expect(windowSession.getItem('name2')).toBeUndefined();
    });

    it("should be call after regist listenner", function() {
      windowSession.on('test', function (name, age) {
        // expect(event.targetWin).toEqual(window);
        expect(name).toEqual('zhangshan');
        expect(age).toEqual(12);
      });
      windowSession.emit('test', 'zhangshan', 12);
    });

    describe("that had set some item", function() {
      beforeEach(function() {
        windowSession.setItem('name', 'zhangshan');
        expect(windowSession.getItem('name')).toEqual('zhangshan');
      });

      it("should be get item value is undefined after the item remove", function() {
        windowSession.remove('name');
        expect(windowSession.getItem('name')).toBeUndefined();
      });

      it("should be get item value is after the windowSession clear", function() {
        expect(windowSession.getItem('name')).toEqual('zhangshan');
        windowSession.clear();
        expect(windowSession.getItem('name')).toBeUndefined();
      });
    });
  });

  describe("[Two Windows Test]", function () {
    var openWindow;
    
    // 开始之前需要开启新的页面来测试不同页面之间的交互
    beforeAll(function () {
      var url = 'OpenerSpecRunner.html?sessionId=' + sessionId;
      setTimeout(function () {
        console.log("open child window, sessionId:%s.", sessionId);
        openWindow = openUrl(url);
      }, 1000);
      //openWindow = rootWindow.open('OpenerSpecRunner.html?sessionId=' + sessionId, 'OpenerSpecRunner'); 
    });

    function openUrl(url) {
      var $open =  $('<iframe style="width: 100%; height: 300px; margin-top:50px;" id="OpenerSpecRunner" src="' + url + '"></iframe>');
      $('body').append($open);
      // window.document.getElementById("OpenerSpecRunner").src = url;
      return window.frames['OpenerSpecRunner'].contentWindow;
    }
      
    it('should add listenner success', function () {
      expect(windowSession.on('rootWindowCall', function (name, index, expect, event) {
        // 必须要使用传递过来的expect，否则会提示expect无spec，执行失败。
        expect(event.targetWin).toEqual(openWindow);
        expect(this).toEqual(rootWindow);
        expect(name).toEqual('opener');
        expect(index).toEqual(1);
      })).not.toBeUndefined();
    });

    it('should add item data success', function () {
      var itemData = {name:'root',index:0};
      expect(windowSession.setItem('rootWinData', itemData)).toEqual(itemData);
    });

    describe("After 2 secs", function () {
      beforeEach(function (done) {
        // 4s后在执行
        setTimeout(function () {
          done();
        }, 2000);
      });

      it("should be emit child window listener success", function (done) {
        var event = windowSession.emit('openerCall', 'root', 0, expect);
        expect(event).not.toBeUndefined();
        expect(event.targetWin).toEqual(window);
        done();
      });

      it("should get child window item data success", function (done) {
        var openerWinData = windowSession.getItem('openerWinData');
        expect(openerWinData).not.toBeNull();
        expect(openerWinData.name).toEqual('opener');
        expect(openerWinData.index).toEqual(1);
        done();
      });
    });
  });

  // beforeEach中使用setTimeout调用done方法触发异步测试任务
  // beforeEach(function(done) {
  //   setTimeout(function() {
  //     value = 0;
  //     done();
  //   }, 1);
  // });

  // 定义异步测试任务,只有当beforeEach中的done方法调用的时候才会触发该测试
  // it("should support async execution of test preparation and expectations", function(done) {
  //   value++;
  //   expect(value).toBeGreaterThan(0);
  //   done();
  // });

  // demonstrates use of spies to intercept and test method calls
  // it("tells the current song if the user has made it a favorite", function() {
  //   spyOn(song, 'persistFavoriteStatus');

  //   player.play(song);
  //   player.makeFavorite();

  //   expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
  // });

  //demonstrates use of expected exceptions
  // describe("#resume", function() {
  //   it("should throw an exception if song is already playing", function() {
  //     player.play(song);

  //     expect(function() {
  //       player.resume();
  //     }).toThrowError("song is already playing");
  //   });
  // });
  // 
});

