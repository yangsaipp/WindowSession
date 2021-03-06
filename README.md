# WindowSession
WindowSession主要用于浏览器window之间数据共享以及事件监听调用。

# 使用说明
- 引入WindowSession.js
```javascript
<script src="../src/WindowSession.js"></script>
```
- 构建windowsession对象(顶层的窗口中)
```javascript
// 获取session对象
var session = window.getWindowSession();

// 得到sessionId，其他窗口需要通过sessionId来构建WindowSession对象
var sessionId = session.getSessionId();

// 设置数据用于其他window对象方访问
session.setItem("myData", "hello");

// 增加window监听事件用于响应其他窗口
session.on("say", function(data) {
	console.log(data);
});

```
- 使用windowsession对象(其他子窗口中)
```javascript
// 得到sessionId
var sessionId = param('sessionId');

// 得到windowsession对象
var session = window.getWindowSession(sessionId);

session.getItem('myData');

session.emit('say', 'hello');

```
可以参考[DEMO](demo/main.html "DEMO")

# 环境搭建

安装gulp-cli 
```
npm install gulpjs/gulp-cli -g 
```

安装npm相关依赖  
```
npm install
```

开发环境启动任务（用于开发）
```
gulp dev
```

demo环境启动任务（用于启动demo服务展示demo页面）
```
gulp demo
```

构建任务（用于输出js文件，以便在自己项目中使用）
```
gulp build
```