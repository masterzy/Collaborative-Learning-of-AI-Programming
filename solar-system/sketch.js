// 定义星星数组
let stars = [];

// 定义行星数据
const planets = [
    { name: '太阳', radius: 50, distance: 0, speed: 0, color: [60, 100, 100], tilt: 0 },
    { name: '水星', radius: 10, distance: 80, speed: 4.787, color: [0, 0, 80], tilt: 7 },
    { name: '金星', radius: 15, distance: 120, speed: 3.502, color: [45, 80, 100], tilt: 3.39 },
    { name: '地球', radius: 16, distance: 170, speed: 2.978, color: [200, 80, 100], tilt: 0 },
    { name: '火星', radius: 12, distance: 220, speed: 2.407, color: [0, 80, 100], tilt: 1.85 },
    { name: '木星', radius: 35, distance: 300, speed: 1.307, color: [30, 60, 90], tilt: 1.31 },
    { name: '土星', radius: 30, distance: 380, speed: 0.969, color: [45, 70, 80], tilt: 2.49 },
    { name: '天王星', radius: 20, distance: 440, speed: 0.681, color: [180, 50, 90], tilt: 0.77 },
    { name: '海王星', radius: 20, distance: 500, speed: 0.543, color: [210, 80, 100], tilt: 1.77 }
];

let angle = 0;
let speedSlider;
let rotationX = -20;
let rotationY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let time = 0;
let isPaused = false;
let pauseButton;

let font;

function preload() {
    // 使用系统默认字体
    font = loadFont('Arial Unicode.ttf');
}

function setup() {
    // 生成随机星星
    for (let i = 0; i < 1000; i++) {
        stars.push({
            x: random(-2000, 2000),
            y: random(-2000, 2000),
            z: random(-2000, 2000),
            size: random(1, 5),
            twinkleSpeed: random(0.02, 0.05),
            twinkleOffset: random(TWO_PI)
        });
    }
    // createCanvas(1400, 1200, WEBGL);
    createCanvas(windowWidth, windowHeight, WEBGL);
    colorMode(HSB, 360, 100, 100);
    
    // 设置字体
    textFont(font);
    textSize(windowWidth*0.1);
    
    // 创建速度控制滑块
    speedSlider = createSlider(0, 5, 1, 0.1);
    speedSlider.position(20, 20);
    speedSlider.style('width', '200px');
    
    // 添加标签
    let speedLabel = createDiv('运行速度');
    speedLabel.position(230, 20);
    speedLabel.style('color', 'white');

    // 创建暂停/继续按钮
    pauseButton = createButton('暂停');
    pauseButton.position(20, 50);
    pauseButton.style('width', '80px');
    pauseButton.style('height', '30px');
    pauseButton.style('background-color', '#f44336');
    pauseButton.style('color', 'white');
    pauseButton.style('border', 'none');
    pauseButton.style('border-radius', '4px');
    pauseButton.style('cursor', 'pointer');
    pauseButton.mousePressed(togglePause);
}

function togglePause() {
    isPaused = !isPaused;
    pauseButton.html(isPaused ? '继续' : '暂停');
    pauseButton.style('background-color', isPaused ? '#4CAF50' : '#f44336');
}

function draw() {
    background(0);
    
    // 设置光照
    ambientLight(60);
    pointLight(60, 0, 100, 0, 0, 0);
    
    // 应用视角旋转
    rotateX(radians(rotationX));
    rotateY(radians(rotationY));
    
    // 绘制星空背景
    push();
    for (let star of stars) {
        let brightness = map(sin(time * star.twinkleSpeed + star.twinkleOffset), -1, 1, 100, 255);
        stroke(brightness);
        strokeWeight(star.size);
        point(star.x, star.y, star.z);
    }
    pop();
    
    // 更新时间
    if (!isPaused) {
        time += speedSlider.value() * 0.01;
    }
    
    // 绘制所有行星
    for (let planet of planets) {
        push();
        
        // 计算行星位置
        let x = cos(time * planet.speed) * planet.distance;
        let z = sin(time * planet.speed) * planet.distance;
        
        // 绘制平滑轨道
        stroke(255, 30);
        strokeWeight(1);
        noFill();
        push();
        rotateX(PI/2);
        beginShape();
        for (let i = 0; i <= 100; i++) {
            let angle = map(i, 0, 100, 0, TWO_PI);
            let x = cos(angle) * planet.distance;
            let y = sin(angle) * planet.distance;
            vertex(x, y);
        }
        endShape(CLOSE);
        pop();
        
        // 移动到行星位置
        translate(x, 0, z);
        
        // 设置行星材质和颜色
        noStroke();
        fill(planet.color[0], planet.color[1], planet.color[2]);
        
        // 特殊处理土星环
        if (planet.name === '土星') {
            push();
            rotateX(PI/2);
            // 绘制土星环
            fill(planet.color[0], planet.color[1] - 20, planet.color[2]);
            torus(planet.radius * 1.5, planet.radius * 0.2);
            pop();
        }
        
        // 绘制行星
        sphere(planet.radius);
        
        // 添加行星名称标签
        push();
        translate(0, -planet.radius - 25, 0);
        // 确保文字始终朝向摄像机
        rotateY(-radians(rotationY));
        rotateX(-radians(rotationX));
        
        // 设置文本属性
        textSize(16);
        textAlign(CENTER, CENTER);
        
        // 计算文本宽度
        let textW = textWidth(planet.name);
        
        // 绘制半透明背景
        fill(0, 0, 50, 0.8);
        noStroke();
        rectMode(CENTER);
        rect(0, 0, textW + 20, 30, 8);
        
        // 绘制文本
        fill(255);
        noStroke();
        text(planet.name, 0, 0);
        
        pop();
        
        pop();
    }
}

function mousePressed() {
    isDragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

function mouseDragged() {
    if (isDragging) {
        let deltaX = mouseX - lastMouseX;
        let deltaY = mouseY - lastMouseY;
        
        rotationY += deltaX * 0.5;
        rotationX += deltaY * 0.5;
        
        // 限制垂直旋转角度
        rotationX = constrain(rotationX, -90, 90);
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function mouseReleased() {
    isDragging = false;
}