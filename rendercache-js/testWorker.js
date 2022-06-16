var numWorkers = 7;
var calcArray = [19,17,14];
var calcArray2 = [[34,56,34],[56,45,12],[19,17,14]];
console.time("Time to calculate parallel");
var p = new Parallel(calcArray2, {maxWorkers: numWorkers}),
log = function () { 
    console.log(arguments);
    console.timeEnd("Time to calculate parallel");
    console.log("Workers: " + numWorkers + ", items: " + calcArray.length);
    //sequential();
 };
// One gotcha: anonymous functions cannot be serialzed
// If you want to do recursion, make sure the function
// is named appropriately

function fib(n) {
    //return n < 2 ? 1 : fib(n - 1) + fib(n - 2);
    console.log("here");
};

function fibonacci(num){
    for(var i = 0; i < num.length; i++){
        let a = 1, b = 0, temp, num2 = num[i];
        while (num2 >= 0){
          temp = a;
          a = a + b;
          b = temp;
          num2--;
        }
        num[i] = b;
    }
    fib(0);
    return num;
}

function sequential() { 
    var result = [];
    console.time("Time to calculate sequential");
    for(var i = 0; i < calcArray2.length; i++){
        result.push(fib(calcArray2[i]));
    }
    console.log(result);
    console.timeEnd("Time to calculate sequential");
 };

 p.require(fib);
 p.map(fibonacci).then(log);
 