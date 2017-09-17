var ThunderService = {
    AppPort: null,
    ERR_OK: 0,
    // ================================== Content-Background 通信包协议 ============================================
    TASK_ID_BUILDTASK : 1001,
    TASK_ID_QUERYCOOKIES : 1002,
    // 根据功能需求构建协议包
    // buildMsgToBK : function(tid, msg) {
    //     var pkg = {
    //                 tid : tid,
    //                 msg : msg
    //               };
    //     return pkg;
    // },
    // =============================================== 主流程 ====================================================
	listenContentRequest: function(request, sender, sendResponse) {
        var that = this;
        switch (request.tid) {
            case this.TASK_ID_BUILDTASK: {
                return new Promise(function(resolve, reject){
                    this.processTask(request.msg, resolve);
                }.bind(this));
            }
            case this.TASK_ID_QUERYCOOKIES: {
                // 查询cookie并返回
                // Version A (may be deprecated someday)
                // that.queryCookies(request.msg, function(cookies) {
                //     console.error("call sendResponse...");
                //     sendResponse(cookies);
                // });
                // return true;
                // Version B
                return new Promise(function (resolve, reject) {
                    that.queryCookies(request.msg, resolve);
                });
            }
        }
    },
    // 查询指定href的cookie
    queryCookies: function(href, callback) {
        var gettingAllCookies = browser.cookies.getAll({url: href});
        gettingAllCookies.then(function(cookies) {
            callback(cookies);
        });
    },
    // 加工任务链接并启动下载
    processTask: function(taskinfo, callback) {
        var sending = browser.runtime.sendNativeMessage("xThunder", JSON.stringify(taskinfo));
        sending.then(function (resp) {
            console.error('[ThunderAPIHelper]Received: ',resp);    
            callback(resp);
        }, function (err) {
            console.error('[ThunderAPIHelper]onNativeAppError: ',err);    
            callback(err)
        });
    }
};

// 设置监听
browser.runtime.onMessage.addListener(ThunderService.listenContentRequest.bind(ThunderService));