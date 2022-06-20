
var calcArray2 = [[34,46,34],[46,45,12],[19,17,14]];
var calcArray = [[34,46,34],[46,45,12],[19,17,14]];
var numWorkers = 7;
console.time("Time to calculate parallel");
var p = new Parallel(calcArray2, {maxWorkers: numWorkers}),
log = function () { 
    console.log(arguments);
    console.timeEnd("Time to calculate parallel");
    console.log("Workers: " + numWorkers + ", items: " + calcArray.length);
    sequential();
 };

function fib(n) {
    return n < 2 ? 1 : fib(n - 1) + fib(n - 2);
};

function fibonacci(num){
    for(var i = 0; i < num.length; i++){
        let num2 = num[i];
        num[i] = fib(num2);
    }
    return num;
}

function sequential() { 
    var result = [];
    console.time("Time to calculate sequential");
    for(var i = 0; i < calcArray.length; i++){
        var num = calcArray[i];
        result.push(fibonacci(num));
    }
    console.log(result);
    console.timeEnd("Time to calculate sequential");
 };

 p.require(fib);
 p.map(fibonacci).then(log);
 