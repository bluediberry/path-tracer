// main.js
var workerFor = new Worker('./for.js');
// listen to message event of worker
workerFor.onmessage = function(event){
    var div = document.getElementById('result');
    div.innerHTML = 'message received => ' + event.data;
};
// listen to error event of worker
workerFor.onerror = function(event) {
    console.error('error received from workerFor => ', event);
    var div = document.getElementById('result');
    div.innerHTML = 'Error!';
};
// load results from web worker
function loadResult() {
    // add loading text until `message` event listener replaces it
    var div = document.getElementById('result');
    div.innerHTML = 'loading...';
    // emit message event to worker
    workerFor.postMessage(null); // we don't need payload here
};