"use strict";

const WebSocket = require("ws");
const args = process.argv.slice(2);

const sock = new WebSocket.Server({port: args[0]});
console.log("animatromo game server");
log("server", `started on port ${args[0]}`);

const animatromo_moves = [[3, 4], [5], [1, 4, 6], [1, 3, 5], [2, 4, 6], [3, 5, 7], [6]];
const animatromo_start = [4, 6];
const attacks = 5;
const attack_pos = [1, 2, 5, 7];

var players = {host: false, peer: false};
var game = {
    started: false,
    guard: undefined,
    animatromo: undefined,
    left_door_open: true,
    right_door_open: true,
    vent_open: true,
    animatromos: [{pos: animatromo_start[0], atk: 0, atk_time: 5, exposure: 0}, {pos: animatromo_start[1], atk: 0, atk_time: 5, exposure: 0}],
    attacks_left: attacks,
    attack_success: false
};

sock.on("connection", (conn) => {
    if (players.host == false) {
        conn.send(`CONNECTED:host`);
        log("server", `host connected`);
        conn.mode = "host";
        conn.alive = true;
        players.host = true;
    }
    else if (players.peer == false) {
        conn.send(`CONNECTED:peer`);
        log("server", `peer connected`);
        conn.mode = "peer";
        conn.alive = true;
        players.peer = true;
    }
    else {
        log("server", "connection thwarted");
        conn.send(`THWARTED`);
        conn.close();
    }

    conn.on("message", (data) => {
        if (typeof(data) != "string") return;
        data = data.split(":");
        switch (data[0]) {
            case "HEARTBEAT":
                conn.alive = true;
                break;
        }

        sock.clients.forEach((conn) => {
            switch (conn.mode) {
                case game.guard:
                    let valid;
                    switch (data[0]) {
                        case "LEFT_DOOR_CLOSED":
                            valid = false;
                            for (let i of game.animatromos) {
                                if (i.atk == 1 && i.pos == 1) {
                                    valid = true;
                                    sock.clients.forEach((conn) => {
                                        if (conn.mode == game.animatromo) {
                                            log("guard", "left door closed");
                                            game.left_door_open = false;
                                            conn.send("LEFT_DOOR:closed");
                                            setTimeout(() => {
                                                log("guard", "left door opened");
                                                game.left_door_open = true; 
                                                conn.send("LEFT_DOOR:open");
                                            }, 4000);   
                                        }
                                    });
                                }
                            }
                            if (valid == false) {
                                log("guard", `invalid block`);
                                if (game.attack_success == false) {
                                    game.attack_success = true;
                                    sock.clients.forEach((conn) => {
                                        conn.send(`ATTACK_SUCCESS:0`);
                                    });
                                }
                                reset();
                                return;
                            }
                            break;
                        case "RIGHT_DOOR_CLOSED":
                            valid = false;
                            for (let i of game.animatromos) {
                                if (i.atk == 1 && i.pos == 2) {
                                    valid = true;
                                    sock.clients.forEach((conn) => {
                                        if (conn.mode == game.animatromo) {
                                            log("guard", "right door closed");
                                            game.right_door_open = false;
                                            conn.send("RIGHT_DOOR:closed");
                                            setTimeout(() => {
                                                log("guard", "right door opened");
                                                game.right_door_open = true;
                                                conn.send("RIGHT_DOOR:open");
                                            }, 4000);
                                        }
                                    });
                                }
                            }
                            if (valid == false) {
                                log("guard", `invalid block`);
                                if (game.attack_success == false) {
                                    game.attack_success = true;
                                    sock.clients.forEach((conn) => {
                                        conn.send(`ATTACK_SUCCESS:0`);
                                    });
                                }
                                reset();
                                return;
                            }
                            break;
                        case "VENT_CLOSED":
                            valid = false;
                            for (let i of game.animatromos) {
                                if (i.atk == 1 && i.pos == 5) {
                                    valid = true;
                                    sock.clients.forEach((conn) => {
                                        if (conn.mode == game.animatromo) {
                                            log("guard", "vent closed");
                                            game.vent_open = false;
                                            conn.send("VENT:closed");
                                            setTimeout(() => {
                                                log("guard", "vent opened");
                                                game.vent_open = true;
                                                conn.send("VENT:open");
                                            }, 4000);
                                        }
                                    });
                                }
                                else if (i.atk == 1 && i.pos == 7) {
                                    valid = true;
                                    sock.clients.forEach((conn) => {
                                        if (conn.mode == game.animatromo) {
                                            log("guard", "vent closed");
                                            game.vent_open = false;
                                            conn.send("VENT:closed");
                                            setTimeout(() => {
                                                log("guard", "vent opened");
                                                game.vent_open = true;
                                                conn.send("VENT:open");
                                            }, 4000);
                                        }
                                    });
                                }
                            }
                            if (valid == false) {
                                log("guard", `invalid block`);
                                if (game.attack_success == false) {
                                    game.attack_success = true;
                                    sock.clients.forEach((conn) => {
                                        conn.send(`ATTACK_SUCCESS:0`);
                                    });
                                }
                                reset();
                                return;
                            }
                            break;
                    }
                    break;
                case game.animatromo:
                    switch (data[0]) {
                        case "MOVE":
                            let occupied = false;
                            for (let i of game.animatromos) {
                                if (data[2] == i.pos) {
                                    occupied = true;
                                }
                            }
                            if (occupied == false && animatromo_moves[game.animatromos[data[1]].pos - 1].includes(parseInt(data[2])) && game.animatromos[data[1]].atk == 0) {
                                log("animatromo", `${data[1]} moved to room ${data[2]}`);
                                game.animatromos[data[1]].pos = parseInt(data[2]);
                                sock.clients.forEach((conn) => {
                                    conn.send(`MOVED:${data[1]}:${data[2]}`);
                                });
                            }
                            break;
                        case "ATTACK":
                            if (game.animatromos[data[1]].atk == 0 && attack_pos.includes(parseInt(game.animatromos[data[1]].pos)) && game.attacks_left > 0) {
                                game.attacks_left--;
                                conn.send(`ATTACKS_LEFT:${game.attacks_left}`);
                                log("animatromo", `attacks left ${game.attacks_left}`);

                                log("animatromo", `${data[1]} attacking room ${game.animatromos[data[1]].pos}`);
                                game.animatromos[data[1]].atk = 1;
                                sock.clients.forEach((conn) => {
                                    conn.send(`ATTACK:${data[1]}:${game.animatromos[data[1]].atk}`);
                                });

                                game.animatromos[data[1]].atk_current_time = game.animatromos[data[1]].atk_time;
                                game.animatromos[data[1]].atk_timer = setInterval(() => {
                                    if (game.animatromos[data[1]].pos == 1 && game.left_door_open == true) {
                                        game.animatromos[data[1]].exposure++;
                                    }
                                    else if (game.animatromos[data[1]].pos == 2 && game.right_door_open == true) {
                                        game.animatromos[data[1]].exposure++;
                                    }
                                    else if (game.animatromos[data[1]].pos == 5 || game.animatromos[data[1]].pos == 7) {
                                        if (game.vent_open == true) {
                                            game.animatromos[data[1]].exposure++;
                                        }
                                    }

                                    log("animatromo", `${data[1]} exposure of ${game.animatromos[data[1]].exposure}`);

                                    if (game.animatromos[data[1]].exposure >= 3) {
                                        log("animatromo", `${data[1]} attack success`);
                                        if (game.attack_success == false) {
                                            game.attack_success = true;
                                            sock.clients.forEach((conn) => {
                                                conn.send(`ATTACK_SUCCESS:${data[1]}`);
                                            });
                                        }
                                        game.animatromos[data[1]].exposure = 0;
                                        clearInterval(game.animatromos[data[1]].atk_timer);
                                        reset();
                                        return;
                                    }

                                    if (game.animatromos[data[1]].atk_current_time > 0) {
                                        game.animatromos[data[1]].atk_current_time--;
                                    }
                                    else {
                                        log("animatromo", `${data[1]} attack timer depleted`);
                                        game.animatromos[data[1]].atk = 0;
                                        if (game.attacks_left == 0) {
                                            log("guard", "success");
                                            sock.clients.forEach((conn) => {
                                                conn.send(`GUARD_SUCCESS`);
                                            });
                                            game.animatromos[data[1]].exposure = 0;
                                            clearInterval(game.animatromos[data[1]].atk_timer);
                                            reset();
                                            return;
                                        }
                                        else {
                                            sock.clients.forEach((conn) => {
                                                conn.send(`ATTACK:${data[1]}:0`);
                                            });
                                        }
                                        game.animatromos[data[1]].exposure = 0;
                                        clearInterval(game.animatromos[data[1]].atk_timer);
                                    }
                                }, 1000);
                            }
                            break;
                    }
                    break;
            }
            
            switch (data[0]) {
                case "CHOICE":
                    if (conn.mode == "host") {
                        switch (data[1]) {
                            case "guard":
                                game.guard = "host";
                                game.animatromo = "peer";
                                break;
                            case "animatromo":
                                game.animatromo = "host";
                                game.guard = "peer";
                                break;
                        }
                    }
                    break;
                case "START":
                    if (conn.mode == "host" && players.host == true && players.peer == true && game.guard != undefined && game.animatromo != undefined && game.started == false) {
                        game.started = true;
                        switch (game.guard) {
                            case "host":
                                conn.send("SET:guard");
                                sock.clients.forEach((conn) => {
                                    if (conn.mode == "peer") {
                                        conn.send("SET:animatromo");
                                    }
                                });
                                break;
                            case "peer":
                                conn.send("SET:animatromo");
                                sock.clients.forEach((conn) => {
                                    if (conn.mode == "peer") {
                                        conn.send("SET:guard");
                                    }
                                });
                                break;
                        }
                    }
                    break;
            }
        });
    });

    conn.heartbeat = setInterval(() => {
        if (conn.alive == false) {
            switch (conn.mode) {
                case "host":
                    sock.clients.forEach((conn) => {
                        if (conn.mode == "peer") {
                            conn.alive = false;
                            clearInterval(conn.heartbeat);
                            conn.send("OPPONENT_DISCONNECT");
                            conn.close();
                        }
                    });
                    break;
                case "peer":
                    sock.clients.forEach((conn) => {
                        if (conn.mode == "host") {
                            conn.alive = false;
                            clearInterval(conn.heartbeat);
                            conn.send("OPPONENT_DISCONNECT");
                            conn.close();
                        }
                    });
                    break;
            }
            for (let player in players) {players[player] = false;}

            reset();

            conn.close();
            clearInterval(conn.heartbeat);
        }
        else {
            conn.alive = false;
            conn.send("HEARTBEAT");
        }
    }, 1000);
});

function log(sender, msg) {
    console.log(`[${sender}] => ${msg}`);
}

function reset() {
    /*game.started = false;
    game.guard = undefined;
    game.animatromo = undefined;
    game.left_door_open = true;
    game.right_door_open = true;
    game.vent_open = true;
    game.animatromos = [{pos: animatromo_start[0], atk: 0, atk_time: 5, atk_current_time: undefined, exposure: 0}, {pos: animatromo_start[1], atk: 0, atk_time: 5, atk_current_time: undefined, exposure: 0}];
    game.attacks_left = attacks;
    game.attack_success = false*/
    game = {
        started: false,
        guard: undefined,
        animatromo: undefined,
        left_door_open: true,
        right_door_open: true,
        vent_open: true,
        animatromos: [{pos: animatromo_start[0], atk: 0, atk_time: 5, exposure: 0}, {pos: animatromo_start[1], atk: 0, atk_time: 5, exposure: 0}],
        attacks_left: attacks,
        attack_success: false
    };
}