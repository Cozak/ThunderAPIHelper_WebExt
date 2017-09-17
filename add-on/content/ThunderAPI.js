var ThunderPref = {
    uriSupReg : /^(?:ftp|https?):/i,
    proSupReg : /^(?:thunder|flashget|qqdl|fs2you|ed2k|magnet):/i,
    invalidReg : /^(?:javascript|data|mailto):/i,
};

var ThunderKit = {
    ARG_DEF_STR : "",
    agentName : "",
    referrer : "",
    tasks: [
        // { // 每个任务参数配置
        //     url: ...,
        //     cookie: ...,
        //     desc: ...,
        //     cid: ...,
        // },...
    ],
    totalTask : 0,

    //// ====================================== 后台协议通信 ======================================
    TASK_ID_BUILDTASK : 1001,
    TASK_ID_QUERYCOOKIES : 1002,
    // 根据功能需求构建协议包
    buildMsgToBK : function(tid, msg) {
        var pkg = {
                    tid : tid, // 识别数据包用途
                    msg : msg
                  };
        return pkg;
    },
    // 向后台推送消息
    postMsgToBK : function(pkg, respHandler, errHandler) {
        var sending = browser.runtime.sendMessage(pkg);
        sending.then(respHandler, errHandler);
    },
    //// ====================================== 任务参数处理 ======================================
    getCookie : function(href, callback){
        var serializeCookie = function(cookie) {
            return cookie.reduce((result, ck)=>{
                result+=ck.name+"="+ck.value+"; "
                return result;
            },"").trim();
        };
        var respHandler = function(cookie) {
            callback(cookie?serializeCookie(cookie):this.ARG_DEF_STR);
        }.bind(this);
        var errHandler = function(err) {
            console.error("[ThunderAPIHelper]content-to-background: ",err);
            callback(this.ARG_DEF_STR);
        }.bind(this);
        this.postMsgToBK(this.buildMsgToBK(this.TASK_ID_QUERYCOOKIES, href), respHandler, errHandler);
    },
    getFileName : function(href) {
        var fileName = "index.html";
        try {
            var matches;
            if (ThunderPref.uriSupReg.test(href)) {
                var names = href.split("?")[0].split("#")[0].split("/");
                fileName = names[names.length-1];
                if (fileName != "") {
                    fileName = decodeURIComponent(fileName);
                }
            } else if(matches = href.match(/^ed2k:\/\/\|file\|(.*?)\|\d/)) {
                fileName = decodeURIComponent(matches[1]);
            } else {
                fileName = href.split(":")[0];
            }
        } catch(ex) {
            console.error("[ThunderAPIHelper]getFileName: ",ex);
        }
        return fileName;
    },
    // 获取当前用户端ID，即ClientID
    getCid : function(href, agentName) {
        var cid = this.ARG_DEF_STR;
        if (agentName.indexOf("Thunder") != -1) {
            var matches;
            if (matches = href.match(/^http:\/\/(?:thunder\.ffdy\.cc|www\.7369\.com|bt\.2tu\.cc)\/([0-9A-F]+)\//)) {
                cid = matches[1];
            } else if(matches = href.match(/^http:\/\/ggxxxzzz.com.*\?cid=(.*)/)) {
                cid = matches[1];
            }
        }
        return cid;
    },
    // ============================================== 异步工具 ==================================================
    sequenceTask : function (tasks) {
        return tasks.reduce(function (promise, task) {
            return promise.then(task);
        }, Promise.resolve());
    },
    //// ====================================== 主流程 ======================================
    init : function(referrer, totalTask, agentName) {
        this.referrer = referrer || this.ARG_DEF_STR;
        this.tasks = [],
        this.totalTask = totalTask;
        if (!agentName) {
            agentName = "Thunder"; // default agent
        }
        this.agentName = agentName;
    },
    prepareTasks : function(urls, callback) {
        var that = this;
        var prepareTask = function(url) {
            return new Promise(function (resolve, reject) {
                // 排除无效链接
                if (url == "" || ThunderPref.invalidReg.test(url)) {
                    // Invalid url
                    url = that.referrer;
                }
                // 获取必要参数，只有cookie需要异步获取
                var readyTask = function(cookie) {
                    resolve({
                        url: url,
                        cookie: cookie,
                        desc: that.getFileName(url),
                        cid: that.getCid(url, that.agentName),
                    }); // 触发chain后续行为
                } 
                that.getCookie(url, readyTask);
            });
        };
        // 构建异步任务组
        var tasks = [];
        for (idx in urls) {
            tasks.push(prepareTask(urls[idx]));
        }
        Promise.all(tasks).then(function(tasklist){
            that.tasks = tasklist;
            callback();
        }).catch(function(err) {
            console.error("[ThunderAPIHelper]prepareTasks: ",err);
        });
    },
    callAgent : function() {   

        if (0 >= this.totalTask) {
            return false;
        }
        this.totalTask = this.tasks.length;

        var taskinfo = {
                        agentName: this.agentName,
                        totalTask: this.totalTask,
                        referrer: this.referrer,
                        tasks: this.tasks,
                       };
        // 获取反馈确认所需的底层配件是否正常
        var handleResponse = function(msg) {
            console.error('[ThunderAPIHelper]task response: ',msg);
        };
        var handleError = function(err) {
            console.error('[ThunderAPIHelper]content-to-background: ',err); // 捕获通信及后台任务执行异常
        };
        this.postMsgToBK(this.buildMsgToBK(this.TASK_ID_BUILDTASK,taskinfo),
                            handleResponse,handleError);

        // Clear array to free memory
        this.tasks.length = this.totalTask = 0;
    },

    //// ====================================== 开放接口 ======================================
    // referrer : referrer page[required]
    // url : array of url or single url[required]
    // agentName : agent name[optional]
    // offLine: whether use offline download[optional]
    // RETURN - whether download successfully
    apiDownUrl : function(referrer, urls, agentName) {
        if (Object.prototype.toString.call(urls) !== '[object Array]') {
            console.error("[ThunderAPIHelper]apiDownUrl: urls must be [object Array]");
            return;
        }
        var totalTask = urls.length;
        this.init(referrer, totalTask, agentName);
        var that =  this;
        this.prepareTasks(urls, function() {
            that.callAgent();
        });
    },
};
