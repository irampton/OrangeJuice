function a() {
    let c = 0;
    for (let i = 0; i < 1000; i++) {
        c++;
        let d = Math.pi * 102943 / c % 2;
    }
    console.log(c);
    return c;
}

function b() {
    let c = 1000;
    for (let i = 0; i < 1000; i++) {
        c--;
    }
    return c;
}

    console.log("1");
    setTimeout(a,1);
    console.log("2");
for (let i = 0; i < 100000; i++) {
    let d = Math.pi * 102943 / i % 2;
}