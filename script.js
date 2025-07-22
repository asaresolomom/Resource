function display(val) {
    document.getElementById('result').value += val;
}

function clearScreen() {
    document.getElementById('result').value = '';
}

function backspace() {
    var value = document.getElementById('result').value;
    document.getElementById('result').value = value.substr(0, value.length - 1);
}

function calculate() {
    var p = document.getElementById('result').value;
    p = p.replace(/sin/g, 'Math.sin');
    p = p.replace(/cos/g, 'Math.cos');
    p = p.replace(/tan/g, 'Math.tan');
    p = p.replace(/log/g, 'Math.log');
    p = p.replace(/\^/g, '**');
    p = p.replace(/sqrt/g, 'Math.sqrt');
    var q = eval(p);
    document.getElementById('result').value = q;
}
