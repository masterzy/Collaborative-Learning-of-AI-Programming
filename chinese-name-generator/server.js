const http = require('http');
const https = require('https');

const API_KEY = 'b35db717-0864-4b9a-b257-317290f7e32f';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 系统提示词，用于指导AI生成有趣且文化相关的中文名
// 解析英文名为姓和名
function parseEnglishName(englishName) {
    // 移除多余的空格并按常见分隔符分割
    const parts = englishName.trim().split(/[\s.,]+/).filter(part => part.length > 0);
    if (parts.length >= 2) {
        return {
            firstName: parts[0],
            lastName: parts[parts.length - 1]
        };
    }
    return {
        firstName: englishName,
        lastName: ''
    };
}

const SYSTEM_PROMPT = `你是一个专业的中文起名专家，擅长为外国人起富有创意和文化内涵的中文名。
请根据用户提供的英文名，生成3个独特的中文名。每个名字都应该：
1. 体现中国传统文化特色
2. 考虑英文名的含义和特点，尤其注意：
   - 英文名的姓氏部分应对应中文姓氏
   - 英文名的名字部分应对应中文名字
   - 保持姓名结构的对应关系
3. 根据性别选择合适的字词
4. 如果提供了出生年份，根据生肖特征选择吉利字词
5. 提供详细的中英文寓意解释
6. 提供准确的汉语拼音（包含声调）
7. 结合2025年蛇年元素，可以适当融入蛇的智慧、灵动等寓意
8. 分析每个汉字的五行属性，并给出整体五行分析

请按照以下JSON格式返回结果：
{
  "names": [
    {
      "chinese": "中文名",
      "pinyin": "zhōng wén míng",
      "meaningChinese": "中文寓意说明",
      "meaningEnglish": "English meaning explanation",
      "zodiac": "生肖特征分析",
      "fiveElements": "五行分析（包含每个字的五行属性和整体分析）"
    }
  ]
}`;

const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 只处理/generate-names的POST请求
    if (req.method === 'POST' && req.url === '/generate-names') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { englishName, birthYear, gender } = JSON.parse(body);
                const { firstName, lastName } = parseEnglishName(englishName);
                const userPrompt = `请为英文名"${englishName}"（姓：${lastName}，名：${firstName}）生成3个富有创意的中文名。${birthYear ? `出生年份：${birthYear}年，` : ''}性别：${gender === 'male' ? '男' : '女'}。请确保中文姓名结构与英文姓名结构相对应。`;

                // 准备请求体
                const requestData = {
                    model: 'deepseek-r1-250120',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt }
                    ]
                };

                // 设置API请求选项
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    timeout: 60000 // 60秒超时
                };

                // 发送请求到火山引擎API
                const apiReq = https.request(API_URL, options, (apiRes) => {
                    let data = '';

                    apiRes.on('data', (chunk) => {
                        data += chunk;
                    });

                    apiRes.on('end', () => {
                        try {
                            console.log('API原始响应数据:', data);
                            const response = JSON.parse(data);
                            console.log('解析后的响应数据:', JSON.stringify(response, null, 2));
                            
                            if (!response || !response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
                                console.error('API响应数据结构不完整:', response);
                                throw new Error('API返回数据格式不正确');
                            }
                            
                            let contentStr = response.choices[0].message.content.trim();
                            console.log('AI返回的原始内容:', contentStr);
                            
                            contentStr = contentStr.replace(/`/g, '');
                            // 清理可能存在的'json'前缀
                            contentStr = contentStr.replace(/^json\s*/, '');
                            console.log('清理反引号和json前缀后的内容:', contentStr);
                            
                            try {
                                const generatedNames = JSON.parse(contentStr);
                                console.log('解析后的名字数据:', JSON.stringify(generatedNames, null, 2));
                                
                                if (!generatedNames || !generatedNames.names || !Array.isArray(generatedNames.names)) {
                                    console.error('生成的名字数据结构不正确:', generatedNames);
                                    throw new Error('生成的名字数据格式不正确');
                                }
                                
                                // 验证每个名字对象的结构
                                const isValidName = (name) => {
                                    return name.chinese && name.pinyin && name.meaningChinese && 
                                           name.meaningEnglish && typeof name.zodiac !== 'undefined';
                                };
                                
                                if (!generatedNames.names.every(isValidName)) {
                                    console.error('部分名字数据字段缺失:', generatedNames.names);
                                    throw new Error('部分名字数据字段缺失');
                                }
                                
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify(generatedNames));
                            } catch (parseError) {
                                console.error('解析AI返回内容时出错:', parseError);
                                throw new Error('解析AI返回内容时出错: ' + parseError.message);
                            }
                        } catch (error) {
                            console.error('处理API响应时出错:', error);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: '生成名字时出错：' + error.message }));
                        }
                    });
                });

                apiReq.on('error', (error) => {
                    console.error('API request error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '服务器错误' }));
                });

                apiReq.on('timeout', () => {
                    apiReq.destroy();
                    res.writeHead(504, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '请求超时' }));
                });

                apiReq.write(JSON.stringify(requestData));
                apiReq.end();

            } catch (error) {
                console.error('Request processing error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '无效的请求数据' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未找到请求的资源' }));
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});