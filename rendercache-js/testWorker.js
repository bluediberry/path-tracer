var numWorkers = 5;
var calcArray = [43, 44, 45];
var calcArray2 = [43, 44, 45];
console.time("Time to calculate parallel");
var p = new Parallel(calcArray, {maxWorkers: numWorkers}),
log = function () { 
    console.log(arguments);
    console.timeEnd("Time to calculate parallel");
    console.log("Workers: " + numWorkers + ", items: " + calcArray.length);
    sequential();
 };
// One gotcha: anonymous functions cannot be serialzed
// If you want to do recursion, make sure the function
// is named appropriately
function fib(n) {
    return n < 2 ? 1 : fib(n - 1) + fib(n - 2);
};

function sequential() { 
    var result = [];
    console.time("Time to calculate sequential");
    for(var i = 0; i < calcArray2.length; i++){
        result.push(fib(calcArray2[i]));
    }
    console.log(result);
    console.timeEnd("Time to calculate sequential");
 };

 p.map(fib).then(log);