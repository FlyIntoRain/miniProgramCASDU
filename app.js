// app.js
App({
    globalData: {
      userInfo: null,
      openid: ''
    },
    onLaunch() {
      wx.cloud.init({
        env: 'zqfzqf-7gzmp388a9bd00b2',
        traceUser: true
      })
    }
  })
