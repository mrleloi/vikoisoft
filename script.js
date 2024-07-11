document.getElementById('drop_zone').addEventListener('dragover', function(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});

document.getElementById('drop_zone').addEventListener('drop', function(event) {
  event.stopPropagation();
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  processFile(file);
});

function processFile(file) {
  if (!file || !file.name.endsWith('.txt')) {
    document.getElementById('output').innerText = 'Lỗi: Chỉ chấp nhận file định dạng ".txt"';
    return;
  }

  const worker = new Worker('worker.js');
  worker.onerror = function(event) {
    handleWorkerError(worker, file, event.error);
  };
  worker.onmessage = function(event) {
    document.getElementById('output').innerText = event.data;
  };

  worker.postMessage(file);
}

function handleWorkerError(worker, file, error) {
  console.error(`Error in worker: ${error.message}`);
  document.getElementById('output').innerText = `Error processing file: ${error.message}`;
  worker.terminate();
  // Additional retry or handling logic can be implemented here
}
