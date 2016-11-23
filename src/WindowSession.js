(function (win) {
	function WindowSession(sessionId) {
		this._sessionId = sessionId;
		this._pageSeesion = {};
		win[sessionId] = this;
	}

	WindowSession.prototype = {
		/**
         * 设置值到session
         * @param key
         * @param value
         */
		setItem: function (key, value) {
			this._pageSeesion[key] = value;
		},

        /**
         * 根据key获取值
         * @param key
         * @param defaultValue 无值时设置默认值并返回
         * @returns {*}
         */
		getItem: function (key, defaultValue) {
			if(this._pageSeesion[key] == null) {
				this.setItem(key, defaultValue);
			}
			return this._pageSeesion[key];
		},

		/**
         * 移除key对应的项
         * @param key
         */
		remove: function (key) {
			delete this._pageSeesion[key];
		},

		/**
         * 清除当前命名空间下的所有项
         */
		clear: function() {
			this._pageSeesion = {};
		},

		createPageAttribute : function (key, value) {
			this.setItem(key, value);
		},

		get: function(key, defaultValue) {
			return this.getItem(key, defaultValue);
		}

	};

	win.WindowSession = WindowSession;
})(window);