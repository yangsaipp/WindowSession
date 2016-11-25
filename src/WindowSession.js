(function (win) {

	/**
	 * 根据给定的sessionId获取WindowSession对象。
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
		var currentWin = win;
		var childWin = null;
		do {
			if(currentWin[getVariableName(sessionId)] instanceof WindowSession) {
				return currentWin[getVariableName(sessionId)];
			} else {
				childWin = currentWin;
				currentWin = currentWin.opener || currentWin.parent;
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

	function WindowSession(sessionId) {
		if(sessionId){
			this._sessionId = sessionId;
		}else {
			this._sessionId = uuid();
		}
		this._init();
	}

	/**
	 * 获取WindowSession对象存放在window对象下的变量名
	 * @param  {string} sessionId
	 * @return {string} WindowSession对象存放在window对象下的变量名
	 */
	function getVariableName(sessionId) {
		return 'window-seesion-' + sessionId
	}

	WindowSession.prototype = {

		_init: function () {
			// 用于存放不同window之间要访问的数据
			this._data = {};
			// 用于存放各个window中注册的监听器
			this._listenerRegistry = new ListenerRegistry();

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
         */
		setItem: function (key, value) {
			this._data[key] = value;
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
			return this._registry.on(name, listener);
		},

		/**
		 *  All listeners listening for name event on this scope get notified. 
		 *  Afterwards, the event traverses upwards toward the root window
		 * @param  {string} name Event name to emit.
		 * @param  {*} arg  Optional one or more arguments which will be passed onto the event listeners.
		 * @return {Object}      Event object 
		 */
		emit: function (name, arg) {
			return this._registry.emit(name, arg);
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

		_on: function (name, listener)  {
			var listeners = this._getListeners(name);
			if(listeners == null) {
				listeners = [];
			}

			listeners.push({
				name: name,
				listener: listener,
				registWin: window
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
		emit: function (name, arg) {
			
		}
	};

	win.getWindowSession = getWindowSession;
})(window);