const cloud = require('wx-server-sdk')
const dayjs = require('dayjs')

cloud.init()
const db = cloud.database()
const dakaRecords = db.collection('daka_records')

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const userId = wxContext.OPENID;
    const currentDate = dayjs();
    const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD');
    const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD');

    const dakaList = await dakaRecords.where({
      userId: userId,
      date: db.command.gte(startOfMonth).and(db.command.lte(endOfMonth)) // 查询当月打卡记录
    }).get()

    const dakaDays = dakaList.data.map(record => dayjs(record.date).date()); // 提取打卡日期 (日)
    const dakaCount = dakaList.data.length;

    return {
      success: true,
      dakaDays: dakaDays,
      dakaCount: dakaCount,
      msg: '获取日历数据成功'
    };

  } catch (err) {
    console.error('获取日历数据云函数错误', err);
    return {
      success: false,
      msg: '获取日历数据失败',
      error: err
    };
  }
}