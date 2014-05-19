/*图像的所有操作接口*/
var filters = {
    //灰度图
    grayscale: function(src) {
        "use strict";
        if (src.type === 'RGBAImage') {
            return src.map(function(c) {
                var lev = Math.round((c.r * 299 + c.g * 587 + c.b * 114) / 1000); //权值系数法
                c.r = c.g = c.b = lev;
                return c;
            });
        } else {
            throw "Not a RGBA image!";
        }
    },
    //对数变换
    logarithmic: function(src, val) {
        "use strict";
        if (src.type === 'RGBAImage') {
            return src.map(function(c) {
                var lev = Math.round((c.r * 299 + c.g * 587 + c.b * 114) / 1000);
                lev = lev / 255;
                lev = Math.round(Math.log(1 + (val - 1) * lev) / Math.log(val) * 255);
                c.r = c.g = c.b = lev;
                return c.clamp();
            });
        } else {
            throw "Not a RGBA image!";
        }
    },
    //伽玛变换
    gamma: function(src, val) {
        "use strict";
        if (src.type === 'RGBAImage') {
            return src.map(function(c) {
                var lev = Math.round((c.r * 299 + c.g * 587 + c.b * 114) / 1000);
                lev = lev / 255;
                lev = Math.round(Math.pow(lev, val) * 255);
                c.r = c.g = c.b = lev;
                return c.clamp();
            });
        } else {
            throw "Not a RGBA image!";
        }
    },
    //灰度拉伸
    stretch: function(src, s, e) {
        "use strict";
        if (src.type === 'RGBAImage') {
            return src.map(function(c) {
                var lev = c.r;
                if (lev < s) {
                    lev = 0;
                } else if (lev > e) {
                    lev = 255;
                } else {
                    lev = (lev - s) * 255 / (e - s)
                }
                c.r = c.g = c.b = lev;
                return c.clamp();
            });
        } else {
            throw "Not a RGBA image!";
        }
    },
    //图像反转
    invert: function(src) {
        "use strict";
        return src.map(function(c0) {
            var c = new Color(255, 255, 255, c0.a).subc(c0);
            return c.clamp();
        });
    },
    //亮度 (brightness)
    brightness: function(src, val) {
        "use strict";
        if (src.type === 'RGBAImage') {
            var dc = new Color(val, val, val, 0);
            return src.map(function(c) {
                var nc = c.add(dc);
                return nc.clamp();
            });
        } else {
            throw "Not a RGBA image!";
        }
    },
    //对比度 (contrast)
    contrast: function(src, val) {
        "use strict";
        if (src.type === 'RGBAImage') {
            var factor = Math.max((128 + val) / 128, 0);
            return src.map(function(c0) {
                var c = c0.mul(factor);
                return c.clamp();
            });
        } else {
            throw "Not a RGBA image!";
        }
    },
    //亮度和对比度 (brightness and contrast)
    brightnesscontrast: function(src, alpha, beta) {
        "use strict";
        if (src.type === 'RGBAImage') {
            var factor = Math.max((128 + alpha) / 128, 0);
            var dc = new Color(beta, beta, beta, 0);
            return src.map(function(c0) {
                var c = c0.mulc(factor).add(dc);
                return c.clamp();
            });
        } else {
            throw "Not a RGBA image!";
        }
    },
    //直方图均衡 (histogram equalization)
    histogram: function(src) {
        "use strict";
        if (src.type === 'RGBAImage') {

            // histogram equalization, blended with orignal image  
            // amount is between 0 and 1  
            var h = src.h,
                w = src.w;
            var gimg = filters.grayscale(src);

            // build histogram (pdf)  
            var hist = histogram(gimg, 0, 0, w, h);

            // compute cdf  
            var cumuhist = buildcdf(hist);

            // normalize cdf  
            var total = cumuhist[255];
            for (var i = 0; i < 256; i++) {
                cumuhist[i] = Math.round(cumuhist[i] / total * 255.0); // multiply 255.0 to reduce computation  
            }
            // equalize  
            return src.map(function(c0) {
                var lev = Math.round((c0.r * 299 + c0.g * 587 + c0.b * 114) / 1000); // original level  
                var cI = cumuhist[lev]; // mapped level  
                var ratio = cI / lev; // use the ratio to change the image  
                return c0.mulc(ratio).clamp().round();
            });
        } else {
            throw "Not a RGBA image!";
        }
    },
    //自适应直方图均衡 (adaptive histogram equalization)
    ahe: function(src) {
        "use strict";
        // find a good window size  
        var h = src.h,
            w = src.w;

        // tile size  
        var tilesize = [64, 64];

        // number of bins  
        var num_bins = 256;

        // number of tiles in x and y direction  
        var xtiles = Math.ceil(w / tilesize[0]);
        var ytiles = Math.ceil(h / tilesize[1]);

        var cdfs = new Array(ytiles);
        for (var i = 0; i < ytiles; i++) {
            cdfs[i] = new Array(xtiles);
        }

        var inv_tile_size = [1.0 / tilesize[0], 1.0 / tilesize[1]];

        var binWidth = 256 / num_bins;

        var gimg = filters.grayscale(src);

        // create histograms  
        for (i = 0; i < ytiles; i++) {
            var y0 = i * tilesize[1];
            var y1 = Math.min(y0 + tilesize[1], h);
            for (var j = 0; j < xtiles; j++) {
                var x0 = j * tilesize[0];
                var x1 = Math.min(x0 + tilesize[0], w);
                var hist = histogram(gimg, x0, y0, x1, y1, num_bins);

                var cdf = buildcdf(hist);

                var total = cdf[255];
                for (var k = 0; k < 256; k++) {
                    cdf[k] = Math.round(cdf[k] / total * 255.0);
                }
                cdfs[i][j] = cdf;
            }
        }

        var dst = new RGBAImage(w, h);

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                // intensity of current pixel  
                var I = gimg.getPixel(x, y).r;

                // bin index  
                var bin = Math.floor(I / binWidth);

                // current tile  
                var tx = x * inv_tile_size[0] - 0.5;
                var ty = y * inv_tile_size[1] - 0.5;

                var xl = Math.max(Math.floor(tx), 0);
                var xr = Math.min(xl + 1, xtiles - 1);

                var yt = Math.max(Math.floor(ty), 0);
                var yd = Math.min(yt + 1, ytiles - 1);

                var fx = tx - xl;
                var fy = ty - yt;

                var cdf11 = cdfs[yt][xl][bin];
                var cdf12 = cdfs[yd][xl][bin];
                var cdf21 = cdfs[yt][xr][bin];
                var cdf22 = cdfs[yd][xr][bin];

                // bilinear interpolation  
                var Iout = (1 - fx) * (1 - fy) * cdf11 + (1 - fx) * fy * cdf12 + fx * (1 - fy) * cdf21 + fx * fy * cdf22;

                var ratio = Iout / I;
                var c = src.getPixel(x, y).mulc(ratio).clamp();
                dst.setPixel(x, y, c);
            }
        }
        return dst;
    },
    //伪彩色处理
    restoration: function(src, method) {
        "use strict";
        if (src.type !== 'RGBAImage') {
            throw "Not a RGBA image!";
        }
        switch (method) {
            case 'perception':
                {
                    return src.map(function(c0) {
                        var I = c0.r;
                        if (I > 0) {
                            I = I;
                        };
                        var H = I * 2 * Math.PI / 256;
                        var S = 0;
                        if (c0.r <= 127) {
                            S = 1.5 * c0.r;
                        } else {
                            S = 1.5 * (256 - c0.r);
                        }
                        var v1 = S * Math.cos(H);
                        var v2 = S * Math.sin(H);

                        c0.r = Math.round(I - 0.204124 * v1 + 0.612372 * v2);
                        c0.g = Math.round(I - 0.204124 * v1 + 0.612372 * v2);
                        c0.b = Math.round(I + 0.408248 * v2);
                        return c0.clamp();
                    });
                }
                break;
            case 'Rainbow':
                {
                    return src.map(function(c0) {
                        if (c0.r <= 63) {
                            c0.r = 0;
                            c0.g = 0;
                            c0.b = c0.b * 4;
                        } else if (c0.r <= 127) {
                            c0.r = 0;
                            c0.g = (c0.g - 63) * 4;
                            c0.b = (127 - c0.b) * 4;
                        } else if (c0.r <= 191) {
                            c0.r = (c0.r - 127) * 4;
                            c0.g = 255;
                            c0.b = 0;
                        } else {
                            c0.r = 255;
                            c0.g = (255 - c0.g) * 4;
                            c0.b = 0;
                        }
                        return c0.clamp();
                    });
                }
                break;
            case 'hotmetal':
                {
                    return src.map(function(c0) {
                        if (c0.r <= 63) {
                            c0.r = 0;
                            c0.g = 0;
                            c0.b = 4 * c0.b;
                        } else if (c0.r <= 95) {
                            c0.r = 4 * (c0.r - 63);
                            c0.g = 0;
                            c0.b = 255;
                        } else if (c0.r < 128) {
                            c0.r = 4 * (c0.r - 63);
                            c0.g = 0;
                            c0.b = 255 - 8 * (c0.b - 95);

                        } else if (c0.r === 128) {
                            c0.r = 255;
                            c0.g = 0;
                            c0.b = 0;
                        } else if (c0.r <= 191) {
                            c0.r = 255;
                            c0.g = 4 * (c0.g - 128);
                            c0.b = 0;
                        } else {
                            c0.r = 255;
                            c0.g = 255;
                            c0.b = 4 * (c0.b - 191);
                        }
                        return c0.clamp();
                    });
                }
                break;
        }
    },
    //图像减色
    reduction: function(src, method, colors) {
        switch (method) {
            case 'uniform':
                {
                    var levs = Math.ceil(Math.pow(colors, 1.0 / 3.0));
                    return src.map(function(c0) {
                        c0.r = Math.round(Math.round((c0.r / 255.0) * levs) / levs * 255.0);
                        c0.g = Math.round(Math.round((c0.g / 255.0) * levs) / levs * 255.0);
                        c0.b = Math.round(Math.round((c0.b / 255.0) * levs) / levs * 255.0);
                        return c0;
                    });
                }
            case 'population':
                {
                    var hist = colorHistogram(src, 0, 0, src.w, src.h);
                    var rcdf = normalizecdf(buildcdf(hist[0]));
                    var gcdf = normalizecdf(buildcdf(hist[1]));
                    var bcdf = normalizecdf(buildcdf(hist[2]));

                    var levels = Math.ceil(Math.pow(colors, 1.0 / 3.0));

                    // get sample points using CDF
                    var genSamples = function(cdf) {
                        var pts = [];
                        var step = (1.0 - cdf[0]) / levels;

                        for (var j = 0; j <= levels; j++) {
                            var p = step * j + cdf[0];
                            for (var i = 1; i < 256; i++) {
                                if (cdf[i - 1] <= p && cdf[i] >= p) {
                                    pts.push(i);
                                    break;
                                }
                            }
                        }
                        return pts;
                    };

                    // sample points in each channel
                    var rPoints = genSamples(rcdf),
                        gPoints = genSamples(gcdf),
                        bPoints = genSamples(bcdf);

                    // assemble the samples to a color table
                    return src.map(function(c0) {
                        // find closet r sample point
                        c0.r = findClosest(c0.r, rPoints);

                        // find closet g sample point
                        c0.g = findClosest(c0.g, gPoints);

                        // find closet b sample point
                        c0.b = findClosest(c0.b, bPoints);

                        return c0;
                    });
                }
                break;
        }
    },
    //滤镜
    spatialfilter: function(src, f) {
        "use strict";
        // source image size
        var w = src.w,
            h = src.h;
        // filter size
        var wf = Math.floor((f.width - 1) / 2);
        var hf = Math.floor((f.height - 1) / 2);
        // filter weights
        var weights = f.weights;
        var bias = f.bias;
        // inverse of the scaling factor( sum of weights )
        var invfactor = 1.0 / f.factor;

        // fast implementation
        var dst = new RGBAImage(w, h);
        var srcdata = src.data;
        var round = Math.round;
        for (var y = 0, idx = 3; y < h; ++y) {
            for (var x = 0; x < w; ++x, idx += 4) {
                var r = 0,
                    g = 0,
                    b = 0;
                for (var i = -hf, fi = 0, fidx = 0; i <= hf; ++i, ++fi) {
                    var py = clamp(i + y, 0, h - 1);
                    for (var j = -wf, fj = 0; j <= wf; ++j, ++fj, ++fidx) {
                        var px = clamp(j + x, 0, w - 1);
                        var pidx = (py * w + px) * 4;
                        var wij = weights[fidx];
                        r += srcdata[pidx] * wij;
                        g += srcdata[++pidx] * wij;
                        b += srcdata[++pidx] * wij;
                    }
                }
                r = round(clamp(r * invfactor + bias, 0, 255));
                g = round(clamp(g * invfactor + bias, 0, 255));
                b = round(clamp(b * invfactor + bias, 0, 255));

                dst.setPixel(x, y, new Color(r, g, b, srcdata[idx]));
            }
        }
        return dst;
    }
};