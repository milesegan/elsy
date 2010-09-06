// l-system generator

function LSystem(rules, seed, angle, name, defaultIterations) {
    this.rules = rules;
    this.seed = seed;
    this.angle = angle;
    this.name = name;
    this.defaultIterations = defaultIterations || 4;
}

LSystem.presets = [
    new LSystem({ f: "f+f-f-f+f" }, "f", 90, "koch curve"),
    new LSystem({ x: "yf+xf+y", y: "xf-yf-x" }, "x", 60, "sierpinski triangle", 7),
    new LSystem({ f: "f+f-f-f-g+f+f+f-f", g: "ggg" }, "f", 90, "sierpinski carpet"),
    new LSystem({ x: "x+yf", y: "fx-y" }, "fx", 90, "dragon curve", 9),
    new LSystem({ f: "f-f++f+f-f-f" }, "f-f-f-f-f", 360 / 5, "pentigree"),
    new LSystem({ x: "-yf+xfx+fy-", y: "+xf-yfy-fx+" }, "x", 90, "hilbert", 6),
    new LSystem({ x: "fx+fx+fxfy-fy-", y: "+fx+fxfy-fy-fy", f: "" }, "fx", 90, "cross", 5),
    new LSystem({ x: "x+yf++yf-fx--fxfx-yf+", y: "-fx+yfyf++yf+fx--fx-y" }, "x", 60, "peano-gosper"),
    new LSystem({ f: "ff+f+f+f+ff" }, "f+f+f+f", 90, "box"),
    new LSystem({ x: "f-[[x]+x]+f[+fx]-x", f: "ff" }, "x", 25, "plant 01", 5),
    new LSystem({ x: "f[+x]f[-x]+x", f: "ff" }, "x", 360 / 18, "plant 02", 5)

];

LSystem.prototype.generate = function(iterations) {
    var prod = this.seed;

    for (i = 0; i < iterations; i ++) {
        var newprod = "";
        for (p = 0; p < prod.length; p++) {
            if (this.rules[prod[p]] == undefined) {
                newprod += prod[p];
            }
            else {
                newprod += this.rules[prod[p]];
            }
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
        path.push({ x: p.x, y: p.y });
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
        case "f":
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    var xRatio = canvas.width / (this.maxX - this.minX);
    var yRatio = canvas.height / (this.maxY - this.minY);
    ctx.translate(-this.minX * xRatio, -this.minY * yRatio);

    for (p = 0; p < this.paths.length; p++) {
        ctx.beginPath();
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
        $("#iterations").val(preset.defaultIterations);
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
