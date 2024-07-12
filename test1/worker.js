self.addEventListener('message', function(e) {
    if (e.data === 'heartbeat') {
        // Phản hồi tín hiệu "alive" nếu nhận được yêu cầu heartbeat
        self.postMessage('alive');
    } else if (e.data.slice) {
        // Xử lý dữ liệu đã được gửi tới worker
        const slice = e.data.slice;
        const taskId = e.data.taskId;

        try {
            // Giả sử bạn đang xử lý văn bản, thực hiện một số tính toán hoặc logic xử lý
            const result = processSlice(slice);
            self.postMessage({result: result, taskId: taskId});
        } catch (error) {
            // Gửi thông báo lỗi về cho main thread
            self.postMessage({error: error.message, taskId: taskId});
        }
    }
});

function processSlice(slice) {
    // Ví dụ: Đếm số từ trong một đoạn văn bản
    const text = new TextDecoder("utf-8").decode(slice);
    const words = text.split(/\s+/);
    const wordCount = words.length;

    return wordCount;
}
