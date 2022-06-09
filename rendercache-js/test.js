/*function resolveAfter2Seconds(x) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(x);
      }, 2000);
    });
  }
  
  async function f1() {
    var x = await resolveAfter2Seconds(10);
    console.log(x); // 10
  }
  f1();

  async function f2() {
    var y = await 20;
    console.log(y); // 20
  }
  f2();

  async function f3() {
    try {
      var z = await Promise.reject(30);
    } catch(e) {
      console.log(e); // 30
    }
  }
  f3();

  await Promise.all(items.map(async (item) => { 
    await fetchItem(item) 
  }))*/

  const promisseArray = [];

  function getPromisses(){
    for(var i = 0; i < 10; i++){
      const pi = calculateSomething(i);
      promisseArray.push(pi);
    }
    return promisseArray;
  }

 /* const resolveAfterTimeout = async i => {
    return new Promise(resolve => {
      console.log("CALLED");
      setTimeout(() => {
        resolve("RESOLVED AFTER " + (i+1)+ " SECONDS", i);
      }, (i+1)*1000);
    });
  };*/

 const calculateSomething = async i => {
    return new Promise(resolve => {
      var before = Date.now();
      var newArray = [];
      for(var j = 0; j < 50000000; j++){
        newArray.push(i*j);
      }
      if(i === 5){
        setTimeout(() => {
          var after = Date.now();
          console.log("Promise " + i + " done after " + (after - before) + " miliseconds");
          resolve(newArray);
      }, 3000);
      }
      else{
      var after = Date.now();
      console.log("Promise " + i + " done after " + (after - before) + " miliseconds");
      resolve(newArray);
      }

    });
  };
  
  const call = async () => {
    var before = Date.now();
    const res = await Promise.all(
      getPromisses(),
    );
    console.log({ res });
    var after = Date.now();
    console.log("Execution time: " + (after - before) + " miliseconds");
  };
  
  call();

  //const promises = [promise1(), promise2(), promise3()]

/*var first = new Date().getTime();
var current = null;
while (current === null || current - first < 30) {
    current = new Date().getTime();
}

const p1 = Promise.resolve(3);
const p2 = 1337;
const p3 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("foo");
  }, 100);
});

Promise.all([p1, p2, p3]).then(values => {
  console.log(values); // [3, 1337, "foo"]
});

async function parallel() {
    // Start a 500ms timer asynchronously…
    const wait1 = promise1(50); 
    // …meaning this timer happens in parallel.
    const wait2 = promise2(50); 
  
    // Wait 50ms for the first timer…
    await wait1; 
    
    // …by which time this timer has already finished.
    await wait2; 
  
    return "done!";
}*/