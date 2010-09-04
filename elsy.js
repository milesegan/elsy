// l-system generator

function LSystem(rules, seed, angle, name) {
    this.rules = rules;
    this.seed = seed;
    this.angle = angle;
    this.name = name;
}

LSystem.presets = [
    new LSystem({ F: "F+F-F-F+F" }, "F", 90, "koch curve"),
    new LSystem({ A: "B-A-B", B: "A+B+A" }, "A", 60, "sierpinski triangle"),
    new LSystem({ X: "X+YF", Y: "FX-Y" }, "FX", 90, "dragon curve"),
    new LSystem({ X: "F-[[X]+X]+F[+FX]-X", F: "FF" }, "X", 25, "fractal plant")
];

LSystem.prototype.generate = function(iterations) {
    var prod = this.seed;

    for (i = 0; i < iterations; i ++) {
        var newprod = "";
        for (p = 0; p < prod.length; p++) {
            if (this.rules[prod[p]])
                newprod += this.rules[prod[p]];
            else
                newprod += prod[p]
        }
        prod = newprod;
    }

    return prod;
};

LSystem.prototype.compute = function(iterations) {
    var prod = this.generate(iterations);
    var a = 0;
    var aStep = this.angle * Math.PI / 180;
    var p = { x: 0, y: 0 };
    this.maxX = this.minX = this.maxY = this.minY = 0;
    this.paths = [];
    var path = [];
    var stack = [];

    for (i = 0; i < prod.length; i++) {
        switch (prod[i]) {
        case "[":
            stack.push({ x: p.x, y: p.y, a: a });
            break;
        case "]":
            this.paths.push(path);
            path = [];
            var top = stack.pop();
            p.x = top.x;
            p.y = top.y;
            a = top.a;
            break;
        case "-":
            a -= aStep;
            break;
        case "+":
            a += aStep;
            break;
        default:
            path.push({ x: p.x, y: p.y });
            p.x += 1 * Math.cos(a);
            p.y += 1 * Math.sin(a);
            this.maxX = Math.max(p.x, this.maxX);
            this.minX = Math.min(p.x, this.minX);
            this.maxY = Math.max(p.y, this.maxY);
            this.minY = Math.min(p.y, this.minY);
            break;
        }
    }
    if (path.length > 0) {
        this.paths.push(path)
    }
};

LSystem.prototype.draw = function(canvas, iterations) {
    this.compute(iterations);
    canvas.width = canvas.width; // "reset" the canvas
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.moveTo(0, 0);
    var xRatio = canvas.width / (this.maxX - this.minX);
    var yRatio = canvas.height / (this.maxY - this.minY);
    ctx.translate(-this.minX * xRatio, -this.minY * yRatio);

    for (p = 0; p < this.paths.length; p++) {
        var path = this.paths[p];
        ctx.moveTo(path[0].x * xRatio, path[0].y * yRatio);
        for (i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * xRatio, path[i].y * yRatio);
        }
        ctx.stroke();
    }
};

(function($) {
    var canvas;
    var form;

    function render() {
        var rules = {};
        var ruletxt = $("#rules").val().trim().split("\n");
        $.each(ruletxt, function (i,v) { 
            var kv = v.split(/\s*->\s*/);
            rules[kv[0]] = kv[1];
        });
        var seed = $("#seed").val().trim();
        var angle = parseInt($("#angle").val());
        var iterations = parseInt($("#iterations").val());
        var ls = new LSystem(rules, seed, angle);
        if (iterations >= 1) {
            ls.draw(canvas, iterations);
        }
    }

    function loadPreset(p) {
        var preset = LSystem.presets[p];
        var rules = [];
        $.each(preset.rules, function(k,v) {
            rules.push(k + " -> " + v);
        });
        $("#rules").val(rules.join("\n"));
        $("#seed").val(preset.seed);
        $("#angle").val(preset.angle);
        $("#iterations").val(4);
        render();
    }

    $.fn.lsysControl = function(c) {
        canvas = c;
        form = $(this);
        $(this).submit(function(e) {
            e.preventDefault();
            render();
        });

        $.each(LSystem.presets, function(i,p) {
            var o = $("<option></option>");
            o.append(p.name);
            o.attr('value', i);
            $("#preset").append(o);
        });

        $("#preset").change(function() { 
            var selected = $(this).find("option[selected=true]");
            loadPreset(selected.attr('value'));
        });

        loadPreset(0);
        return this;
    };
})(jQuery);

$(document).ready(function() {
    var canvas = $("canvas").get(0);
    $("#lsystem").lsysControl(canvas);
});
