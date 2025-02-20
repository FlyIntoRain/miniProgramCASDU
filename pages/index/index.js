const cloud = wx.cloud
const db = wx.cloud.database()
const dakaRecords = db.collection('daka_records')
const coupons = db.collection('coupons')

Page({
  data: {
    imageSrc: '',
    recognitionResult: null,
    calendarConfig: {
      // 日历配置，可以根据需要自定义
    },
    dakaDays: [], // 当月打卡日期
    dakaCount: 0, // 当月打卡次数
    couponQRCode: '', // 优惠券二维码
    couponInfo: '', // 优惠券文字信息
    showCoupon: false, // 是否显示优惠券弹窗
  },

  onLoad() {
    this.getDakaCalendar(); // 加载时获取当月打卡日历
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
        count:1,
        mediaType:'image',
        sourceType:'album',
        success:(res)=>{
            this.setData({
                imageSrc: res.tempFiles[0].tempFilePath,
                recognitionResult: null, // 清空上次识别结果
                couponQRCode: '', // 清空优惠券
                couponInfo: '',
                showCoupon: false,
    });
  },
})
  },

  // 上传图片并识别
  uploadAndRecognize() {
    if (!this.data.imageSrc) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none',
      });
      return;
    }
    wx.showLoading({
      title: '识别中...',
      mask: true
    });
    wx.cloud.uploadFile({
      filePath: this.data.imageSrc,
      name: 'image',
      cloudPath: `daka-images/${Date.now()}-${Math.random()}.png`, // 云存储路径，可以自定义
      success: (res) => {
        const fileID = res.fileID;
        this.recognizeImage(fileID); // 调用云函数进行识别
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('图片上传失败', err);
        wx.showToast({
          title: '图片上传失败',
          icon: 'none',
        });
      }
    })
  },

  // 调用云函数识别图片
  recognizeImage(fileID) {
    wx.cloud.callFunction({
      name: 'recognizeImage', // 云函数名，需要创建
      data: {
        fileID: fileID
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        this.setData({
          recognitionResult: res.result.data
        });
      } else {
        wx.showToast({
          title: res.result ? res.result.msg : '识别失败，请稍后重试',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('云函数识别失败', err);
      wx.showToast({
        title: '识别失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
    });
  },

  // 确认打卡
  confirmDaka() {
    if (!this.data.recognitionResult) {
      wx.showToast({
        title: '请先识别图片',
        icon: 'none',
      });
      return;
    }
    wx.showLoading({
      title: '打卡中...',
      mask: true
    });
    wx.cloud.callFunction({
      name: 'dailyDaka', // 云函数名，需要创建
      data: {
        date: this.data.recognitionResult.date,
        type: this.data.recognitionResult.type,
        mileage: this.data.recognitionResult.mileage
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({
          title: '打卡成功',
          icon: 'success',
          duration: 2000
        });
        this.setData({
          couponQRCode: res.result.couponQRCode,
          couponInfo: res.result.couponInfo,
          showCoupon: true, // 显示优惠券弹窗
          imageSrc: '', // 清空图片
          recognitionResult: null, // 清空识别结果
        });
        this.getDakaCalendar(); // 刷新日历
      } else {
        wx.showToast({
          title: res.result ? res.result.msg : '打卡失败，请稍后重试',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('云函数打卡失败', err);
      wx.showToast({
        title: '打卡失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
    });
  },

  // 获取当月打卡日历
  getDakaCalendar() {
    wx.cloud.callFunction({
      name: 'getDakaCalendar', // 云函数名，需要创建
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({
          dakaDays: res.result.dakaDays,
          dakaCount: res.result.dakaCount
        });
        this.markCalendarDays(); // 标记日历
      } else {
        console.error('获取日历数据失败', res.result ? res.result.msg : '未知错误');
      }
    }).catch(err => {
      console.error('云函数获取日历数据失败', err);
    });
  },

  // 标记日历打卡日期 (需要集成日历组件，这里是示例，具体标记方法取决于你使用的日历组件)
  markCalendarDays() {
    // 示例：假设你使用了 vant-weapp 的 calendar 组件，你需要找到对应的方法来标记日期
    // 如果你使用自定义日历组件，需要根据组件的API进行标记
    // 这里只是一个占位符，你需要根据实际使用的日历组件进行调整
    console.log('需要根据你使用的日历组件实现日期标记', this.data.dakaDays);
    // 例如，如果是 vant-weapp calendar，可能需要使用 `calendar.markDate` 方法
    // 具体请参考 vant-weapp calendar 组件的文档
  },

  // 关闭优惠券弹窗
  closeCouponPopup() {
    this.setData({
      showCoupon: false,
      couponQRCode: '',
      couponInfo: '',
    });
  },

  // 保存优惠券二维码
  saveCouponQRCode() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.couponQRCode,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500,
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '保存失败',
          icon: 'none',
          duration: 1500,
        });
        console.error('保存二维码失败', err);
      }
    });
  },
});