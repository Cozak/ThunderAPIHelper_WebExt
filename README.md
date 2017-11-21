# 简述

  基于Firefox提供的WebExtensions API构建的新版ThunderAPIHelper，适用于Firefox 50+以上版本
    
   该扩展能提供用于构建迅雷任务的JS API，目前与[油猴子脚本](https://greasyfork.org/zh-CN/scripts/28050-115%E6%89%B9%E9%87%8F%E6%96%87%E4%BB%B6%E8%BF%85%E9%9B%B7%E4%B8%8B%E8%BD%BD-%E6%9A%82%E4%B8%8D%E6%94%AF%E6%8C%81%E6%96%87%E4%BB%B6%E5%A4%B9%E7%B1%BB%E5%9E%8B%E4%B8%8B%E8%BD%BD "Markdown")搭配使用
   
   *由于当前扩展未提交火狐官方进行验证，所以仅作为WebExtensions NativeMessaging开发样例进行试用*
    
# 安装
    
  安装分为两部分（扩展本身与NativeApp相对独立）：
    
  1）安装ThunderAPIHelper扩展（add-on文件夹），具体步骤参见[MDN](https://developer.mozilla.org/zh-CN/Add-ons/WebExtensions/Temporary_Installation_in_Firefox "Markdown")（未发布的扩展只能采用临时安装，借助about:debugging）
  
  
  2）安装附带的Native App（app文件夹），将app文件夹下载至一个稳定的目录（扩展的正常工作依赖NativeApp），  
     然后根据系统类型选择：
    
>Windows（目前仅支持该系统）
>>运行install.bat即可完成安装（uninstall.bat则用于卸载）
  
  
  
  PS：如果是直接下载ZIP包，那么对于Windows用户会存在bat文件命令文本解析不正常的问题，需要将bat文件的回车缩进风格从Unix(LF)改为Windows(CRLF)，具体操作请参照[这里](http://www.cuixinjiang.cn/wzzhizuo/784.html)
