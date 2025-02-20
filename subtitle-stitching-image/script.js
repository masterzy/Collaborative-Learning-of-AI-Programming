// 创建背景图片对象
const backgroundImage = new Image();

// 获取Canvas和控件元素
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');

// 设置Canvas的初始尺寸
canvas.width = 1920;  // 设置一个较大的初始宽度
canvas.height = 1080; // 设置一个较大的初始高度
const textLines = document.getElementById('textLines');
const addLineBtn = document.getElementById('addLine');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const fontSizeSlider = document.getElementById('fontSize');
const bgOpacitySlider = document.getElementById('bgOpacity');
const imageUpload = document.getElementById('imageUpload');
const fontColorInput = document.getElementById('fontColor');
const enableStrokeCheckbox = document.getElementById('enableStroke');
const strokeColorInput = document.getElementById('strokeColor');
const strokeControls = document.querySelector('.stroke-controls');

// 显示/隐藏描边颜色选择器
enableStrokeCheckbox.addEventListener('change', function() {
    strokeColorInput.style.display = this.checked ? 'inline-block' : 'none';
    generateImage();
});

// 修改 generateImage 函数中的文本绘制部分
function generateImage() {
    // 创建临时画布存储原始图片，使用原始图片尺寸
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = backgroundImage.width;
    tempCanvas.height = backgroundImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false; // 禁用图像平滑以保持清晰度
    tempCtx.drawImage(backgroundImage, 0, 0, tempCanvas.width, tempCanvas.height);

    // 清空主画布并重新设置尺寸
    const textLines = document.querySelectorAll('.text-line');
    const minPadding = 20; // 字幕块的最小内边距
    const subtitleHeight = Math.max(parseInt(document.getElementById('subtitleHeight').value), parseInt(fontSizeSlider.value) + minPadding);
    const spacing = parseInt(document.getElementById('subtitleSpacing').value);
    const lineHeight = subtitleHeight; // 设置行高等于字幕高度
    
    // 设置主画布的尺寸为原始图片尺寸
    canvas.width = backgroundImage.width;
    canvas.height = backgroundImage.height;
    ctx.imageSmoothingEnabled = false; // 禁用图像平滑以保持清晰度
    
    // 过滤掉空文本的行，只保留有内容的行
    const validTextLines = Array.from(textLines).filter(textLine => {
        const input = textLine.querySelector('.line-input');
        return input.value.trim() !== '';
    });

    // 计算新的画布高度，包括字幕间隔
    const totalSubtitleHeight = validTextLines.length * lineHeight + (validTextLines.length - 1) * spacing;
    canvas.height = tempCanvas.height + totalSubtitleHeight;

    // 绘制原始图片
    ctx.drawImage(tempCanvas, 0, 0);

    // 添加水印
    ctx.save();
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('是二通呀！', canvas.width - 20, 40);
    ctx.restore();

    // 设置文字样式
    const fontSize = parseInt(fontSizeSlider.value);
    const bgOpacity = parseInt(bgOpacitySlider.value) / 100;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    
    // 从上往下绘制每行字幕
    let currentY = tempCanvas.height;

    validTextLines.forEach((textLine, index) => {
        const input = textLine.querySelector('.line-input');
        const text = input.value;

        // 为每行字幕创建单独的画布
        const subtitleCanvas = document.createElement('canvas');
        subtitleCanvas.width = canvas.width;
        subtitleCanvas.height = lineHeight;
        const subtitleCtx = subtitleCanvas.getContext('2d');

        // 从原图底部截取背景
        subtitleCtx.drawImage(
            tempCanvas,
            0, tempCanvas.height - lineHeight,
            tempCanvas.width, lineHeight,
            0, 0,
            subtitleCanvas.width, lineHeight
        );

        // 添加半透明遮罩
        subtitleCtx.fillStyle = `rgba(0, 0, 0, ${bgOpacity})`;
        subtitleCtx.fillRect(0, 0, subtitleCanvas.width, lineHeight);

        // 设置文本样式
        subtitleCtx.font = ctx.font;
        subtitleCtx.textAlign = ctx.textAlign;
        subtitleCtx.fillStyle = fontColorInput.value;

        // 如果启用描边
        if (enableStrokeCheckbox.checked) {
            subtitleCtx.strokeStyle = strokeColorInput.value;
            subtitleCtx.lineWidth = fontSize * 0.15;
            subtitleCtx.strokeText(text, subtitleCanvas.width/2, lineHeight/2 + fontSize/3);
        }

        // 绘制文本
        subtitleCtx.fillText(text, subtitleCanvas.width/2, lineHeight/2 + fontSize/3);

        // 将字幕画布绘制到主画布上
        ctx.drawImage(subtitleCanvas, 0, currentY);

        // 如果不是最后一行，添加间隔并填充原图内容
        if (index < validTextLines.length - 1 && spacing > 0) {
            // 创建间隔画布
            const spacingCanvas = document.createElement('canvas');
            spacingCanvas.width = canvas.width;
            spacingCanvas.height = spacing;
            const spacingCtx = spacingCanvas.getContext('2d');

            // 从原图对应位置截取内容填充间隔
            spacingCtx.drawImage(
                tempCanvas,
                0, tempCanvas.height - spacing,
                tempCanvas.width, spacing,
                0, 0,
                spacingCanvas.width, spacing
            );

            // 将间隔画布绘制到主画布上
            ctx.drawImage(spacingCanvas, 0, currentY + lineHeight);
        }

        // 更新Y坐标
        currentY += lineHeight + spacing;
    });
}

