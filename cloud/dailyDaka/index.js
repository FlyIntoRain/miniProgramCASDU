const cloud = require('wx-server-sdk')
const dayjs = require('dayjs') // 引入 dayjs 库处理日期，需要先安装 npm install dayjs
const uuid = require('uuid') // 引入 uuid 库生成唯一ID，需要先安装 npm install uuid

cloud.init()
const db = cloud.database()
const dakaRecords = db.collection('daka_records')
const coupons = db.collection('coupons')

exports.main = async (event, context) => {
  try {
    const { date, type, mileage } = event;
    const wxContext = cloud.getWXContext()
    const userId = wxContext.OPENID;
    const todayDate = dayjs().format('YYYY-MM-DD'); // 获取今天的日期

    // 检查今日是否已打卡
    const existingRecord = await dakaRecords.where({
      userId: userId,
      date: todayDate
    }).get()

    if (existingRecord.data.length > 0) {
      return {
        success: false,
        msg: '今日已打卡，请勿重复打卡'
      };
    }

    // 生成优惠券码 (使用 UUID)
    const couponCode = uuid.v4();

    // 保存打卡记录
    await dakaRecords.add({
      data: {
        userId: userId,
        date: todayDate,
        type: type,
        mileage: mileage,
        timestamp: db.serverDate() // 使用服务器时间
      }
    })

    // 保存优惠券信息
    await coupons.add({
      data: {
        couponCode: couponCode,
        userId: userId,
        dateGenerated: todayDate,
        expiryDate: todayDate, // 当天过期
        discountDetails: '88折优惠券', // 优惠券详情，可以根据需要修改
        status: '未使用' // 初始状态为未使用
      }
    })

    // 生成优惠券二维码 (需要使用云函数生成小程序码或二维码，这里返回一个示例链接)
    const couponQRCodeLink = `weixin://dl/business/?t= *YOUR_COUPON_LINK_OR_MINI_PROGRAM_PAGE* &couponCode=${couponCode}`; //  *YOUR_COUPON_LINK_OR_MINI_PROGRAM_PAGE*  需要替换成你的小程序优惠券展示页面路径或店铺链接

    return {
      success: true,
      couponQRCode: couponQRCodeLink, // 返回优惠券二维码链接 (示例)
      couponInfo: '恭喜您获得88折优惠券，仅限今日使用！', // 优惠券文字信息
      msg: '打卡成功并生成优惠券'
    };

  } catch (err) {
    console.error('每日打卡云函数错误', err);
    return {
      success: false,
      msg: '打卡失败',
      error: err
    };
  }
}