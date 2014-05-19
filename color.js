function Color(r, g, b, a) {
    "use strict";
    if (arguments.length === 4) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    } else {
        this.r = this.g = this.b = this.a = 0;
    }
}

Color.RED = new Color(255, 0, 0, 255);
Color.GREEN = new Color(0, 255, 0, 255);
Color.BLUE = new Color(0, 0, 255, 255);
Color.YELLOW = new Color(255, 255, 0, 255);
Color.PURPLE = new Color(255, 0, 255, 255);
Color.CYAN = new Color(0, 255, 255, 255);
Color.WHITE = new Color(255, 255, 255, 255);
Color.BLACK = new Color(0, 0, 0, 255);
Color.GRAY = new Color(128, 128, 128, 255);

Color.prototype.setColor = function(that) {
    "use strict";
    if (that !== null &&
        that.constructor === Color) {
        this.r = that.r;
        this.g = that.g;
        this.b = that.b;
        this.a = that.a;
        return this;
    } else {
        return null;
    }
};

Color.prototype.equal = function(that) {
    "use strict";
    return (this.r === that.r && this.g === that.g && this.b === that.b);
};

Color.prototype.add = function(that) {
    "use strict";
    return new Color(this.r + that.r, this.g + that.g, this.b + that.b, this.a + that.a);
};

Color.prototype.addc = function(that) {
    "use strict";
    return new Color(this.r + that.r, this.g + that.g, this.b + that.b, this.a);
};

Color.prototype.sub = function(that) {
    "use strict";
    return new Color(this.r - that.r, this.g - that.g, this.b - that.b, this.a - this.a);
};

Color.prototype.subc = function(that) {
    "use strict";
    return new Color(this.r - that.r, this.g - that.g, this.b - that.b, this.a);
};

Color.prototype.mul = function(c) {
    "use strict";
    return new Color(this.r * c, this.g * c, this.b * c, this.a * c);
};

// only r, g, b channels are modified
Color.prototype.mulc = function(c) {
    "use strict";
    return new Color(this.r * c, this.g * c, this.b * c, this.a);
};

Color.prototype.clamp = function() {
    "use strict";
    this.r = clamp(this.r, 0, 255);
    this.g = clamp(this.g, 0, 255);
    this.b = clamp(this.b, 0, 255);
    this.a = clamp(this.a, 0, 255);
    return this;
};

Color.prototype.round = function() {
    "use strict";
    this.r = Math.round(this.r);
    this.g = Math.round(this.g);
    this.b = Math.round(this.b);
    this.a = Math.round(this.a);
    return this;
};

Color.interpolate = function(c1, c2, t) {
    "use strict";
    return c1.mul(t).add(c2.mul(1 - t));
};

function clamp(v, lower, upper) {
    "use strict";
    return Math.max(lower, Math.min(v, upper));
}