// 添加新的事件监听器
fontColorInput.addEventListener('input', generateImage);
strokeColorInput.addEventListener('input', generateImage);

// 获取原始文件名（不含扩展名）
function getOriginalFileName() {
    const fileInput = document.getElementById('imageUpload');
    if (fileInput.files && fileInput.files[0]) {
        const fileName = fileInput.files[0].name;
        return fileName.replace(/\.[^/.]+$/, ''); // 移除扩展名
    }
    return '未命名';
}

// 生成时间戳
function generateTimestamp() {
    const now = new Date();
    return now.getFullYear().toString() +
           (now.getMonth() + 1).toString().padStart(2, '0') +
           now.getDate().toString().padStart(2, '0') +
           now.getHours().toString().padStart(2, '0') +
           now.getMinutes().toString().padStart(2, '0') +
           now.getSeconds().toString().padStart(2, '0');
}

// 下载图片
function downloadImage() {
    // 创建一个新的画布用于渲染
    const scaledCanvas = document.createElement('canvas');
    const scaledCtx = scaledCanvas.getContext('2d');
    
    // 禁用图像平滑以保持清晰度
    scaledCtx.imageSmoothingEnabled = false;
    
    // 使用原始图片的宽度作为基准
    const targetWidth = backgroundImage.width;
    const scaleFactor = targetWidth / canvas.width;
    
    // 根据比例计算高度
    scaledCanvas.width = targetWidth;
    scaledCanvas.height = canvas.height * scaleFactor;
    
    // 在新画布上绘制高清图像
    scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    
    // 创建下载链接
    const link = document.createElement('a');
    const originalName = getOriginalFileName();
    const timestamp = generateTimestamp();
    link.download = `${originalName}_SG${timestamp}.png`;
    // 使用更高质量的图像导出设置
    link.href = scaledCanvas.toDataURL('image/png', 1.0);
    link.click();
}

// 绑定事件
addLineBtn.addEventListener('click', () => {
    addTextLine();
    // 为新添加的输入框绑定事件监听器
    const newInput = textLines.lastElementChild.querySelector('.line-input');
    newInput.addEventListener('input', generateImage);
});
downloadBtn.addEventListener('click', downloadImage);
fontSizeSlider.addEventListener('input', generateImage);
bgOpacitySlider.addEventListener('input', generateImage);
document.getElementById('subtitleHeight').addEventListener('input', generateImage);
document.getElementById('subtitleSpacing').addEventListener('input', generateImage); // 添加字幕间隔滑块的事件监听

// 为初始输入框绑定事件监听器
document.querySelector('.line-input').addEventListener('input', generateImage);

// 初始化
// 添加图片上传事件监听
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            backgroundImage.src = event.target.result;
            // 在图片加载完成后调整canvas尺寸
            backgroundImage.onload = function() {
                // 获取预览容器的尺寸
                const container = document.querySelector('.preview-container');
                const containerWidth = container.clientWidth - 40; // 减去padding
                const containerHeight = container.clientHeight - 40;

                // 计算图片的宽高比
                const imageRatio = backgroundImage.width / backgroundImage.height;
                const containerRatio = containerWidth / containerHeight;

                // 根据容器和图片的宽高比决定如何缩放
                if (imageRatio > containerRatio) {
                    // 图片更宽，以宽度为基准
                    canvas.width = containerWidth;
                    canvas.height = containerWidth / imageRatio;
                } else {
                    // 图片更高，以高度为基准
                    canvas.height = containerHeight;
                    canvas.width = containerHeight * imageRatio;
                }

                // 生成预览图
                generateImage();
            };
        };
        reader.readAsDataURL(file);
    }
});
backgroundImage.onload = generateImage;
// 添加文本行的函数
function addTextLine() {
    const textLine = document.createElement('div');
    textLine.className = 'text-line';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入文字内容';
    input.className = 'line-input';
    
    // 为每个新输入框创建独立的样式状态
    const lineState = {
        fontSize: fontSizeSlider.value,
        fontColor: fontColorInput.value,
        enableStroke: enableStrokeCheckbox.checked,
        strokeColor: strokeColorInput.value,
        bgOpacity: bgOpacitySlider.value
    };
    
    input.addEventListener('input', () => {
        generateImage();
    });
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-line';
    removeBtn.textContent = '删除';
    removeBtn.addEventListener('click', function() {
        textLine.remove();
        generateImage();
    });
    
    textLine.appendChild(input);
    textLine.appendChild(removeBtn);
    textLines.appendChild(textLine);
    
    // 立即生成新行的字幕
    generateImage();
}