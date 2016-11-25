describe("WindowSession", function() {
  var rootWindow = window;
  var windowSession = getWindowSession();
  var sessionId = windowSession.getSessionId();

  beforeEach(function() {
    windowSession.clear();
  });

  it("should be get same WindowSession object when sessionId is same", function() {
    expect(getWindowSession(sessionId)).toEqual(windowSession);
  });

  it("should be get right item vaule after set item", function() {
    windowSession.setItem('name', 'zhangshan');
    expect(windowSession.getItem('name')).toEqual('zhangshan');
    expect(windowSession.getItem('name2')).toBeUndefined();
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
});


//demonstrates use of expected exceptions
// describe("multiple iframe", function() {
//   var rootWindow = window;
//   var windowSession = getWindowSession();
//   var sessionId = windowSession.getSessionId();
//   var openWindow = window.open('spec/openerSpec.html', 'openerSpec');

//   beforeEach(function() {
//     windowSession.clear();
    
//   });

//   it("should be get same WindowSession object when sessionId is same", function() {
//     expect(openWindow.getWindowSession(sessionId)).toEqual(windowSession);
//   });
// });