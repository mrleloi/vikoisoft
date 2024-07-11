self.addEventListener('message', function(e) {
  const file = e.data;
  const reader = new FileReader();
  
  reader.onload = function() {
    try {
      const text = reader.result;
      const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
      const wordCount = words.reduce((count, word) => {
        count[word] = (count[word] || 0) + 1;
        return count;
      }, {});

      const uniqueWords = Object.keys(wordCount).length;
      const topWords = Object.keys(wordCount).sort((a, b) => wordCount[b] - wordCount[a]).slice(0, 3);
      const topWordsOutput = topWords.map(word => `${word}: ${wordCount[word]}`).join(', ');

      self.postMessage(`Total unique words: ${uniqueWords}. Top words: ${topWordsOutput}`);
    } catch (error) {
      self.postMessage(`Error processing text: ${error.message}`);
    }
  };

  reader.onerror = () => {
    self.postMessage('Failed to read the file.');
  };

  reader.readAsText(file);
});
