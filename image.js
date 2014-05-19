function MyImage(name, type, cvs) {
    "use strict";
    this.name = name;
    this.type = type;
    this.setData = function(cvs) {
        var ctx = cvs.getContext("2d");
        this.data = ctx.getImageData(0, 0, cvs.width, cvs.height);
        this.width = cvs.width;
        this.height = cvs.height;
        this.zoom = 1;
    };
    this.setData(cvs);
}

function RGBAImage(w, h, data) {
    "use strict";
    this.type = 'RGBAImage';
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
    if (data) {
        this.data.set(data);
    }
}

RGBAImage.prototype.getPixel = function(x, y) {
    "use strict";
    x = Math.min(Math.max(0, x), this.w - 1);
    y = Math.min(Math.max(0, y), this.h - 1);
    var idx = (y * this.w + x) * 4;
    return new Color(
        this.data[idx + 0],
        this.data[idx + 1],
        this.data[idx + 2],
        this.data[idx + 3]
    );
};

RGBAImage.prototype.sample = function(x, y) {
    "use strict";
    var w = this.w;
    var h = this.h;
    var ty = Math.floor(y);
    var dy = Math.ceil(y);

    var lx = Math.floor(x);
    var rx = Math.ceil(x);

    var fx = x - lx;
    var fy = y - ty;

    var c = this.getPixel(lx, ty).mul((1 - fy) * (1 - fx))
        .add(this.getPixel(lx, dy).mul(fy * (1 - fx)))
        .add(this.getPixel(rx, ty).mul((1 - fy) * fx))
        .add(this.getPixel(rx, dy).mul(fy * fx));

    c.clamp();

    return c;
};

RGBAImage.prototype.setPixel = function(x, y, c) {
    "use strict";
    var idx = (y * this.w + x) * 4;
    this.data[idx] = c.r;
    this.data[idx + 1] = c.g;
    this.data[idx + 2] = c.b;
    this.data[idx + 3] = c.a;
};

/* get RGBA image data from the passed image object */
RGBAImage.fromImage = function(cvs) {
    "use strict";
    var w = cvs.width;
    var h = cvs.height;
    var ctx = cvs.getContext("2d");
    var imgData = ctx.getImageData(0, 0, w, h);
    var newImage = new RGBAImage(w, h, imgData.data);
    imgData = null;

    return newImage;
};

var ImageLoader = function() {
    "use strict";
    this.result = undefined;
    this.loadImage = function(imgsrc, cvs) {
        var that = this;
        // create an Image object  
        var img = new Image();
        img.onload = function() {
            that.result = RGBAImage.fromImage(img, cvs);
            that.result.render(cvs);
        };
        img.src = imgsrc;
    };
};

/* creative a imageData for html canvas*/
RGBAImage.prototype.toImageData = function(ctx) {
    "use strict";
    var imgData = ctx.createImageData(this.w, this.h);
    try {
        imgData.data.set(this.data);
    } catch (err) {
        var lenght = imgData.width * imgData.height * 4;
        for (var i = 0; i < lenght; i++) {
            imgData.data[i] = this.data[i];
        }
    }
    return imgData;
};

/* render the image to the passed canvas */
RGBAImage.prototype.render = function(cvs) {
    "use strict";
    cvs.width = this.w;
    cvs.height = this.h;
    var ctx = cvs.getContext("2d");
    ctx.putImageData(this.toImageData(ctx), 0, 0);
};

/* operate per pixel */
RGBAImage.prototype.map = function(f) {
    "use strict";
    for (var y = 0; y < this.h; y++) {
        for (var x = 0; x < this.w; x++) {
            this.setPixel(x, y, f(this.getPixel(x, y)));
        }
    }
    return this;
};

/* operate per pixel */
RGBAImage.prototype.fun = function(f) {
    "use strict";
    for (var y = 0; y < this.h; y++) {
        for (var x = 0; x < this.w; x++) {
            f(this.getPixel(x, y));
        }
    }
    return this;
};