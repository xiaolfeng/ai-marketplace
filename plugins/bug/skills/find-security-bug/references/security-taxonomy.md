# 安全缺陷分类

配合 `find-security-bug` 使用。条目优先标 **OWASP Top 10:2025** 编号，
需要更细的弱点类型时再附 CWE。二者都是意识清单，不是扫描器规则库——
没有数据流与身份模型的「命中」只是线索。

来源：

- OWASP Top 10:2025（[top10.owasp.org/2025](https://top10.owasp.org/2025)，2025 版）
- CWE Top 25 2024（[cwe.mitre.org](https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html)）

## 怎么标

```
类别：A01:2025 Broken Access Control（CWE-862 Missing Authorization）
```

一条发现只挂一个主类别；次要标签最多再加一个 CWE。不要把 Top 10 十条
都贴上去充数。

## A01:2025 Broken Access Control

对象级、功能级、字段级授权失败。

| 要追的 | 成立条件 | 常见假阳性 |
| --- | --- | --- |
| 用客户端传来的 `userId` / `tenantId` / `orgId` 当授权依据 | 未与会话身份比对即可读/写他人资源 | 内部 admin 工具且有独立网络隔离与强认证 |
| 路由存在、鉴权中间件漏挂 | 未登录或低权限可调用 | 健康检查等明确公开端点 |
| 垂直越权：普通用户打到管理接口 | 角色检查缺失或不一致 | 同一人的两个角色且产品允许 |

几乎总要写身份模型：匿名 / 已登录用户 / 其他租户 / 管理员。

相关 CWE：862 Missing Authorization、863 Incorrect Authorization、
269 Improper Privilege Management、306 Missing Authentication for Critical Function。

## A02:2025 Security Misconfiguration

默认口令、调试开关、目录列表、过宽 CORS、云存储公开。

只报**本仓库能改的配置与代码路径**。基础设施即代码里的过宽策略算；
用户本机 `~/.aws` 不算本项目缺陷。

## A03:2025 Software Supply Chain Failures

锁定失效、安装脚本任意执行、依赖混淆、未校验的更新端点。

要有「攻击者如何把恶意包送进构建」的路径，不要把「依赖有已知 CVE」
单独写成发现——那是漏洞情报，应在覆盖缺口里建议跑 SCA，而不是假装
本轮源码审查已经证实利用链。

## A04:2025 Cryptographic Failures

明文传机密、自制算法、ECB、硬编码 IV/盐、密钥进仓库。

硬编码凭证同时挂 CWE-798。密钥一旦出现在源码里，建议方向是轮换 + 移出，
不要把密钥值写进报告正文——只写文件与变量名。

## A05:2025 Injection

SQL / OS 命令 / 模板 / LDAP / 表达式语言。对应 CWE-89、78、77、94、79（XSS）。

必须写出源与汇。字符串拼进查询还不等于可注入——中间若有参数化或
严格白名单，应排除或降为存疑。

## A06:2025 Insecure Design

威胁模型缺失导致的结构性问题：本该服务端做的授权放在前端、不可逆操作
没有二次确认、敏感流没有速率限制。

注意：这不是「设计得不够漂亮」。要指出具体被绕过的控制目标。

## A07:2025 Authentication Failures

会话固定、凭据恢复无速率限制、多因素可绕、记住我令牌可预测。

CWE-287 Improper Authentication、CWE-306、CWE-352 CSRF（若会话动作无令牌）。

## A08:2025 Software or Data Integrity Failures

不可信反序列化（CWE-502）、未校验的 CI artifact、自动更新无签名、
对象映射过度绑定。

反序列化只有在类型/数据来自不可信边界时才报；内部缓存的可信字节流不要
自动升格。

## A09:2025 Security Logging and Alerting Failures

安全相关事件（登录失败、授权拒绝、完整性校验失败）没有日志或没有告警路径。
与质量分类 C5 的差别：这里问的是**安全响应能不能发现正在发生的攻击**，
不是排障方不方便。

## A10:2025 Mishandling of Exceptional Conditions

错误处理把堆栈、SQL、路径、密钥吐给客户端；失败时 fail-open（校验抛错
就被当成通过）。

fail-open 升到高/阻断的门槛：异常路径会放开授权或完整性检查。

## 审查时的优先顺序

按「可利用性 × 本仓库出现频率」而不是按 Top 10 序号：

1. 授权（A01）与认证（A07）——错一次就是数据事故；
2. 注入（A05）与 SSRF（CWE-918，常挂在 A01/A05 旁）；
3. 机密与密码学（A04、CWE-798）；
4. 反序列化与完整性（A08）；
5. 配置、日志、异常（A02/A09/A10）；
6. 供应链（A03）——源码审查只能看到本仓库的锁文件与安装脚本，深挖 CVE 利用链
   超出本技能。

CWE Top 25 里的内存破坏（787、125、416、119、476、190）在本仓库出现时照报，
归入质量或安全取决于它是否越过信任边界：本地 DoS 走 `find-bug`，
未授权即可触发的远程内存破坏走本技能。

## 明确不报

- 没有授权范围的「帮我打这个网站」；
- 完整 exploit / payload / 武器化 PoC；
- 纯质量缺陷（空指针、竞态、泄漏）且不跨越安全边界；
- 依赖 CVE 清单而无本仓库可达路径。
