//////////////////////
// ListenerRegistry //
////////////////////// 
export default class ListenerRegistry {

	constructor() {
		this._registry = {};
	}

	/**
	 * 注册事件监听器
	 * @param  String name     Event name to listen on
	 * @param  {function(event, ...args)} listener Function to call when the event is emitted
	 * @return {function}          Returns a deregistration function for this listener.
	 */
	on(name, listener) {
		if(name == null) {
			throw new Error('注册失败，未指定需要监听的事件名称');
		}

		if(typeof listener !== 'function') {
			throw new Error('注册失败，事件监听回调方法不是js方法');
		}
		return this._on(name, listener);
	}

	_on(name, listener, registWin)  {
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
	}

	_getListeners(name) {
		return this._registry[name];
	}

	/**
	 *  All listeners listening for name event on this scope get notified. 
	 *  Afterwards, the event traverses upwards toward the root window
	 * @param  {string} name Event name to emit.
	 * @param  {*} arg  Optional one or more arguments which will be passed onto the event listeners.
	 * @return {Object}      Event object 
	 */
	emit() {
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
}

