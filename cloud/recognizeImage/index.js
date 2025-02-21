const cloud = require('wx-server-sdk');
cloud.init();

// 引入腾讯云 OCR SDK
const tencentcloud = require("tencentcloud-sdk-nodejs");
const OcrClient = tencentcloud.ocr.v20181119.Client;

exports.main = async (event, context) => {
  try {
    const { fileID } = event;
    
    // 获取临时图片 URL
    const fileRes = await cloud.getTempFileURL({ fileList: [fileID] });
    if (fileRes.fileList[0].status !== 0) {
      throw new Error(`获取临时链接失败: ${fileRes.fileList[0].errMsg}`);
    }
    const imageUrl = fileRes.fileList[0].tempFileURL;

    // 初始化腾讯云 OCR 客户端
    const client = new OcrClient({
      credential: {
        secretId: process.env.TENCENT_SECRET_ID,
        secretKey: process.env.TENCENT_SECRET_KEY,
      },
      region: "ap-guangzhou", // 根据实际情况选择地域
      profile: { httpProfile: { endpoint: "ocr.tencentcloudapi.com" } },
    });

    // 调用通用文字识别接口
    const ocrParams = { ImageUrl: imageUrl };
    const ocrRes = await client.GeneralBasicOCR(ocrParams);
    
    // 提取识别文本（合并所有文字）
    const textArray = ocrRes.TextDetections.map(item => item.DetectedText);
    const fullText = textArray.join('\n');
    console.log('信息',fullText)
    // 解析目标信息 (根据你的需求定制正则表达式)
    const date = extractDate(fullText);
    const type = extractType(fullText);
    const mileage = extractMileage(fullText);

    return {
      success: true,
      data: { date, type, mileage },
      msg: '识别成功'
    };

  } catch (err) {
    console.error('OCR 识别失败:', err);
    return {
      success: false,
      msg: '识别失败，请确保图片清晰且包含有效信息',
      error: err.message
    };
  }
};

// ------------------------------ 解析工具函数 ------------------------------
function extractDate(text) {
  // 匹配常见日期格式：YYYY-MM-DD 或 YYYY/MM/DD
  const dateRegex = /(\d{4}[-/]\d{2}[-/]\d{2})/;
  const match = text.match(dateRegex);
  return match ? match[1] : null;
}

function extractType(text) {
  // 定义运动类型关键词，可根据需求扩展
  const sportKeywords = ['跑步', '骑行'];
  for (const keyword of sportKeywords) {
    if (text.includes(keyword)) return keyword;
  }
  return '未知';
}

function extractMileage(text) {
    const mileageRegex = /(\d+(?:\.\d+)?)\s?(公里|km|千米)/i;
    const match = text.match(mileageRegex);
    return match ? parseFloat(match[1]) : 0;
  }
  
