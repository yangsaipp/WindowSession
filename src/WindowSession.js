(function (win) {

	/**
	 * 根据给定的sessionId获取WindowSession对象。
	 * 该方法对外开放供使用者创建或者获取已经存在的WindowSession对象。
	 * @param  String sessionId，为null则创建新的WindowSession对象
	 * @return WindowSession  session对象，可以用于在window之间传递数据和监听发送事件
	 */
	function getWindowSession(sessionId) {
		if(sessionId) {
 			return seachSession(sessionId);
		} else {
			return new WindowSession();
		}
	}

	/**
	 * 根据给定的sessionId搜索对应的WindowSession对象.
	 * 目前是从当前window对象开始一直搜索到最顶层window对象
	 * @param  String sessionId 
	 * @return WindowSession  WindowSession
	 */
	function seachSession(sessionId) {
		// 先从当前窗口获取
		if(win[getVariableName(sessionId)] instanceof WindowSession) {
			return win[getVariableName(sessionId)];
		}

		// 在从父窗口中获取
		var currentWin = win;
		var childWin = null;
		var deep = 0;
		do {
			if(Object.prototype.toString.call(currentWin[getVariableName(sessionId)]) === '[object Object]') {
				return new WindowSession(currentWin[getVariableName(sessionId)]);
			} else {
				childWin = currentWin;
				currentWin = currentWin.opener || currentWin.parent;
			}
			if(deep > 20) {
				console.debug("查找seesionid:%s所对应的WindowSession对象时遍历深度已超过%s,有可能陷入死循环.", sessionId, deep);
				return null;
			}else {
				deep ++;
			}
		}
		while(currentWin !== null && currentWin != childWin);
		console.debug("无法找到seesionid:%s所对应的WindowSession对象", sessionId);
		return null;
	}

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
	    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
	    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
	    // s[8] = s[13] = s[18] = s[23] = "-";
	    return s.join("");
	}

	////////////////////////////
	// 定义WindowSession 对象 //
	////////////////////////////

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
		this._parentSession = parentSession;
		this._init();
	}

	/**
	 * 获取WindowSession对象存放在window对象下的变量名
	 * @param  {string} sessionId
	 * @return {string} WindowSession对象存放在window对象下的变量名
	 */
	function getVariableName(sessionId) {
		return 'window_seesion_' + sessionId;
	}

	WindowSession.prototype = {

		_init: function () {
			if(this._parentSession) {	// 有父windowSession，则使用父windowSession的属性。
				this._sessionId = this._parentSession.getSessionId();
				this._data = this._parentSession._data;
				this._listenerRegistry = this._parentSession._listenerRegistry;
			} else {
				this._sessionId =  this._sessionId || uuid();
				// 用于存放不同window之间要访问的数据
				this._data = {};
				// 用于存放各个window中注册的监听器
				this._listenerRegistry = new ListenerRegistry();
			}
			win[getVariableName(this._sessionId)] = this;
		},

		/**
		 * 获取WindowSession的sessionId
		 * @return String sessionId
		 */
		getSessionId: function () {
			return this._sessionId;
		},

		/**
         * 设置对应键值对到session
         * @param key
         * @param value
         * @returns value
         */
		setItem: function (key, value) {
			this._data[key] = value;
			return this.getItem(key);
		},

        /**
         * 根据key获取值
         * @param key
         * @param defaultValue 无值时设置默认值并返回
         * @returns {*}
         */
		getItem: function (key, defaultValue) {
			if(this._data[key] === null) {
				this.setItem(key, defaultValue);
			}
			return this._data[key];
		},

		/**
         * 移除key对应的项
         * @param key
         */
		remove: function (key) {
			delete this._data[key];
		},

		/**
         * 清除当前命名空间下的所有项
         */
		clear: function() {
			this._data = {};
		},

		equal: function (otherSession) {
			if(otherSession == null) {
				return false;
			}

			return this == otherSession || (this._sessionId === otherSession.getSessionId() && 
				this._data === otherSession._data && 
				this._listenerRegistry === otherSession._listenerRegistry);
		},

		// createPageAttribute : function (key, value) {
		// 	this.setItem(key, value);
		// },

		// get: function(key, defaultValue) {
		// 	return this.getItem(key, defaultValue);
		// }

		/**
		 * 注册事件监听器
		 * @param  String name     Event name to listen on
		 * @param  {function(event, ...args)} listener Function to call when the event is emitted
		 * @return {function}          Returns a deregistration function for this listener.
		 */
		on: function (name, listener) {
			return this._listenerRegistry.on(name, listener, win);
		},

		/**
		 *  All listeners listening for name event on this scope get notified. 
		 *  Afterwards, the event traverses upwards toward the root window
		 * @param  {string} name Event name to emit.
		 * @param  {*} arg  Optional one or more arguments which will be passed onto the event listeners.
		 * @return {Object}      Event object 
		 */
		emit: function (name, arg) {
			// 将当前window对象加入参数列表中
			var args = Array.prototype.push.call(arguments, win);
			return this._listenerRegistry.emit.apply(this._listenerRegistry, arguments);
		}
	};

	//////////////////////
	// ListenerRegistry //
	//////////////////////
	function ListenerRegistry() {
		this._init();
	}

	ListenerRegistry.prototype = {
		_init: function (argument) {
			this._registry = {};
		},

		/**
		 * 注册事件监听器
		 * @param  String name     Event name to listen on
		 * @param  {function(event, ...args)} listener Function to call when the event is emitted
		 * @return {function}          Returns a deregistration function for this listener.
		 */
		on: function (name, listener) {
			if(name == null) {
				throw new Error('注册失败，未指定需要监听的事件名称');
			}

			if(typeof listener !== 'function') {
				throw new Error('注册失败，事件监听回调方法不是js方法');
			}
			return this._on(name, listener);
		},

		_on: function (name, listener, registWin)  {
			var listeners = this._getListeners(name);
			if(listeners == null) {
				listeners = [];
			}

			listeners.push({
				name: name,
				listener: listener,
				registWin: registWin
			});
			this._registry[name] = listeners;
			return listener;
		},

		_getListeners: function (name) {
			return this._registry[name];
		},

		/**
		 *  All listeners listening for name event on this scope get notified. 
		 *  Afterwards, the event traverses upwards toward the root window
		 * @param  {string} name Event name to emit.
		 * @param  {*} arg  Optional one or more arguments which will be passed onto the event listeners.
		 * @return {Object}      Event object 
		 */
		emit: function () {
			var args = Array.prototype.slice.call(arguments);
			// 根据name获取对应注册的listeners，并从参数列表中移除name
			var listeners = this._getListeners(args.shift());
			// 获取触发的窗口对象构建event对象，并从参数列表中移除触发的窗口对象
			var event = {targetWin: args.pop()};
			// 参数列表加入event对象
			args.push(event);
			if(listeners) {
				for (var i = 0; i < listeners.length; i++) {
					listeners[i].listener.apply(listeners[i].registWin, args);
				}
				return event;
			}
		}
	};

	win.getWindowSession = getWindowSession;
})(window);