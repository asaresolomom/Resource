function display(val) {
    document.getElementById('result').value += val;
}

function calculate() {
    try {
        let x = document.getElementById('result').value;
        let y = eval(x);
        document.getElementById('result').value = y;
    } catch (e) {
        document.getElementById('result').value = 'Error';
    }
}

function clearScreen() {
    document.getElementById('result').value = '';
}

function backspace() {
    var value = document.getElementById("result").value;
    document.getElementById("result").value = value.substr(0, value.length - 1);
}

function sin() {
    document.getElementById('result').value = Math.sin(document.getElementById('result').value);
}

function cos() {
    document.getElementById('result').value = Math.cos(document.getElementById('result').value);
}

function tan() {
    document.getElementById('result').value = Math.tan(document.getElementById('result').value);
}

function log() {
    document.getElementById('result').value = Math.log(document.getElementById('result').value);
}

function sqrt() {
    document.getElementById('result').value = Math.sqrt(document.getElementById('result').value);
}

function exp() {
    document.getElementById('result').value = Math.exp(document.getElementById('result').value);
}

function pow() {
    document.getElementById('result').value = Math.pow(document.getElementById('result').value, prompt("Enter the power"));
}

function pi() {
    document.getElementById('result').value += Math.PI;
}

let memory = 0;

function memoryStore() {
    memory = parseFloat(document.getElementById('result').value);
}

function memoryRecall() {
    document.getElementById('result').value = memory;
}

function memoryClear() {
    memory = 0;
}
