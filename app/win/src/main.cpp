#include "json.hpp"
#include "xThunder.h"
#include <strsafe.h>

//////////////////////////////////////////////////////////////////////////
//
// Call external downloader by COM
// Version : 1.3.0
// Release : May 7, 2012
// Creator : agunchan
// License : MPL 1.1
//
//////////////////////////////////////////////////////////////////////////
#ifdef NDEBUG
#pragma comment( linker, "/subsystem:\"windows\" /entry:\"mainCRTStartup\"" )
#endif

// JSON for Modern C++
using json = nlohmann::json;

enum callError { ARG_ERROR = -100, COM_ERROR, INVOKE_ERROR, JOB_ERROR, DM_NONSUPPORT };
#define MB_TITLE L"xThunder"
#define BUF_SIZE 16384
#define SPACE_ASCII 32
char g_buf[BUF_SIZE];
wchar_t g_wbuf[BUF_SIZE];

wchar_t * charsTowchars(const char * coxt)
{
	const char * src = coxt;
	return src && (MultiByteToWideChar(CP_UTF8, 0, src, -1, g_wbuf, BUF_SIZE)
		|| MultiByteToWideChar(CP_ACP, 0, src, -1, g_wbuf, BUF_SIZE))
		? g_wbuf : L"";
}
template<typename T>
void readStdioToAddress(T* addr, unsigned int num) {
	char* pc = reinterpret_cast<char*>(addr);
	while (num--) {
		scanf_s("%c", pc++);
	}
}
template<typename T>
void writeStdioFromAddress(T* addr, unsigned int num) {
	char* pc = reinterpret_cast<char*>(addr);
	while (num--) {
		printf_s("%c", *(pc++));
	}
}
unsigned int receiveMessageToBuffer(char* coxt) {
	unsigned int len = 0;
	readStdioToAddress(&len, 4);
	readStdioToAddress(coxt, len);
	coxt[len] = '\0';
	return len;
}
void sendMessageFromBuffer(char* coxt) {
	unsigned int len = strlen(coxt);
	writeStdioFromAddress(&len, 4);
	writeStdioFromAddress(coxt, len);
	fflush(stdout);
}
// 相当于JS的JSON.parse
// 由于浏览器对于送往本地App的正文数据都会进行一次JSON.stringify处理
// 故此处移除纯字符串被JSON.stringify处理后两端多出的双引号字符
unsigned int unStringify(char* coxt, unsigned int len) {
	if (len >= 2 && '\"' == coxt[0] && coxt[0] == coxt[len - 1]) {
		len -= 2;
		memmove(coxt, coxt + 1, len);
		coxt[len] = '\0';
	}
	return len;
}
// 移除JSON字符串当中用于转义的字符'\'
unsigned int escapeTransfBackslash(char* coxt, unsigned int len) {
	static char buffer[BUF_SIZE];
	if (len < 1) { return len; } len--;
	int bptr = 0;
	for (int cptr = 0; cptr < len; ++cptr) {
		if ('\\' == coxt[cptr]) {
			cptr++;
		}
		buffer[bptr++] = coxt[cptr];
	}
	if (0 == len || '\\' != coxt[len - 1]) {
		buffer[bptr++] = coxt[len];
	}
	memmove(coxt, buffer, bptr);
	coxt[bptr] = '\0';
	return bptr;
}
//////////////////////////////////////////////////////////////////////////
//
// JSON Format:
//				agentName
//				totalTask
//				referrer
//				tasks
//					url       -
//					desc       \  repeat totalTask 
//					cookie     /
//					cid		  -
//
//////////////////////////////////////////////////////////////////////////
int parseDownloadInfoFromJSON(DownloadInfo & downInfo, char * jsonStr)
{
	json jComp = json::parse(jsonStr);
	downInfo.init(jComp["totalTask"].get<int>());
	strcpy(downInfo.agentName, jComp["agentName"].get<std::string>().c_str());
	downInfo.referrer = charsTowchars(jComp["referrer"].get<std::string>().c_str());

	json tasks = jComp["tasks"];
	for (int i = 0; i < downInfo.count; ++i)
	{
		downInfo.urls[i] = charsTowchars(tasks[i]["url"].get<std::string>().c_str());
		downInfo.descs[i] = charsTowchars(tasks[i]["desc"].get<std::string>().c_str());
		downInfo.cookies[i] = charsTowchars(tasks[i]["cookie"].get<std::string>().c_str());
		downInfo.cids[i] = charsTowchars(tasks[i]["cid"].get<std::string>().c_str());
	}
	return 0;
}

