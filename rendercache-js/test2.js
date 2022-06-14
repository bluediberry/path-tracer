var threads = 10;
var n = 200000;
var numbers = []
for (var j = 0; j < n; j++) {
    numbers[j] = Math.random() * 100000000000000;
}


function doSequential() {
    var first = Date.now();
    console.time("Sequential perform")
    for (var i = 0; i < threads; i++) {
    
        var result = "";
        for (var j = 0; j < n; j++) {
        var a = Math.sqrt(numbers[j]);
        result += "" + a;
        }
        var last = Date.now();
        
        }  
    console.timeEnd("Sequential perform");
    //console.log("Before: " + first + ", now: " +  last + ", span: " + (last - first));
}


var promiseArray = [];

function getPromises(){
    for (var i = 0; i < threads; i++) {
        promiseArray.push(new Promise((resolve) => setTimeout(() => {
            var first = Date.now();
            var result = "";
            for (var j = 0; j < n; j++) {
                var a = Math.sqrt(numbers[j]);
                result += "" + a;
            }
            var last = Date.now();
            console.log("resolved");
            resolve(last - first);
        }, 1000)));
    }
  return promiseArray;
}

async function call() {
    var before = Date.now();
    console.time("Promise all");
    //console.log("Now " +  before);
    getPromises();
    await Promise.all(promiseArray);
    var after = Date.now();
    console.timeEnd("Promise all");
    //console.log("Before: " + before + ", now: " +  after + ", span: " + (after - before) + ", thread time: " + sum);
    //console.log("Total thread time: " + sum);
}

doSequential();
call();
