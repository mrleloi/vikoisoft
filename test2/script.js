let canvas = document.getElementById('myCanvas');
let ctx = canvas.getContext('2d');
let blockWidth = 50; // Chiều rộng của mỗi khối
let blockHeight = blockWidth; // Chiều cao của mỗi ô vuông trong khối
let blockMargin = 10; // Khoảng lề với ô xung quanh
let hasBlockWaters = [];

document.getElementById('drawButton').addEventListener('click', function() {
    var input = document.getElementById('inputNumbers').value;
    var numbers = input.split(',').map(Number);
    updateCanvasSize(numbers, blockHeight, blockMargin); // Cập nhật kích thước canvas trước khi vẽ
    drawBlocks(numbers);
    var waterVolume = calculateWater(input.split(',').map(Number));
    document.getElementById('waterVolume').innerText = "Total water volume: " + waterVolume;
});

function drawBlocks(numbers) {
    var x = 0; // Vị trí bắt đầu của khối đầu tiên

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Xóa canvas

    numbers.forEach(function(height) {
        var y = canvas.height - blockHeight; // Vị trí bắt đầu vẽ khối dưới cùng

        for (let i = 0; i < height; i++) {
            ctx.beginPath();
            ctx.rect(x, y - i * (blockHeight + blockMargin), blockWidth, blockHeight);
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.fill();
            ctx.stroke();
        }
        x += blockWidth + blockMargin; // Khoảng cách giữa các khối
    });
}

function calculateWater(numbers) {
    let left = 0, right = numbers.length - 1;
    let maxLeft = numbers[left], maxRight = numbers[right];
    let water = 0;

    while (left < right) {
        if (numbers[left] <= numbers[right]) {
            drawWater(ctx, left, maxLeft, numbers[left], blockWidth, blockHeight, blockMargin);
            left++;
            maxLeft = Math.max(maxLeft, numbers[left]);
            water += maxLeft - numbers[left];
        } else {
            drawWater(ctx, right, maxRight, numbers[right], blockWidth, blockHeight, blockMargin);
            right--;
            maxRight = Math.max(maxRight, numbers[right]);
            water += maxRight - numbers[right];
        }
    }

    return water;
}

function drawWater(ctx, index, max, height, blockWidth, blockHeight, blockMargin) {
    var x = index * (blockWidth + blockMargin); // Position based on index
    hasBlockWaters[index] = [];
    var waterHeight = max - height; // Số lượng "blocks" nước cần vẽ
    var yStart = canvas.height - ((height) * (blockHeight + blockMargin)); // Điểm bắt đầu vẽ từ dưới lên
    // Vẽ thanh dọc các ô nước, ô trên cùng không có blockMargin phía trên
    for (let i = 0; i < waterHeight; i++) {
        var posBonusWater = (i == waterHeight - 1) ? blockMargin : 0;
        var heightBonusWater = i == waterHeight - 1 ? blockMargin : 0;
        var yPos = yStart - ((i+1) * (blockHeight + blockMargin) - posBonusWater);
        ctx.beginPath();
        // Vẽ thanh ngang giữa các ô nước, kiểm tra và vẽ phía bên trái
        hasBlockWaters[index][height + i] = 1;
        if (index >= 1 && hasBlockWaters[index - 1] && hasBlockWaters[index - 1][height + i]) {
            console.log(x-1);
            console.log(height + i);
            ctx.rect(x - blockMargin, yPos, blockWidth + blockMargin, blockHeight + blockMargin - heightBonusWater);
        }
        else
            ctx.rect(x, yPos, blockWidth, blockHeight + blockMargin - heightBonusWater);
        ctx.fillStyle = '#00a0e6';
        ctx.strokeStyle = '#00a0e6';
        ctx.fill();
        ctx.stroke();
    }
}

function updateCanvasSize(numbers, blockHeight, blockMargin) {
    const maxHeight = Math.max(...numbers);
    const totalHeight = maxHeight * (blockHeight + blockMargin) + blockMargin; // Tính tổng chiều cao cần thiết
    const totalWidth = numbers.length * (blockWidth + blockMargin) + blockMargin; // Tính chiều rộng cần thiết

    canvas.width = totalWidth; // Cập nhật chiều rộng canvas
    canvas.height = totalHeight; // Cập nhật chiều cao canvas
}