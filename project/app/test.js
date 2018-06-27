var a = 0;
b = "";

function test() {
	console.log("1:"+a);
	a = 1;
	console.log("2:"+a);
	console.log("3:"+b);
	b = "hello";
	console.log("4:"+b);
}

function test2(){
	console.log("5:"+a);
	console.log("6:"+b);
}

test();
test2();
