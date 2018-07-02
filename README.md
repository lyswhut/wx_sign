# WX_Sign
基于koa2 + mongodb的微信公众号签到系统

## 技术栈
- ES6
- Node.js
- MongoDB

## 主要框架
- koa2
- mongoose
- pug

## 安装(Installation)

### 环境需求
- `Node.js` (version：7+)
- `MongoDB` (version：3.x)

### 项目部署
```
git clone https://github.com/lyswhut/wx_sign.git
cd wx_sign
npm install
```

然后你还要把`config/config.js`里的内容换成你的，主要配置：
- `MongoDB`的链接地址
- 微信密钥
- 服务器地址


最后再执行\
`npm start` 
or\
`pm2 start pm2.config.json --env production`\
即可起飞！

注：`npm start`是以开发模式运行，\
`pm2 start pm2.config.json --env production`需要安装`pm2`才能用该命令，该命令是以生产模式运行。\
关于`pm2`的使用方法请自行百度 or Google\
有问题请到 issues 提问，cheers :beers: !

## LICENSE
MIT
