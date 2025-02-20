const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const coupons = db.collection('coupons')

exports.main = async (event, context) => {
  try {
    const { couponCode } = event;
    const todayDate = new Date();
    const todayDateString = todayDate.toISOString().slice(0, 10); // YYYY-MM-DD 格式

    const couponRecord = await coupons.where({
      couponCode: couponCode
    }).get()

    if (couponRecord.data.length === 0) {
      return {
        success: false,
        msg: '优惠券不存在'
      };
    }

    const coupon = couponRecord.data[0];

    if (coupon.status === '已使用') {
      return {
        success: false,
        msg: '优惠券已被使用'
      };
    }

    if (coupon.expiryDate < todayDateString) { // 比较日期字符串
      return {
        success: false,
        msg: '优惠券已过期'
      };
    }

    // 更新优惠券状态为已使用
    await coupons.doc(coupon._id).update({
      data: {
        status: '已使用'
      }
    })

    return {
      success: true,
      msg: '优惠券核销成功',
      couponDetails: {
        discountDetails: coupon.discountDetails, // 返回优惠券详情给店员端展示
        expiryDate: coupon.expiryDate
      }
    };

  } catch (err) {
    console.error('核销优惠券云函数错误', err);
    return {
      success: false,
      msg: '优惠券核销失败',
      error: err
    };
  }
}