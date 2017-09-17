const DM = window.document;
const Flag = "ThunderAPIHelper"; // 固定为插件名称
const Msg = "beacon-for-building-thunder-tasks";

// Thunder API
var ThunderAPIProvider = {
  callAddTask: function(evt) {
    var hrefs = evt.target.getAttribute("hrefs");
    if (!hrefs) {
      alert("资源链接不存在..");
      return;
    }
    // 获取资源链接列表
    var links = JSON.parse(hrefs);
    // 调用下载
    ThunderKit.apiDownUrl('',links,'Thunder');
  },
};

// 初始化
(function () {
	// 添加事件监听
	DM.addEventListener(Msg, function(e) { ThunderAPIProvider.callAddTask(e); }, false, true);
	// 设置Addon版本标签（用于页面检测插件存在）
	if (0 == DM.querySelectorAll(Flag).length) {
		var flag = DM.createElement(Flag);
    flag.style['display'] = 'none';
    flag.innerHTML = Msg;
		DM.documentElement.appendChild(flag);
	}
})();


// 示例：检测插件安装并获取通信信标
// var checkExtInstalled = function () {
//   var ths = window.document.querySelectorAll("ThunderAPIHelper");
//   if (0 == ths.length) {
//     return false;
//   }
//   return true, ths[0].innerHTML;
// };