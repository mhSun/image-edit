
/* build histogram of specifid image region */

function histogram(img, x1, y1, x2, y2, num_bins) {
    "use strict";
    if (num_bins === undefined) {
        num_bins = 256;
    }

    var w = img.w;
    var h = img.h;
    var hist = [];
    for (var i = 0; i < num_bins; i++) {
        hist[i] = 0;
    }
    for (var y = y1; y < y2; y++) {
        for (var x = x1; x < x2; x++) {
            var idx = (y * w + x) * 4;
            var val = Math.floor((img.data[idx] / 255.0) * (num_bins - 1));
            hist[val]++;
        }
    }
    return hist;
}

// build histogram for each channel separately

function colorHistogram(img, x1, y1, x2, y2, num_bins) {
    "use strict";
    if (num_bins === undefined) {
        num_bins = 256;
    }

    var hist = [
        [],
        [],
        []
    ];
    for (var c = 0; c < 3; c++) {
        for (var i = 0; i < num_bins; i++) {
            hist[c][i] = 0;
        }
    }

    for (var y = y1; y < y2; ++y) {
        for (var x = x1; x < x2; ++x) {
            var c0 = img.getPixel(x, y);
            var rval = Math.floor((c0.r / 255.0) * (num_bins - 1));
            var gval = Math.floor((c0.g / 255.0) * (num_bins - 1));
            var bval = Math.floor((c0.b / 255.0) * (num_bins - 1));
            hist[0][rval]++;
            hist[1][gval]++;
            hist[2][bval]++;
        }
    }

    return hist;
}

// list is a sorted list, use binary search

function findClosest(val, list) {
    "use strict";
    var r = list.length - 1;
    var l = 0;

    while (l <= r) {
        var m = Math.round((r + l) / 2);
        if (val > list[m]) {
            l = m + 1;
        } else if (val < list[m]) {
            r = m - 1;
        } else {
            return list[m];
        }
    }

    l = clamp(l, 0, list.length - 1);
    r = clamp(r, 0, list.length - 1);

    if (Math.abs(list[l] - val) < Math.abs(list[r] - val)) {
        return list[l];
    } else {
        return list[r];
    }
}

// find the closest color in a given color map

function findClosestColor(c, colormap) {
    "use strict";
    var minIdx = 0;
    var minDist = c.distance(colormap[0]);
    for (var i = 1; i < colormap.length; ++i) {
        var ci = colormap[i];
        var dist = c.distance(ci);

        if (dist < minDist) {
            minDist = dist;
            minIdx = i;
        }
    }

    return colormap[minIdx];
}

function normalizecdf(cdf, scale, num_bins) {
    "use strict";
    if (num_bins === undefined) {
        num_bins = 256;
    }
    var scale = scale || 1.0;

    var total = cdf[num_bins - 1];
    var ncdf = new Array(num_bins);
    for (var i = 0; i < num_bins; ++i) {
        ncdf[i] = cdf[i] / total * scale;
    }

    return ncdf;
}


// cdf (cumulative distribution function) 累计分布函数
// pdf (probabiility distribution function) 概率分布函数
/* build cdf from given pdf */

function buildcdf(hist, num_bins) {
    "use strict";
    if (num_bins === undefined) {
        num_bins = 256;
    }
    var cumuhist = [];
    cumuhist[0] = hist[0];
    for (var i = 1; i < num_bins; i++) {
        cumuhist[i] = cumuhist[i - 1] + hist[i];
    }
    return cumuhist;
}