int main(int argc, char* argv[])
{
	// Task Arguments
	int retVal = 0;
	int count = 1;
	int sleepSec = 15;
	DownloadInfo downInfo;
	bool silent = false;

	// 接收并提取任务参数
	receiveMessageToBuffer(g_buf);
	escapeTransfBackslash(g_buf, unStringify(g_buf, strlen(g_buf)));
	parseDownloadInfoFromJSON(downInfo, g_buf);

	// 向本地Agent发送任务
	DMSupportCOM * dmAgent = DMSupportCOMFactory::Instance().getDMAgent(downInfo.agentName);
	if (dmAgent == NULL)
	{
		retVal = DM_NONSUPPORT;
	}
	else
	{
		try
		{
			retVal = dmAgent->dispatch(downInfo);
		}
		catch (_com_error& e)
		{
			if (!silent)
			{
				sprintf_s(g_buf, BUF_SIZE, "Call %s error, please check if it was properly installed!", downInfo.agentName);
				MultiByteToWideChar(CP_ACP, 0, g_buf, -1, g_wbuf, BUF_SIZE);
				MessageBox(NULL, g_wbuf, MB_TITLE, MB_OK);
			}
			retVal = COM_ERROR;
		}
		catch (...)
		{
			if (!silent)
			{
				MessageBox(NULL, L"Invoke method failure.", MB_TITLE, MB_OK);
			}
			retVal = INVOKE_ERROR;
		}

		delete dmAgent;
	}

	//Sleep for a while in case of downloader's cold start
	//This process should not be blocked by external call
	if (retVal == 0)
	{
		Sleep(1000 * sleepSec);
	}

	// 发送反馈信息，报告任务状态
	switch (retVal) {
	case 0: {
		strcpy(g_buf, "\"TASK_OK\"");
		break;
	}
	case DM_NONSUPPORT: {
		strcpy(g_buf, "\"DM_NONSUPPORT\"");
		break;
	}
	case COM_ERROR: {
		strcpy(g_buf, "\"COM_ERROR\"");
		break;
	}
	case INVOKE_ERROR: {
		strcpy(g_buf, "\"INVOKE_ERROR\"");
		break;
	}
	default:
		strcpy(g_buf, "\"UNKNOWN_ERROR\"");
	}
	sendMessageFromBuffer(g_buf);
	return 0;
}


void ErrorExit(PTSTR lpszFunction) {

// Format a readable error message, display a message box, 
// and exit from the application.
	LPVOID lpMsgBuf;
	LPVOID lpDisplayBuf;
	DWORD dw = GetLastError();

	FormatMessage(
		FORMAT_MESSAGE_ALLOCATE_BUFFER |
		FORMAT_MESSAGE_FROM_SYSTEM |
		FORMAT_MESSAGE_IGNORE_INSERTS,
		NULL,
		dw,
		MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
		(LPTSTR)&lpMsgBuf,
		0, NULL);

	lpDisplayBuf = (LPVOID)LocalAlloc(LMEM_ZEROINIT,
		(lstrlen((LPCTSTR)lpMsgBuf) + lstrlen((LPCTSTR)lpszFunction) + 40) * sizeof(TCHAR));
	StringCchPrintf((LPTSTR)lpDisplayBuf,
		LocalSize(lpDisplayBuf) / sizeof(TCHAR),
		TEXT("%s failed with error %d: %s"),
		lpszFunction, dw, lpMsgBuf);
	MessageBox(NULL, (LPCTSTR)lpDisplayBuf, TEXT("Error"), MB_OK);

	LocalFree(lpMsgBuf);
	LocalFree(lpDisplayBuf);
	ExitProcess(1);
}