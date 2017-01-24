import * as stoppoint from '../service/stoppoint';

export const index = async ctx => {
    ctx.body = await stoppoint.all();
};

export const streamIndex = async ({ emit, disconnect }) => {
    var res = stoppoint.stream(data => {
        emit(data);
    });

    disconnect(() => {
        res.off();
    });
};

export const get = async ctx => {
    ctx.body = await stoppoint.get(
        parseInt(ctx.params.stopPoint)
    );
};

export const departures = async ctx => {
    ctx.body = await stoppoint.departures(
        parseInt(ctx.params.stopPoint),
        parseInt(ctx.params.limit)
    );
};

export const around = async ctx => {
    ctx.body = await stoppoint.around(
        parseFloat(ctx.params.lon),
        parseFloat(ctx.params.lat),
        ctx.params.radius
    );
};

export const box = async ctx => {
    ctx.body = await stoppoint.box(
        parseFloat(ctx.params.swlon),
        parseFloat(ctx.params.swlat),
        parseFloat(ctx.params.nelon),
        parseFloat(ctx.params.nelat)
    );
};

export const search = async ctx => {
    ctx.body = await stoppoint.search(
        ctx.params.searchstring.toLowerCase()
    );
};
