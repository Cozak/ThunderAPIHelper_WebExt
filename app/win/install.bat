rem 定义变量延迟环境，关闭回显
@echo off&setlocal enabledelayedexpansion
rem 读取xThunder_Temp.json所有内容
for /f "eol=* tokens=*" %%i in (xThunder_Temp.json) do (
rem 设置变量a为每行内容
set a=%%i
rem 如果该行有__PATH__，则将其改为当前路径
set "a=!a:__PATH__=%~dp0!"
set "a=!a:\=\\!"
rem 把修改后的全部行存入$
echo !a!>>$)
rem 用$的内容生成xThunder.json内容
move $ xThunder.json


rem 注册xThunder.json
REG ADD "HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\xThunder" /ve /d "%~dp0xThunder.json" /f