self.addEventListener('message', function(e) {
    if (e.data.type === 'heartbeat' && e.data.action === 'ping') {
        // Phản hồi tín hiệu "alive" nếu nhận được yêu cầu heartbeat
        self.postMessage({type: 'heartbeat', action: 'pong'});
    } else if (e.data.type === 'slice') {
        const arrayBuffer = e.data.buffer;
        const taskId = e.data.taskId;

        try {
            // Giả sử bạn đang xử lý văn bản, thực hiện một số tính toán hoặc logic xử lý
            const result = processSlice(arrayBuffer);
            self.postMessage({type: 'done', result: result, taskId: taskId});
        } catch (error) {
            // Gửi thông báo lỗi về cho main thread
            let errors = {
                name: error.type,
                message: error.message
            }
            self.postMessage({type: 'error', error: errors, taskId: taskId});
        }
    }
});

function processSlice(arrayBuffer) {
    const text = new TextDecoder("utf-8").decode(arrayBuffer);
    const normalizedText = text.toLowerCase().replace(/[^a-z\s,.]/g, ''); // Chỉ giữ chữ cái, khoảng trắng, dấu chấm và phẩy
    const words = normalizedText.split(/\s+/);
    const wordCounts = {};

    words.forEach(word => {
        if (word) { // Tránh thêm chuỗi rỗng
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    });

    return wordCounts;
}
