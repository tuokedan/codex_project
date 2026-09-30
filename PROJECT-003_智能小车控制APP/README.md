# 智能小车控制 APP

- 项目编号：PROJECT-003
- 创建日期：2026-09-24
- 项目描述：通过 OneNET 控制接入 ESP8266-01S 的智能小车，支持手动驾驶、三级速度和自动模式。
- 技术栈：HBuilderX、uni-app、Vue 2、OneNET HTTP REST API、设备侧 MQTT
- 状态：🟡 开发中

## 参考工程

实际找到的参考工程路径为：`E:\demo_onenet\智能电饭煲3\APP_dianfanbao3`。用户消息中的 `E:\demo\_onenet\智能电饭煲3\APP\_dianfanbao3` 在当前文件系统不存在。

参考工程的 APP 通过 OneNET REST API 读写设备属性，STM32/ESP8266 设备侧通过 MQTT 订阅 OneNET 属性下发主题。这种链路已在本项目中保留。

## 使用前必须配置

编辑 `iotConfig.js`，填写小车自己的 OneNET 参数：

- `author_key`：OneNET 用户级授权密钥
- `user_id`：OneNET 用户 ID
- `product_id`：小车产品 ID
- `device_name`：小车设备名

不要把电饭煲工程中的 `author_key`、产品 ID 或设备名直接用于小车。

## 默认属性协议

APP 使用 `thingmodel/set-device-property` 写入以下属性，属性名和编码集中在 `iotConfig.js`，若单片机端使用数字枚举，只需修改配置，不必改页面逻辑。

```json
{
  "mode": "manual",
  "auto": false,
  "direction": "forward",
  "speed": 2
}
```

方向值：`stop`、`forward`、`backward`、`left`、`right`；速度值：`1`、`2`、`3`；模式值：`manual`、`auto`。

设备侧 MQTT 仍需订阅：`$sys/{product_id}/{device_name}/thing/property/set`，并在 MCU 中解析上述 `params` 字段。APP 不能替代 MCU 端的 MQTT 解析和电机驱动。

## HBuilderX

在 HBuilderX 中选择“打开目录”，打开本目录即可。可先运行到浏览器检查界面，再使用“发行 → 原生 App-云打包”生成 Android APK。

## 当前验证范围

已完成静态工程、界面状态切换、REST 请求封装和配置校验。由于未提供小车 OneNET 产品/设备参数，也没有连接真实设备，当前不能证明云端下发和电机动作已经联调成功。
