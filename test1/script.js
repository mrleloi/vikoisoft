let retriesCount = {};

document.getElementById('drop_zone').addEventListener('dragover', function(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});

document.getElementById('drop_zone').addEventListener('drop', processFileEvent);
document.getElementById('file_input').addEventListener('change', function(event) {
  processFileEvent(event, true);
});

function processFileEvent(event, isInputChange = false) {
  event.stopPropagation();
  event.preventDefault();
  const file = isInputChange ? event.target.files[0] : event.dataTransfer.files[0];
  if (!file || !file.name.endsWith('.txt')) {
    document.getElementById('output').innerText = 'Error: Only .txt files are accepted';
    return;
  }
  performAllTests().then(performance => {
    const { numWorkers, chunkSize } = calculateOptimalParameters(file.size, performance.cpuTime);
    processFile(file, numWorkers, chunkSize);
  }).catch(err => document.getElementById('output').innerText = 'Performance test failed: ' + err.message);
}

function performAllTests() {
  return new Promise((resolve, reject) => {
    const cpuTime = cpuTest(1000000); // Simulated CPU test
    const memoryUsage = memoryTest(); // Simulated memory usage test
    const networkSpeed = testNetworkSpeed(); // Simulated network speed test
    resolve({ cpuTime, memoryUsage, networkSpeed });
  });
}

function calculateOptimalParameters(fileSize, cpuTime) {
  let numWorkers, chunkSize;
  if (cpuTime < 500) {
    numWorkers = navigator.hardwareConcurrency || 4;
    chunkSize = Math.ceil(fileSize / numWorkers);
  } else {
    numWorkers = 2;
    chunkSize = Math.ceil(fileSize / numWorkers);
  }
  return { numWorkers, chunkSize };
}

function processFile(file, numWorkers, chunkSize) {
  const sliceSize = Math.ceil(file.size / numWorkers);
  let offset = 0;
  let completed = 0;
  const results = [];

  for (let i = 0; i < numWorkers; i++) {
    const slice = file.slice(offset, offset + sliceSize);
    const taskId = 'task-' + i;  // Tạo một ID duy nhất cho mỗi task

    retriesCount[taskId] = 0;  // Khởi tạo số lần thử lại là 0

    startWorker(slice, taskId);

    offset += sliceSize;
  }
}

function startWorker(slice, taskId) {
  const worker = new Worker('worker.js');
  worker.postMessage({ slice, taskId }); // Gửi slice và taskId tới worker

  startHeartbeat(worker, 5000);  // Kiểm tra tình trạng của worker mỗi 5000 ms

  worker.onmessage = function(event) {
    // Xử lý thông điệp từ worker
    handleWorkerMessage(event, taskId);
  };

  worker.onerror = function(error) {
    // Xử lý lỗi và retry nếu cần
    handleWorkerError(worker, slice, taskId, retriesCount[taskId]);
  };
}

function handleWorkerMessage(event, taskId) {
  console.log('Worker ' + event.data.index + ' said: ', event.data.result);
  results[event.data.index] = event.data.result;
  completed++;
  if (completed === numWorkers) {
    document.getElementById('output').innerText = 'All slices processed. Data: ' + results.join(', ');
  }
  delete retriesCount[taskId];  // Xóa bỏ tracking khi đã hết số lần thử
}

function handleWorkerError(worker, slice, taskId, error) {
  console.error(`Error on worker: ${error.message}`);

  switch (error.name) {
    case 'EncodingError':
      alert("File không đúng định dạng encoding. Vui lòng kiểm tra và thử lại.");
      break;
    case 'BufferOverflow':
      if (retries < 3) {
        console.log(`Buffer overflow on task ${task.id}. Retrying with smaller chunks.`);
        task.chunkSize /= 2;  // Giảm kích thước chunk
        retryTask(worker, slice, taskId);
      } else {
        alert("Không thể xử lý file do kích thước quá lớn.");
      }
      break;
    case 'ProgrammaticError':
      console.error(`Programmatic error in worker. Task ${task.id} will be retried.`);
      retryTask(worker, slice, taskId);
      break;
    default:
      if (retries < 3) {
        console.log(`Unknown error. Retrying task ${task.id}.`);
        retryTask(worker, slice, taskId);
      } else {
        alert("Task không thể hoàn thành sau 3 lần thử. Vui lòng thử lại.");
      }
  }
}

function retryTask(worker, slice, taskId) {
  if (retriesCount[taskId] > 3) {
    alert("Không thể xử lý task này sau nhiều lần thử. Vui lòng kiểm tra lại file hoặc liên hệ hỗ trợ.");
    return;
  }
  console.log(`Retrying task ${task.id} on worker. Attempt #${retries + 1}`);

  retriesCount[taskId]++;
  startWorker(slice, taskId);
}

function startHeartbeat(worker, interval) {
  let lastAlive = Date.now();
  const heartbeat = setInterval(() => {
    worker.postMessage('heartbeat');
    if (Date.now() - lastAlive > interval * 2) {
      console.log('Worker is dead or not responding.');
      clearInterval(heartbeat);
      worker.terminate();
      retryTask(worker, worker.taskId); // Ensure this is correctly managed
    }
  }, interval);

  worker.onmessage = function(e) {
    if (e.data === 'alive') {
      lastAlive = Date.now(); // Cập nhật thời điểm nhận tín hiệu sống
    }
    // Handle other messages
    else if (e.data.result) {
      handleResult(e.data);
    }
  };
}


function cpuTest(iterations) {
  const startTime = performance.now();
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += Math.sqrt(i) * Math.sin(i);
  }
  const endTime = performance.now();
  return endTime - startTime; // Trả về thời gian để hoàn thành bài test
}

function memoryTest() {
  let memoryUsageStart = window.performance.memory.usedJSHeapSize;
  let objects = [];
  for (let i = 0; i < 100000; i++) {
    objects.push({ index: i, value: Math.random() });
  }
  let memoryUsageEnd = window.performance.memory.usedJSHeapSize;
  return memoryUsageEnd - memoryUsageStart; // Trả về lượng bộ nhớ được sử dụng
}

function testNetworkSpeed() {
  return new Promise((resolve, reject) => {
    const downloadSize = 5000000; // bytes
    const startTime = (new Date()).getTime();
    fetch('https://your-server.com/large-file?size=' + downloadSize)
        .then(response => response.blob())
        .then(data => {
          const endTime = (new Date()).getTime();
          const speed = downloadSize / (endTime - startTime); // bytes per millisecond
          resolve(speed * 1000 / 1024 / 1024); // Mbps
        })
        .catch(reject);
  });
}