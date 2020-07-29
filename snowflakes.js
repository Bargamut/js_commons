var snowConf = {
    count: 30,
    windspeed: getRandom(1, 3),
    windway: getRandom(-1, 1),
    gravity: 10,
    snowImg: [
        '/pic/decor/snowflakes/single_1.png',
        '/pic/decor/snowflakes/single_2.png',
        '/pic/decor/snowflakes/single_3.png',
        '/pic/decor/snowflakes/single_4.png',
        '/pic/decor/snowflakes/single_5.png',
        '/pic/decor/snowflakes/single_6.png',
        '/pic/decor/snowflakes/single_7.png'
    ],
    fallingInterval: null,
    changeWindInterval: null
};

$(function() {
	initSnowflakes($('body'));
});

function initSnowflakes(obj) {
    var x, y, opt, r;

    for (var i = 0; i < snowConf['count']; i++) {
        x = Math.floor(Math.random() * $(window).width());
        y = Math.floor(Math.random() * $(window).height());

        r   = parseInt(getRandom(0, 6));
        opt = [
            parseInt(getRandom(1, snowConf['gravity'] / 2)),
            getRandom(1, 3),
            getRandom(-1, 1)
        ].join(',');

        obj.append(
            '<img ' +
                'class="snowflake" ' +
                'rel="' + opt + '" ' +
                'src="' + snowConf['snowImg'][r] + '" ' +
                'alt="" ' +
                'style="border: 0px; left: ' + x + 'px; top: ' + y + 'px; position: absolute;" />'
        );
    }

    snowConf['fallingInterval']     = setInterval(function() { move(obj); }, 50);
    snowConf['changeWindInterval']  = setInterval(function() { changeWindOpt(); }, 10000);
}

function move(obj) {
    var x, y, sPos = { left: 0, top: 0};

    $('.snowflake').each(function() {
        var opt         = $(this).attr('rel').split(',');
        var aeroDynamic = parseInt(opt[0]),
            windway     = opt[2] - snowConf['windway'];

        x = parseInt($(this).offset().left + windway + snowConf['windspeed']);
        y = parseInt($(this).offset().top + snowConf['gravity'] / (1 + snowConf['windspeed'] + aeroDynamic));

        if (x > $(window).width() - $(this).outerWidth(true))           { sPos['left'] = x - $(window).width(); }
        else if (x < $(window).scrollLeft() - $(this).outerWidth(true)) { sPos['left'] = $(window).width() - $(this).outerWidth(true); }
        else                                                            { sPos['left'] = x; }

        if (y > $(window).height() + $(window).scrollTop() - $(this).outerHeight(true)) { sPos['top'] = $(window).scrollTop() - $(this).outerHeight(true); }
        else if (y < $(window).scrollTop() - $(this).outerHeight(true))                 { sPos['top'] = y + $(window).height(); }
		else                                                                            { sPos['top'] = y; }

        $(this).offset(sPos);
    });
}

function changeWindOpt() {
    switch(getRandom(0, 2)) {
        case 0: snowConf['windway']     = getRandom(-1, 1); break;
        case 1: snowConf['windspeed']   = getRandom(1, 3); break;
        default:
            snowConf['windway']     = getRandom(-1, 1);
            snowConf['windspeed']   = getRandom(1, 3);
            break;
    }
}

function getRandom(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}