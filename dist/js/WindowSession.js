(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//////////////////////
// ListenerRegistry //
////////////////////// 
var ListenerRegistry = function () {
	function ListenerRegistry() {
		_classCallCheck(this, ListenerRegistry);

		this._registry = {};
	}

	/**
  * 注册事件监听器
  * @param  String name     Event name to listen on
  * @param  {function(event, ...args)} listener Function to call when the event is emitted
  * @return {function}          Returns a deregistration function for this listener.
  */


	_createClass(ListenerRegistry, [{
		key: 'on',
		value: function on(name, listener) {
			if (name == null) {
				throw new Error('注册失败，未指定需要监听的事件名称');
			}

			if (typeof listener !== 'function') {
				throw new Error('注册失败，事件监听回调方法不是js方法');
			}
			return this._on(name, listener);
		}
	}, {
		key: '_on',
		value: function _on(name, listener, registWin) {
			var listeners = this._getListeners(name);
			if (listeners == null) {
				listeners = [];
			}

			listeners.push({
				name: name,
				listener: listener,
				registWin: registWin
			});
			this._registry[name] = listeners;
			return listener;
		}
	}, {
		key: '_getListeners',
		value: function _getListeners(name) {
			return this._registry[name];
		}

		/**
   *  All listeners listening for name event on this scope get notified. 
   *  Afterwards, the event traverses upwards toward the root window
   * @param  {string} name Event name to emit.
   * @param  {*} arg  Optional one or more arguments which will be passed onto the event listeners.
   * @return {Object}      Event object 
   */

	}, {
		key: 'emit',
		value: function emit() {
			var args = Array.prototype.slice.call(arguments);
			// 根据name获取对应注册的listeners，并从参数列表中移除name
			var listeners = this._getListeners(args.shift());
			// 获取触发的窗口对象构建event对象，并从参数列表中移除触发的窗口对象
			var event = { targetWin: args.pop() };
			// 参数列表加入event对象
			args.push(event);
			if (listeners) {
				for (var i = 0; i < listeners.length; i++) {
					listeners[i].listener.apply(listeners[i].registWin, args);
				}
				return event;
			}
		}
	}]);

	return ListenerRegistry;
}();

exports.default = ListenerRegistry;

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.getWindowSession = getWindowSession;

var _ListenerRegistry = require("./ListenerRegistry");

var _ListenerRegistry2 = _interopRequireDefault(_ListenerRegistry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var win = window;

////////////////////////////
// 定义WindowSession 对象 //
////////////////////////////

var WindowSession = function () {

	/**
  * 三种创建WindowSession的方式：
  * 1. new WindowSession();  创建新的WindowSession, sessionId将是随机的uuid
  * 
  * 2. new WindowSession(parentSession); 基于parentSession创建新的WindowSession, 与parentSession共享数据和注册的监听器信息。
  * 设计考虑：<br/>
  * 基于已经存在的WindowSession对象创建新的对象，主要用于基于父页面的windowSession对象创建子页面的WindowSession对象，
  * 若在子窗口中使用父窗口中的windowSession，那么在子页面调用windowSession的on、emit等方法时，其执行环境还是在父窗口，这样就无法记录子窗口的信息，导致一些问题。
  * 如下：
  * 1、子窗口使用on方法注册监听器后，在其他窗口触发时无法将监听器回调方法的执行环境修改为其注册时的子窗口window对象。
  * 2、子窗口使用emit方法无法记录触发事件的窗口信息。
  * ...
  * 所以采用每个子窗口都使用各自的windowsession对象，而这些对象内部数据是共享的设计方式。
  * @param {WindowSession} parentSession 父页面的windowSession对象
  */
	function WindowSession(parentSession) {
		_classCallCheck(this, WindowSession);

		this._parentSession = parentSession;
		this._init();
	}

	_createClass(WindowSession, [{
		key: "_init",
		value: function _init() {
			if (this._parentSession) {
				// 有父windowSession，则使用父windowSession的属性。
				this._sessionId = this._parentSession.getSessionId();
				this._data = this._parentSession._data;
				this._listenerRegistry = this._parentSession._listenerRegistry;
			} else {
				this._sessionId = this._sessionId || uuid();
				// 用于存放不同window之间要访问的数据
				this._data = {};
				// 用于存放各个window中注册的监听器
				this._listenerRegistry = new _ListenerRegistry2.default();
			}
			win[getVariableName(this._sessionId)] = this;
		}

		/**
   * 获取WindowSession的sessionId
   * @return String sessionId
   */

	}, {
		key: "getSessionId",
		value: function getSessionId() {
			return this._sessionId;
		}

		/**
      * 设置对应键值对到session
      * @param key
      * @param value
      * @returns value
      */

	}, {
		key: "setItem",
		value: function setItem(key, value) {
			this._data[key] = value;
			return this.getItem(key);
		}

		/**
   * 根据key获取值
   * @param key
   * @param defaultValue 无值时设置默认值并返回
   * @returns {*}
   */

	}, {
		key: "getItem",
		value: function getItem(key, defaultValue) {
			if (this._data[key] === null) {
				this.setItem(key, defaultValue);
			}
			return this._data[key];
		}

		/**
      * 移除key对应的项
      * @param key
      */

	}, {
		key: "remove",
		value: function remove(key) {
			delete this._data[key];
		}

		/**
      * 清除当前命名空间下的所有项
      */

	}, {
		key: "clear",
		value: function clear() {
			this._data = {};
		}
	}, {
		key: "equal",
		value: function equal(otherSession) {
			if (otherSession == null) {
				return false;
			}

			return this == otherSession || this._sessionId === otherSession.getSessionId() && this._data === otherSession._data && this._listenerRegistry === otherSession._listenerRegistry;
		}

		// createPageAttribute : function (key, value) {
		// 	this.setItem(key, value);
		// }

		// get: function(key, defaultValue) {
		// 	return this.getItem(key, defaultValue);
		// }

		/**
   * 注册事件监听器
   * @param  String name     Event name to listen on
   * @param  {function(event, ...args)} listener Function to call when the event is emitted
   * @return {function}          Returns a deregistration function for this listener.
   */

	}, {
		key: "on",
		value: function on(name, listener) {
			return this._listenerRegistry.on(name, listener, win);
		}

		/**
   *  All listeners listening for name event on this scope get notified. 
   *  Afterwards, the event traverses upwards toward the root window
   * @param  {string} name Event name to emit.
   * @param  {*} arg  Optional one or more arguments which will be passed onto the event listeners.
   * @return {Object}      Event object 
   */

	}, {
		key: "emit",
		value: function emit(name, arg) {
			// 将当前window对象加入参数列表中
			var args = Array.prototype.push.call(arguments, win);
			return this._listenerRegistry.emit.apply(this._listenerRegistry, arguments);
		}
	}]);

	return WindowSession;
}();

/**
 * 生成36位uuid
 * @return String uuid
 */


function uuid() {
	var s = [];
	var hexDigits = "0123456789abcdef";
	for (var i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
	s[19] = hexDigits.substr(s[19] & 0x3 | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
	// s[8] = s[13] = s[18] = s[23] = "-";
	return s.join("");
}

/**
 * 根据给定的sessionId获取WindowSession对象。
 * 该方法对外开放供使用者创建或者获取已经存在的WindowSession对象。
 * @param  String sessionId，为null则创建新的WindowSession对象
 * @return WindowSession  session对象，可以用于在window之间传递数据和监听发送事件
 */
function getWindowSession(sessionId) {
	if (sessionId) {
		return seachSession(sessionId);
	} else {
		return new WindowSession();
	}
}

win.getWindowSession = getWindowSession;

/**
 * 根据给定的sessionId搜索对应的WindowSession对象.
 * 目前是从当前window对象开始一直搜索到最顶层window对象
 * @param  String sessionId 
 * @return WindowSession  WindowSession
 */
function seachSession(sessionId) {
	// 先从当前窗口获取
	if (win[getVariableName(sessionId)] instanceof WindowSession) {
		return win[getVariableName(sessionId)];
	}

	// 在从父窗口中获取
	var currentWin = win;
	var childWin = null;
	var deep = 0;
	do {
		if (Object.prototype.toString.call(currentWin[getVariableName(sessionId)]) === '[object Object]') {
			return new WindowSession(currentWin[getVariableName(sessionId)]);
		} else {
			childWin = currentWin;
			currentWin = currentWin.opener || currentWin.parent;
		}
		if (deep > 20) {
			console.debug("查找seesionid:%s所对应的WindowSession对象时遍历深度已超过%s,有可能陷入死循环.", sessionId, deep);
			return null;
		} else {
			deep++;
		}
	} while (currentWin !== null && currentWin != childWin);
	console.debug("无法找到seesionid:%s所对应的WindowSession对象", sessionId);
	return null;
}

/**
 * 获取WindowSession对象存放在window对象下的变量名
 * @param  {string} sessionId
 * @return {string} WindowSession对象存放在window对象下的变量名
 */
function getVariableName(sessionId) {
	return 'window_seesion_' + sessionId;
}

},{"./ListenerRegistry":1}],3:[function(require,module,exports){
'use strict';

var _WindowSession = require('./WindowSession');

var session = new _WindowSession.getWindowSession();
console.log(session);

},{"./WindowSession":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXExpc3RlbmVyUmVnaXN0cnkuanMiLCJzcmNcXFdpbmRvd1Nlc3Npb24uanMiLCJzcmNcXHV0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7O0FDQUE7QUFDQTtBQUNBO0lBQ3FCLGdCO0FBRXBCLDZCQUFjO0FBQUE7O0FBQ2IsT0FBSyxTQUFMLEdBQWlCLEVBQWpCO0FBQ0E7O0FBRUQ7Ozs7Ozs7Ozs7cUJBTUcsSSxFQUFNLFEsRUFBVTtBQUNsQixPQUFHLFFBQVEsSUFBWCxFQUFpQjtBQUNoQixVQUFNLElBQUksS0FBSixDQUFVLG1CQUFWLENBQU47QUFDQTs7QUFFRCxPQUFHLE9BQU8sUUFBUCxLQUFvQixVQUF2QixFQUFtQztBQUNsQyxVQUFNLElBQUksS0FBSixDQUFVLHFCQUFWLENBQU47QUFDQTtBQUNELFVBQU8sS0FBSyxHQUFMLENBQVMsSUFBVCxFQUFlLFFBQWYsQ0FBUDtBQUNBOzs7c0JBRUcsSSxFQUFNLFEsRUFBVSxTLEVBQVk7QUFDL0IsT0FBSSxZQUFZLEtBQUssYUFBTCxDQUFtQixJQUFuQixDQUFoQjtBQUNBLE9BQUcsYUFBYSxJQUFoQixFQUFzQjtBQUNyQixnQkFBWSxFQUFaO0FBQ0E7O0FBRUQsYUFBVSxJQUFWLENBQWU7QUFDZCxVQUFNLElBRFE7QUFFZCxjQUFVLFFBRkk7QUFHZCxlQUFXO0FBSEcsSUFBZjtBQUtBLFFBQUssU0FBTCxDQUFlLElBQWYsSUFBdUIsU0FBdkI7QUFDQSxVQUFPLFFBQVA7QUFDQTs7O2dDQUVhLEksRUFBTTtBQUNuQixVQUFPLEtBQUssU0FBTCxDQUFlLElBQWYsQ0FBUDtBQUNBOztBQUVEOzs7Ozs7Ozs7O3lCQU9PO0FBQ04sT0FBSSxPQUFPLE1BQU0sU0FBTixDQUFnQixLQUFoQixDQUFzQixJQUF0QixDQUEyQixTQUEzQixDQUFYO0FBQ0E7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QTBCLElBQTFCLENBQStCLFdBQVcsZ0JBQWdCLFNBQWhCLENBQVgsQ0FBL0IsTUFBMkUsaUJBQTlFLEVBQWlHO0FBQ2hHLFVBQU8sSUFBSSxhQUFKLENBQWtCLFdBQVcsZ0JBQWdCLFNBQWhCLENBQVgsQ0FBbEIsQ0FBUDtBQUNBLEdBRkQsTUFFTztBQUNOLGNBQVcsVUFBWDtBQUNBLGdCQUFhLFdBQVcsTUFBWCxJQUFxQixXQUFXLE1BQTdDO0FBQ0E7QUFDRCxNQUFHLE9BQU8sRUFBVixFQUFjO0FBQ2IsV0FBUSxLQUFSLENBQWMsdURBQWQsRUFBdUUsU0FBdkUsRUFBa0YsSUFBbEY7QUFDQSxVQUFPLElBQVA7QUFDQSxHQUhELE1BR007QUFDTDtBQUNBO0FBQ0QsRUFiRCxRQWNNLGVBQWUsSUFBZixJQUF1QixjQUFjLFFBZDNDO0FBZUEsU0FBUSxLQUFSLENBQWMscUNBQWQsRUFBcUQsU0FBckQ7QUFDQSxRQUFPLElBQVA7QUFDQTs7QUFFRDs7Ozs7QUFLQSxTQUFTLGVBQVQsQ0FBeUIsU0FBekIsRUFBb0M7QUFDbkMsUUFBTyxvQkFBb0IsU0FBM0I7QUFDQTs7Ozs7QUMvTUQ7O0FBRUEsSUFBSSxVQUFVLHFDQUFkO0FBQ0EsUUFBUSxHQUFSLENBQVksT0FBWiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIExpc3RlbmVyUmVnaXN0cnkgLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGlzdGVuZXJSZWdpc3RyeSB7XHJcblxyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0dGhpcy5fcmVnaXN0cnkgPSB7fTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIOazqOWGjOS6i+S7tuebkeWQrOWZqFxyXG5cdCAqIEBwYXJhbSAgU3RyaW5nIG5hbWUgICAgIEV2ZW50IG5hbWUgdG8gbGlzdGVuIG9uXHJcblx0ICogQHBhcmFtICB7ZnVuY3Rpb24oZXZlbnQsIC4uLmFyZ3MpfSBsaXN0ZW5lciBGdW5jdGlvbiB0byBjYWxsIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWRcclxuXHQgKiBAcmV0dXJuIHtmdW5jdGlvbn0gICAgICAgICAgUmV0dXJucyBhIGRlcmVnaXN0cmF0aW9uIGZ1bmN0aW9uIGZvciB0aGlzIGxpc3RlbmVyLlxyXG5cdCAqL1xyXG5cdG9uKG5hbWUsIGxpc3RlbmVyKSB7XHJcblx0XHRpZihuYW1lID09IG51bGwpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCfms6jlhozlpLHotKXvvIzmnKrmjIflrprpnIDopoHnm5HlkKznmoTkuovku7blkI3np7AnKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZih0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCfms6jlhozlpLHotKXvvIzkuovku7bnm5HlkKzlm57osIPmlrnms5XkuI3mmK9qc+aWueazlScpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuX29uKG5hbWUsIGxpc3RlbmVyKTtcclxuXHR9XHJcblxyXG5cdF9vbihuYW1lLCBsaXN0ZW5lciwgcmVnaXN0V2luKSAge1xyXG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuX2dldExpc3RlbmVycyhuYW1lKTtcclxuXHRcdGlmKGxpc3RlbmVycyA9PSBudWxsKSB7XHJcblx0XHRcdGxpc3RlbmVycyA9IFtdO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxpc3RlbmVycy5wdXNoKHtcclxuXHRcdFx0bmFtZTogbmFtZSxcclxuXHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxyXG5cdFx0XHRyZWdpc3RXaW46IHJlZ2lzdFdpblxyXG5cdFx0fSk7XHJcblx0XHR0aGlzLl9yZWdpc3RyeVtuYW1lXSA9IGxpc3RlbmVycztcclxuXHRcdHJldHVybiBsaXN0ZW5lcjtcclxuXHR9XHJcblxyXG5cdF9nZXRMaXN0ZW5lcnMobmFtZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3JlZ2lzdHJ5W25hbWVdO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogIEFsbCBsaXN0ZW5lcnMgbGlzdGVuaW5nIGZvciBuYW1lIGV2ZW50IG9uIHRoaXMgc2NvcGUgZ2V0IG5vdGlmaWVkLiBcclxuXHQgKiAgQWZ0ZXJ3YXJkcywgdGhlIGV2ZW50IHRyYXZlcnNlcyB1cHdhcmRzIHRvd2FyZCB0aGUgcm9vdCB3aW5kb3dcclxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWUgRXZlbnQgbmFtZSB0byBlbWl0LlxyXG5cdCAqIEBwYXJhbSAgeyp9IGFyZyAgT3B0aW9uYWwgb25lIG9yIG1vcmUgYXJndW1lbnRzIHdoaWNoIHdpbGwgYmUgcGFzc2VkIG9udG8gdGhlIGV2ZW50IGxpc3RlbmVycy5cclxuXHQgKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgRXZlbnQgb2JqZWN0IFxyXG5cdCAqL1xyXG5cdGVtaXQoKSB7XHJcblx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcblx0XHQvLyDmoLnmja5uYW1l6I635Y+W5a+55bqU5rOo5YaM55qEbGlzdGVuZXJz77yM5bm25LuO5Y+C5pWw5YiX6KGo5Lit56e76ZmkbmFtZVxyXG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuX2dldExpc3RlbmVycyhhcmdzLnNoaWZ0KCkpO1xyXG5cdFx0Ly8g6I635Y+W6Kem5Y+R55qE56qX5Y+j5a+56LGh5p6E5bu6ZXZlbnTlr7nosaHvvIzlubbku47lj4LmlbDliJfooajkuK3np7vpmaTop6blj5HnmoTnqpflj6Plr7nosaFcclxuXHRcdHZhciBldmVudCA9IHt0YXJnZXRXaW46IGFyZ3MucG9wKCl9O1xyXG5cdFx0Ly8g5Y+C5pWw5YiX6KGo5Yqg5YWlZXZlbnTlr7nosaFcclxuXHRcdGFyZ3MucHVzaChldmVudCk7XHJcblx0XHRpZihsaXN0ZW5lcnMpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRsaXN0ZW5lcnNbaV0ubGlzdGVuZXIuYXBwbHkobGlzdGVuZXJzW2ldLnJlZ2lzdFdpbiwgYXJncyk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGV2ZW50O1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuIiwiaW1wb3J0IExpc3RlbmVyUmVnaXN0cnkgZnJvbSAnLi9MaXN0ZW5lclJlZ2lzdHJ5JztcclxuXHJcbmNvbnN0IHdpbiA9IHdpbmRvdztcclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8g5a6a5LmJV2luZG93U2Vzc2lvbiDlr7nosaEgLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5jbGFzcyBXaW5kb3dTZXNzaW9uIHtcclxuXHJcblx0LyoqXHJcblx0ICog5LiJ56eN5Yib5bu6V2luZG93U2Vzc2lvbueahOaWueW8j++8mlxyXG5cdCAqIDEuIG5ldyBXaW5kb3dTZXNzaW9uKCk7ICDliJvlu7rmlrDnmoRXaW5kb3dTZXNzaW9uLCBzZXNzaW9uSWTlsIbmmK/pmo/mnLrnmoR1dWlkXHJcblx0ICogXHJcblx0ICogMi4gbmV3IFdpbmRvd1Nlc3Npb24ocGFyZW50U2Vzc2lvbik7IOWfuuS6jnBhcmVudFNlc3Npb27liJvlu7rmlrDnmoRXaW5kb3dTZXNzaW9uLCDkuI5wYXJlbnRTZXNzaW9u5YWx5Lqr5pWw5o2u5ZKM5rOo5YaM55qE55uR5ZCs5Zmo5L+h5oGv44CCXHJcblx0ICog6K6+6K6h6ICD6JmR77yaPGJyLz5cclxuXHQgKiDln7rkuo7lt7Lnu4/lrZjlnKjnmoRXaW5kb3dTZXNzaW9u5a+56LGh5Yib5bu65paw55qE5a+56LGh77yM5Li76KaB55So5LqO5Z+65LqO54i26aG16Z2i55qEd2luZG93U2Vzc2lvbuWvueixoeWIm+W7uuWtkOmhtemdoueahFdpbmRvd1Nlc3Npb27lr7nosaHvvIxcclxuXHQgKiDoi6XlnKjlrZDnqpflj6PkuK3kvb/nlKjniLbnqpflj6PkuK3nmoR3aW5kb3dTZXNzaW9u77yM6YKj5LmI5Zyo5a2Q6aG16Z2i6LCD55Sod2luZG93U2Vzc2lvbueahG9u44CBZW1pdOetieaWueazleaXtu+8jOWFtuaJp+ihjOeOr+Wig+i/mOaYr+WcqOeItueql+WPo++8jOi/meagt+WwseaXoOazleiusOW9leWtkOeql+WPo+eahOS/oeaBr++8jOWvvOiHtOS4gOS6m+mXrumimOOAglxyXG5cdCAqIOWmguS4i++8mlxyXG5cdCAqIDHjgIHlrZDnqpflj6Pkvb/nlKhvbuaWueazleazqOWGjOebkeWQrOWZqOWQju+8jOWcqOWFtuS7lueql+WPo+inpuWPkeaXtuaXoOazleWwhuebkeWQrOWZqOWbnuiwg+aWueazleeahOaJp+ihjOeOr+Wig+S/ruaUueS4uuWFtuazqOWGjOaXtueahOWtkOeql+WPo3dpbmRvd+WvueixoeOAglxyXG5cdCAqIDLjgIHlrZDnqpflj6Pkvb/nlKhlbWl05pa55rOV5peg5rOV6K6w5b2V6Kem5Y+R5LqL5Lu255qE56qX5Y+j5L+h5oGv44CCXHJcblx0ICogLi4uXHJcblx0ICog5omA5Lul6YeH55So5q+P5Liq5a2Q56qX5Y+j6YO95L2/55So5ZCE6Ieq55qEd2luZG93c2Vzc2lvbuWvueixoe+8jOiAjOi/meS6m+WvueixoeWGhemDqOaVsOaNruaYr+WFseS6q+eahOiuvuiuoeaWueW8j+OAglxyXG5cdCAqIEBwYXJhbSB7V2luZG93U2Vzc2lvbn0gcGFyZW50U2Vzc2lvbiDniLbpobXpnaLnmoR3aW5kb3dTZXNzaW9u5a+56LGhXHJcblx0ICovXHJcblx0Y29uc3RydWN0b3IocGFyZW50U2Vzc2lvbikge1xyXG5cdFx0dGhpcy5fcGFyZW50U2Vzc2lvbiA9IHBhcmVudFNlc3Npb247XHJcblx0XHR0aGlzLl9pbml0KCk7XHJcblx0fVxyXG5cclxuXHRfaW5pdCgpIHtcclxuXHRcdGlmKHRoaXMuX3BhcmVudFNlc3Npb24pIHtcdC8vIOacieeItndpbmRvd1Nlc3Npb27vvIzliJnkvb/nlKjniLZ3aW5kb3dTZXNzaW9u55qE5bGe5oCn44CCXHJcblx0XHRcdHRoaXMuX3Nlc3Npb25JZCA9IHRoaXMuX3BhcmVudFNlc3Npb24uZ2V0U2Vzc2lvbklkKCk7XHJcblx0XHRcdHRoaXMuX2RhdGEgPSB0aGlzLl9wYXJlbnRTZXNzaW9uLl9kYXRhO1xyXG5cdFx0XHR0aGlzLl9saXN0ZW5lclJlZ2lzdHJ5ID0gdGhpcy5fcGFyZW50U2Vzc2lvbi5fbGlzdGVuZXJSZWdpc3RyeTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuX3Nlc3Npb25JZCA9ICB0aGlzLl9zZXNzaW9uSWQgfHwgdXVpZCgpO1xyXG5cdFx0XHQvLyDnlKjkuo7lrZjmlL7kuI3lkIx3aW5kb3fkuYvpl7TopoHorr/pl67nmoTmlbDmja5cclxuXHRcdFx0dGhpcy5fZGF0YSA9IHt9O1xyXG5cdFx0XHQvLyDnlKjkuo7lrZjmlL7lkITkuKp3aW5kb3fkuK3ms6jlhoznmoTnm5HlkKzlmahcclxuXHRcdFx0dGhpcy5fbGlzdGVuZXJSZWdpc3RyeSA9IG5ldyBMaXN0ZW5lclJlZ2lzdHJ5KCk7XHJcblx0XHR9XHJcblx0XHR3aW5bZ2V0VmFyaWFibGVOYW1lKHRoaXMuX3Nlc3Npb25JZCldID0gdGhpcztcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIOiOt+WPlldpbmRvd1Nlc3Npb27nmoRzZXNzaW9uSWRcclxuXHQgKiBAcmV0dXJuIFN0cmluZyBzZXNzaW9uSWRcclxuXHQgKi9cclxuXHRnZXRTZXNzaW9uSWQoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fc2Vzc2lvbklkO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcbiAgICAgKiDorr7nva7lr7nlupTplK7lgLzlr7nliLBzZXNzaW9uXHJcbiAgICAgKiBAcGFyYW0ga2V5XHJcbiAgICAgKiBAcGFyYW0gdmFsdWVcclxuICAgICAqIEByZXR1cm5zIHZhbHVlXHJcbiAgICAgKi9cclxuXHRzZXRJdGVtKGtleSwgdmFsdWUpIHtcclxuXHRcdHRoaXMuX2RhdGFba2V5XSA9IHZhbHVlO1xyXG5cdFx0cmV0dXJuIHRoaXMuZ2V0SXRlbShrZXkpO1xyXG5cdH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOagueaNrmtleeiOt+WPluWAvFxyXG4gICAgICogQHBhcmFtIGtleVxyXG4gICAgICogQHBhcmFtIGRlZmF1bHRWYWx1ZSDml6DlgLzml7borr7nva7pu5jorqTlgLzlubbov5Tlm55cclxuICAgICAqIEByZXR1cm5zIHsqfVxyXG4gICAgICovXHJcblx0Z2V0SXRlbShrZXksIGRlZmF1bHRWYWx1ZSkge1xyXG5cdFx0aWYodGhpcy5fZGF0YVtrZXldID09PSBudWxsKSB7XHJcblx0XHRcdHRoaXMuc2V0SXRlbShrZXksIGRlZmF1bHRWYWx1ZSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5fZGF0YVtrZXldO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcbiAgICAgKiDnp7vpmaRrZXnlr7nlupTnmoTpoblcclxuICAgICAqIEBwYXJhbSBrZXlcclxuICAgICAqL1xyXG5cdHJlbW92ZShrZXkpIHtcclxuXHRcdGRlbGV0ZSB0aGlzLl9kYXRhW2tleV07XHJcblx0fVxyXG5cclxuXHQvKipcclxuICAgICAqIOa4hemZpOW9k+WJjeWRveWQjeepuumXtOS4i+eahOaJgOaciemhuVxyXG4gICAgICovXHJcblx0Y2xlYXIoKSB7XHJcblx0XHR0aGlzLl9kYXRhID0ge307XHJcblx0fVxyXG5cclxuXHRlcXVhbChvdGhlclNlc3Npb24pIHtcclxuXHRcdGlmKG90aGVyU2Vzc2lvbiA9PSBudWxsKSB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcyA9PSBvdGhlclNlc3Npb24gfHwgKHRoaXMuX3Nlc3Npb25JZCA9PT0gb3RoZXJTZXNzaW9uLmdldFNlc3Npb25JZCgpICYmIFxyXG5cdFx0XHR0aGlzLl9kYXRhID09PSBvdGhlclNlc3Npb24uX2RhdGEgJiYgXHJcblx0XHRcdHRoaXMuX2xpc3RlbmVyUmVnaXN0cnkgPT09IG90aGVyU2Vzc2lvbi5fbGlzdGVuZXJSZWdpc3RyeSk7XHJcblx0fVxyXG5cclxuXHQvLyBjcmVhdGVQYWdlQXR0cmlidXRlIDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcclxuXHQvLyBcdHRoaXMuc2V0SXRlbShrZXksIHZhbHVlKTtcclxuXHQvLyB9XHJcblxyXG5cdC8vIGdldDogZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsdWUpIHtcclxuXHQvLyBcdHJldHVybiB0aGlzLmdldEl0ZW0oa2V5LCBkZWZhdWx0VmFsdWUpO1xyXG5cdC8vIH1cclxuXHJcblx0LyoqXHJcblx0ICog5rOo5YaM5LqL5Lu255uR5ZCs5ZmoXHJcblx0ICogQHBhcmFtICBTdHJpbmcgbmFtZSAgICAgRXZlbnQgbmFtZSB0byBsaXN0ZW4gb25cclxuXHQgKiBAcGFyYW0gIHtmdW5jdGlvbihldmVudCwgLi4uYXJncyl9IGxpc3RlbmVyIEZ1bmN0aW9uIHRvIGNhbGwgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZFxyXG5cdCAqIEByZXR1cm4ge2Z1bmN0aW9ufSAgICAgICAgICBSZXR1cm5zIGEgZGVyZWdpc3RyYXRpb24gZnVuY3Rpb24gZm9yIHRoaXMgbGlzdGVuZXIuXHJcblx0ICovXHJcblx0b24gKG5hbWUsIGxpc3RlbmVyKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fbGlzdGVuZXJSZWdpc3RyeS5vbihuYW1lLCBsaXN0ZW5lciwgd2luKTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqICBBbGwgbGlzdGVuZXJzIGxpc3RlbmluZyBmb3IgbmFtZSBldmVudCBvbiB0aGlzIHNjb3BlIGdldCBub3RpZmllZC4gXHJcblx0ICogIEFmdGVyd2FyZHMsIHRoZSBldmVudCB0cmF2ZXJzZXMgdXB3YXJkcyB0b3dhcmQgdGhlIHJvb3Qgd2luZG93XHJcblx0ICogQHBhcmFtICB7c3RyaW5nfSBuYW1lIEV2ZW50IG5hbWUgdG8gZW1pdC5cclxuXHQgKiBAcGFyYW0gIHsqfSBhcmcgIE9wdGlvbmFsIG9uZSBvciBtb3JlIGFyZ3VtZW50cyB3aGljaCB3aWxsIGJlIHBhc3NlZCBvbnRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXHJcblx0ICogQHJldHVybiB7T2JqZWN0fSAgICAgIEV2ZW50IG9iamVjdCBcclxuXHQgKi9cclxuXHRlbWl0IChuYW1lLCBhcmcpIHtcclxuXHRcdC8vIOWwhuW9k+WJjXdpbmRvd+WvueixoeWKoOWFpeWPguaVsOWIl+ihqOS4rVxyXG5cdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKGFyZ3VtZW50cywgd2luKTtcclxuXHRcdHJldHVybiB0aGlzLl9saXN0ZW5lclJlZ2lzdHJ5LmVtaXQuYXBwbHkodGhpcy5fbGlzdGVuZXJSZWdpc3RyeSwgYXJndW1lbnRzKTtcclxuXHR9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDnlJ/miJAzNuS9jXV1aWRcclxuICogQHJldHVybiBTdHJpbmcgdXVpZFxyXG4gKi9cclxuZnVuY3Rpb24gdXVpZCgpIHtcclxuICAgIHZhciBzID0gW107XHJcbiAgICB2YXIgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM2OyBpKyspIHtcclxuICAgICAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XHJcbiAgICB9XHJcbiAgICBzWzE0XSA9IFwiNFwiOyAgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXHJcbiAgICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7ICAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxyXG4gICAgLy8gc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xyXG4gICAgcmV0dXJuIHMuam9pbihcIlwiKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIOagueaNrue7meWumueahHNlc3Npb25JZOiOt+WPlldpbmRvd1Nlc3Npb27lr7nosaHjgIJcclxuICog6K+l5pa55rOV5a+55aSW5byA5pS+5L6b5L2/55So6ICF5Yib5bu65oiW6ICF6I635Y+W5bey57uP5a2Y5Zyo55qEV2luZG93U2Vzc2lvbuWvueixoeOAglxyXG4gKiBAcGFyYW0gIFN0cmluZyBzZXNzaW9uSWTvvIzkuLpudWxs5YiZ5Yib5bu65paw55qEV2luZG93U2Vzc2lvbuWvueixoVxyXG4gKiBAcmV0dXJuIFdpbmRvd1Nlc3Npb24gIHNlc3Npb27lr7nosaHvvIzlj6/ku6XnlKjkuo7lnKh3aW5kb3fkuYvpl7TkvKDpgJLmlbDmja7lkoznm5HlkKzlj5HpgIHkuovku7ZcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRXaW5kb3dTZXNzaW9uKHNlc3Npb25JZCkge1xyXG5cdGlmKHNlc3Npb25JZCkge1xyXG5cdFx0cmV0dXJuIHNlYWNoU2Vzc2lvbihzZXNzaW9uSWQpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRyZXR1cm4gbmV3IFdpbmRvd1Nlc3Npb24oKTtcclxuXHR9XHJcbn1cclxuXHJcbndpbi5nZXRXaW5kb3dTZXNzaW9uID0gZ2V0V2luZG93U2Vzc2lvbjtcclxuXHJcbi8qKlxyXG4gKiDmoLnmja7nu5nlrprnmoRzZXNzaW9uSWTmkJzntKLlr7nlupTnmoRXaW5kb3dTZXNzaW9u5a+56LGhLlxyXG4gKiDnm67liY3mmK/ku47lvZPliY13aW5kb3flr7nosaHlvIDlp4vkuIDnm7TmkJzntKLliLDmnIDpobblsYJ3aW5kb3flr7nosaFcclxuICogQHBhcmFtICBTdHJpbmcgc2Vzc2lvbklkIFxyXG4gKiBAcmV0dXJuIFdpbmRvd1Nlc3Npb24gIFdpbmRvd1Nlc3Npb25cclxuICovXHJcbmZ1bmN0aW9uIHNlYWNoU2Vzc2lvbihzZXNzaW9uSWQpIHtcclxuXHQvLyDlhYjku47lvZPliY3nqpflj6Pojrflj5ZcclxuXHRpZih3aW5bZ2V0VmFyaWFibGVOYW1lKHNlc3Npb25JZCldIGluc3RhbmNlb2YgV2luZG93U2Vzc2lvbikge1xyXG5cdFx0cmV0dXJuIHdpbltnZXRWYXJpYWJsZU5hbWUoc2Vzc2lvbklkKV07XHJcblx0fVxyXG5cclxuXHQvLyDlnKjku47niLbnqpflj6PkuK3ojrflj5ZcclxuXHR2YXIgY3VycmVudFdpbiA9IHdpbjtcclxuXHR2YXIgY2hpbGRXaW4gPSBudWxsO1xyXG5cdHZhciBkZWVwID0gMDtcclxuXHRkbyB7XHJcblx0XHRpZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoY3VycmVudFdpbltnZXRWYXJpYWJsZU5hbWUoc2Vzc2lvbklkKV0pID09PSAnW29iamVjdCBPYmplY3RdJykge1xyXG5cdFx0XHRyZXR1cm4gbmV3IFdpbmRvd1Nlc3Npb24oY3VycmVudFdpbltnZXRWYXJpYWJsZU5hbWUoc2Vzc2lvbklkKV0pO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y2hpbGRXaW4gPSBjdXJyZW50V2luO1xyXG5cdFx0XHRjdXJyZW50V2luID0gY3VycmVudFdpbi5vcGVuZXIgfHwgY3VycmVudFdpbi5wYXJlbnQ7XHJcblx0XHR9XHJcblx0XHRpZihkZWVwID4gMjApIHtcclxuXHRcdFx0Y29uc29sZS5kZWJ1ZyhcIuafpeaJvnNlZXNpb25pZDolc+aJgOWvueW6lOeahFdpbmRvd1Nlc3Npb27lr7nosaHml7bpgY3ljobmt7Hluqblt7LotoXov4clcyzmnInlj6/og73pmbflhaXmrbvlvqrnjq8uXCIsIHNlc3Npb25JZCwgZGVlcCk7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fWVsc2Uge1xyXG5cdFx0XHRkZWVwICsrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHR3aGlsZShjdXJyZW50V2luICE9PSBudWxsICYmIGN1cnJlbnRXaW4gIT0gY2hpbGRXaW4pO1xyXG5cdGNvbnNvbGUuZGVidWcoXCLml6Dms5Xmib7liLBzZWVzaW9uaWQ6JXPmiYDlr7nlupTnmoRXaW5kb3dTZXNzaW9u5a+56LGhXCIsIHNlc3Npb25JZCk7XHJcblx0cmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDojrflj5ZXaW5kb3dTZXNzaW9u5a+56LGh5a2Y5pS+5Zyod2luZG935a+56LGh5LiL55qE5Y+Y6YeP5ZCNXHJcbiAqIEBwYXJhbSAge3N0cmluZ30gc2Vzc2lvbklkXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gV2luZG93U2Vzc2lvbuWvueixoeWtmOaUvuWcqHdpbmRvd+WvueixoeS4i+eahOWPmOmHj+WQjVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0VmFyaWFibGVOYW1lKHNlc3Npb25JZCkge1xyXG5cdHJldHVybiAnd2luZG93X3NlZXNpb25fJyArIHNlc3Npb25JZDtcclxufSIsImltcG9ydCB7Z2V0V2luZG93U2Vzc2lvbn0gZnJvbSAnLi9XaW5kb3dTZXNzaW9uJztcclxuXHJcbmxldCBzZXNzaW9uID0gbmV3IGdldFdpbmRvd1Nlc3Npb24oKTtcclxuY29uc29sZS5sb2coc2Vzc2lvbik7Il19
