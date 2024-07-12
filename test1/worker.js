self.addEventListener('message', function(e) {
    if (e.data === 'heartbeat') {
        // Phản hồi tín hiệu "alive" nếu nhận được yêu cầu heartbeat
        self.postMessage('alive');
    } else if (e.data.buffer) {
        const arrayBuffer = e.data.buffer;
        const taskId = e.data.taskId;

        try {
            // Giả sử bạn đang xử lý văn bản, thực hiện một số tính toán hoặc logic xử lý
            const result = processSlice(arrayBuffer);
            self.postMessage({result: result, taskId: taskId});
        } catch (error) {
            // Gửi thông báo lỗi về cho main thread
            let errors = {
                name: error.type,
                message: error.message
            }
            self.postMessage({error: errors, taskId: taskId});
        }
    }
});

function processSlice(arrayBuffer) {
    // Ví dụ: Đếm số từ trong một đoạn văn bản
    const text = new TextDecoder("utf-8").decode(arrayBuffer);
    console.log(text);
    const words = text.split(/\s+/);
    const wordCount = words.length;

    return wordCount;
}
