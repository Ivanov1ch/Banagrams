function dashedLine(x1, y1, x2, y2, l, g) {
    let pc = dist(x1, y1, x2, y2) / 100;
    let pcCount = 1;
    let lPercent;
    let currentPos = 0;
    let xx1, xx2, yy1, yy2;

    while (int(pcCount * pc) < l) {
        pcCount++
    }
    lPercent = pcCount;
    pcCount = 1;
    while (int(pcCount * pc) < g) {
        pcCount++
    }
    let gPercent = pcCount;

    lPercent = lPercent / 100;
    gPercent = gPercent / 100;
    while (currentPos < 1) {
        xx1 = lerp(x1, x2, currentPos);
        yy1 = lerp(y1, y2, currentPos);
        xx2 = lerp(x1, x2, currentPos + lPercent);
        yy2 = lerp(y1, y2, currentPos + lPercent);
        if (x1 > x2) {
            if (xx2 < x2) {
                xx2 = x2;
            }
        }
        if (x1 < x2) {
            if (xx2 > x2) {
                xx2 = x2;
            }
        }
        if (y1 > y2) {
            if (yy2 < y2) {
                yy2 = y2;
            }
        }
        if (y1 < y2) {
            if (yy2 > y2) {
                yy2 = y2;
            }
        }

        line(xx1, yy1, xx2, yy2);
        currentPos = currentPos + lPercent + gPercent;
    }
}

function dashedRect(x, y, w, h, line, gap) {
    dashedLine(x, y, x + w, y, line, gap); //Top
    dashedLine(x, y + h, x + w, y + h, line, gap); //Bottom
    dashedLine(x, y, x, y + h, line, gap); //Left
    dashedLine(x + w, y, x + w, y + h, line, gap); //Right
}