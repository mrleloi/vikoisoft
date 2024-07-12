let isPerformanceChecked = false;
let numWorkers = 0;
let workerTasks = {};
let results = [];
let numWorkerTasksCompleted = 0;
let retriesCount = {};

window.onload = () => {
  if (!localStorage.getItem('resultTestPerformance')) {
    performAllTests();
  } else {
    isPerformanceChecked = true; // Đánh dấu là đã kiểm tra nếu kết quả đã lưu trong localStorage
  }
};

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

  numWorkerTasksCompleted = 0;

  const file = isInputChange ? event.target.files[0] : event.dataTransfer.files[0];
  if (!file || !file.name.endsWith('.txt')) {
    document.getElementById('output').innerText = 'Error: Only .txt files are accepted';
    return;
  }
  if (!isPerformanceChecked) {
    document.getElementById('output').innerText = 'Please wait while the system checks your computer\'s performance.';

    performAllTests().then(performance => {
      const { numWorkers, chunkSize } = calculateOptimalParameters(file.size, performance);
      processFile(file, numWorkers, chunkSize);
    }).catch(err => document.getElementById('output').innerText = 'Performance test failed: ' + err.message);
    return;
  }
  else {
    let resultTestPerformance = localStorage.getItem('resultTestPerformance');
    if (resultTestPerformance) {
      resultTestPerformance = JSON.parse(resultTestPerformance);
      const { numWorkers, chunkSize } = calculateOptimalParameters(file.size, resultTestPerformance);
      processFile(file, numWorkers, chunkSize);
    }
    else {
      document.getElementById('output').innerText = 'Performance test failed.';
      return;
    }
  }
}

function performAllTests() {
  return new Promise(async (resolve, reject) => {
    try {
      const cpuTime = await cpuTest(1000000); // Bài kiểm tra CPU
      const memoryUsage = await memoryTest(); // Bài kiểm tra bộ nhớ
      const networkSpeed = true;
      // const networkSpeed = await testNetworkSpeed(); // Bài kiểm tra tốc độ mạng
      let result = { cpuTime, memoryUsage, networkSpeed };
      localStorage.setItem('resultTestPerformance', JSON.stringify(result));
      isPerformanceChecked = true;
      resolve(result);
    } catch (err) {
      isPerformanceChecked = true;
      reject(err);
    }
  });
}

function calculateOptimalParameters(fileSize, performance) {
  let cpuTime = performance.cpuTime;
  let memoryUsage = performance.memoryUsage;
  let chunkSize;
  if (cpuTime < 500) {
    numWorkers = navigator.hardwareConcurrency || 4;
  } else {
    numWorkers = 2;
  }
  chunkSize = Math.ceil(fileSize / numWorkers);
  return { numWorkers, chunkSize };
}

function processFile(file, numWorkers, chunkSize) {
  let offset = 0;

  for (let i = 0; i < numWorkers; i++) {
    const slice = file.slice(offset, offset + chunkSize);
    const taskId = 'task-' + i;  // Tạo một ID duy nhất cho mỗi task

    retriesCount[taskId] = 0;  // Khởi tạo số lần thử lại là 0

    startWorker(slice, taskId);

    offset += chunkSize;
  }
}

function startWorker(slice, taskId) {
  const worker = new Worker('worker.js');
  const workerId = worker;

  // Lưu trữ dữ liệu task
  workerTasks[workerId] = { slice, taskId, worker };

  worker.postMessage({ slice, taskId }); // Gửi slice và taskId tới worker

  startHeartbeat(worker, 5000);  // Kiểm tra tình trạng của worker mỗi 5000 ms

  worker.onmessage = function(event) {
    // Xử lý thông điệp từ worker
    handleWorkerMessage(event, workerId);
  };

  worker.onerror = function(error) {
    // Xử lý lỗi và retry nếu cần
    handleWorkerError(error, workerId);
  };
}

function handleWorkerMessage(event, workerId) {
  if (event.data.result) {
    const taskDetails = workerTasks[workerId];

    console.log('Task #' + taskDetails.taskId + ' said: ', event.data.result);
    results[taskDetails.taskId] = event.data.result;
    numWorkerTasksCompleted++;
    if (numWorkerTasksCompleted === numWorkers) {
      document.getElementById('output').innerText = 'All slices processed. Data: ' + results.join(', ');
    }
    delete workerTasks[workerId];
    delete retriesCount[taskId];  // Xóa bỏ tracking khi đã hết số lần thử
  }
}

function handleWorkerError(error, workerId) {
  const taskDetails = workerTasks[workerId];
  let taskId = taskDetails.taskId;
  console.error(`Error on worker: ${error.message}`);

  switch (error.name) {
    case 'EncodingError':
      alert("File không đúng định dạng encoding. Vui lòng kiểm tra và thử lại.");
      break;
    case 'BufferOverflow':
      if (retriesCount[taskId] < 3) {
        console.log(`Buffer overflow on task ${taskId}. Retrying with smaller chunks.`);
        task.chunkSize /= 2;  // Giảm kích thước chunk
        retryTask(workerId);
      } else {
        alert("Không thể xử lý file do kích thước quá lớn.");
      }
      break;
    case 'ProgrammaticError':
      console.error(`Programmatic error in worker. Task ${taskId} will be retried.`);
      retryTask(workerId);
      break;
    default:
      if (retriesCount[taskId] < 3) {
        console.log(`Unknown error. Retrying task ${taskId}.`);
        retryTask(workerId);
      } else {
        alert("Task không thể hoàn thành sau 3 lần thử. Vui lòng thử lại.");
      }
  }
}

function retryTask(workerId) {
  const taskDetails = workerTasks[workerId];
  if (taskDetails && retriesCount[taskDetails.taskId] < 3) {
    retriesCount[taskDetails.taskId]++;
    console.log(`Retrying task ${taskDetails.taskId}. Attempt #${retriesCount[taskDetails.taskId]}`);
    startWorker(taskDetails.slice, taskDetails.taskId);
  } else {
    console.log('Failed after 3 retries for task ' + taskDetails.taskId);
  }
}

function startHeartbeat(worker, interval) {
  const workerId = worker;
  const heartbeat = setInterval(() => {
    worker.postMessage('heartbeat');
    if (Date.now() - workerTasks[workerId].lastAlive > interval * 2) {
      console.log('Worker is dead or not responding.');
      clearInterval(heartbeat);
      worker.terminate();
      retryTask(workerId);  // Sử dụng workerId để truy cập dữ liệu và thử lại task
    }
  }, interval);

  worker.onmessage = function(e) {
    if (e.data === 'alive') {
      workerTasks[workerId].lastAlive = Date.now();
    } else {
      handleWorkerMessage(e, workerId);
    }
  };
}

async function cpuTest(iterations) {
  const startTime = performance.now();
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += Math.sqrt(i) * Math.sin(i);
  }
  const endTime = performance.now();
  return endTime - startTime; // Trả về thời gian để hoàn thành bài test
}

async function memoryTest() {
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
    const downloadSize = '5MB';
    const startTime = (new Date()).getTime();
    fetch('./resources/test_performance_network_file_' + downloadSize)
        .then(response => response.blob())
        .then(data => {
          const endTime = (new Date()).getTime();
          const speed = downloadSize / (endTime - startTime); // bytes per millisecond
          resolve(speed * 1000 / 1024 / 1024); // Mbps
        })
        .catch(reject);
  });
}