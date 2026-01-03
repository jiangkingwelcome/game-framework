### 游戏配置数据生成 + 数据对象代码生成器插件

![Cocos Creator 3x 配套游戏配置数据生成  数据对象代码生成器插件](https://gitee.com/dgflash/oops-plugin-excel-to-json/raw/master/doc/1.png)

<br/>

<br/>

### Cocos Creator 3.x 配置Excel文件目录、配置Json数据输出目录、配置脚本输出目录

![Cocos Creator 3x 配置Excel文件目录、配置Json数据输出目录、配置脚本输出目录](https://gitee.com/dgflash/oops-plugin-excel-to-json/raw/master/doc/2.png)

<br/>

<br/>

### Cocos Creator 3.x 扩展 -> Oops-Framework --> Excel To Json

![Cocos Creator 3x 扩展  OopsFramework Excel To Json](https://gitee.com/dgflash/oops-plugin-excel-to-json/raw/master/doc/3.png)

> 注： 最新版本在菜单栏：Oops-framework --> 框架工具 --> Excel转Json与Ts

<br/>

<br/>

### Cocos Creator 3.x 生成数据资源与脚本资源

![Cocos Creator 3x 生成数据资源与脚本资源，减少编码工作](https://gitee.com/dgflash/oops-plugin-excel-to-json/raw/master/doc/4.png)

工具指向策划配置表目录后，每次更新配置时，一键生成数据与静态配置表代码，在项目中后期平凡维护修改时，提高开发效率。

<br/>

<br/>

### Excel中数据规则

- Excel中前五行为工具规则数据
- 第一行为字段中文名
- 第二行为字段英文名，会生成为json数据的字段名
- 第三行为字段数据类型，支持`number`、`string`、`any`类型
- 第四行标记输出服务器数据时，是否存在这个字段`server`为显示字段，`server_no`为删除字段
- 第五行标记输出客户端数据时，是否存在这个字段`client`为显示字段，`client_no`为删除字段

示例：

| 编号【KEY】 | 职业名 | 武器类型 | 力量  | 敏捷  |
| --- | --- | --- | --- | --- |
| **id** | **armsName** | **weaponType** | **power** | **agile** |
| **int** | **string** | **any** | **int** | **int** |
| **serve_no** | **serve_no** | **serve_no** | **serve_no** | **serve_no** |
| **client** | **client** | **client** | **client** | **client** |
| 1   | 剑客  | [1] | 8   | 2   |
| 5   | 刺客  | [10,11,12] | 5   | 10  |
| 9   | 长弓手 | [5] | 5   | 8   |

关于类型相关，注意：

一、`number` 类型主要代表的是 `int` 和 `float` 类型,

二、any 类型主要指的是数组和对象相关，配置样式如下：

```typescript
// right
[1, 2, 3]
[[1,2,3], [4,5,6]]
{"a": 1}
{"a": 1, "b": "abc"}
```