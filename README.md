# 事事通校园配送系统联网版

这是独立于当前单机稳定版的新联网版雏形，第一阶段只做洗护业务。

## 当前已包含

- Supabase 员工登录
- Excel 导入订单
- 自动生成订单、物品、水洗标
- 配送员取件任务
- 工厂扫码入库、扫码出库
- 出库后自动生成送回任务
- 学生输入手机号查询进度

## Supabase 初始化

1. 创建 Supabase 项目。
2. 打开 SQL Editor。
3. 完整执行 `supabase-schema.sql`。
4. 到 Authentication 创建员工账号。
5. 到 Table Editor 的 `profiles` 表新增员工资料：

| 字段 | 示例 |
| --- | --- |
| id | 选择 Authentication 用户的 id |
| name | 张三 |
| phone | 15599157072 |
| role | admin / courier / factory |

## 前端配置

打开 `index.html` 后，在左侧填写：

- Project URL
- anon key

保存后再用员工邮箱密码登录。

## 部署

可以把 `shitong-cloud-app` 目录作为一个独立 GitHub Pages 站点发布。

摄像头扫码需要 HTTPS，所以本地 `file://` 页面可能无法打开手机摄像头；上线到 GitHub Pages 后会更稳定。

## 注意

这是联网版第一版骨架，用来验证真实业务流程。当前稳定可投入使用的单机版已隔离，不受这个目录影响。
