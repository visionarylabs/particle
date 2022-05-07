/**
    Particle System
**/

// main game setup vars
var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext("2d");
var w = window;
// Cross-browser support for requestAnimationFrame
var requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

var tools = {};

// game timing vars
var time = {
    start : performance.now(),
    current : 0,
    now : performance.now(),
    then : performance.now(),
    modifier : 0,
    delta : 0,
}

// game environment vars
var config = {
    gameSpeed : 1, //multipy the delta
    speedVar : 50, //multipy the particle velocity
    gravity : 96,
    particleDirection : 0,
    particleRange : 360,
    airWeight : 1,
    mouseGravityRange : 100,
    mouseGravity : .5,
    emiterDefault : {
        x : 0,
        y : 0,
        velx : 20,
        vely : 20,
        rateOfParticles : 10,
        lastParticle : 0,
        createTime : 0,
        destroy : false,
    },
    particleDefault : {
        r : 200,
        g : 100,
        b : 200,
        opacity : .5,
        decayStart : 10 * 1000, //s * ms
        decayEnd : 600 * 1000, //s * ms
    }
}

var sprites = {
    particles : new Array(),
    emiters : new Array(),
};

var state = {
    mousePos : {},
    lowestFps : 1000,
}

//start the game
var init = function(){

    canvas.width = 800;
    canvas.height = 600;
    canvas.id = 'game-canvas';
    canvas.onselectstart = function () { return false; } //stop text select on double click
    canvas.addEventListener('mousemove', function(e) {
        state.mousePos = tools.getMousePos(canvas,e);
    });

    tools = new toolsObject();
    sprites.emiters.push(makeEmiter(1,canvas.width/2,canvas.height/2));
    sprites.emiters.push(makeEmiter(2,canvas.width/4,canvas.height/4));

    mainLoop();
};

var makeEmiter = function(type,x,y){

    var type = type;

    var emiterConfig = {};
    var particleConfig = {};

    emiterConfig = {
        x : 0,
        y : 0,
        velx : 20,
        vely : 20,
        rateOfParticles : 10,
        lastParticle : 0,
        createTime : 0,
        destroy : false,
    },
    particleConfig = {
        r : 200,
        g : 100,
        b : 200,
        opacity : .5,
        decayStart : 10 * 1000, //s * ms
        decayEnd : 600 * 1000, //s * ms
    }

    emiterConfig.x = x;
    emiterConfig.y = y;
    emiterConfig.createTime = time.now;

    if(type == 2){
        emiterConfig.vely = -250;
        emiterConfig.velx = -250;
        emiterConfig.rateOfParticles = 20;
        particleConfig.r = 0;
    }

    var addParticle = function(){
        if( emiterConfig.lastParticle < time.now - (emiterConfig.rateOfParticles) ){
            sprites.particles.push( makeParticle(type,emiterConfig.x,emiterConfig.y,particleConfig) );
            emiterConfig.lastParticle = time.now;
        }
    }

    return{
        type : type,
        emiterConfig : emiterConfig, //emiter settings
        addParticle : addParticle,
    }
}


var makeParticle = function(type,x,y,pconfig){

    var thisSpeed = ( Math.random() * config.speedVar) + config.speedVar;
    var direction = ( Math.random() - .5 ) * config.particleRange + config.particleDirection;
    var size = tools.randomRange(1,8);
    var weight = 2;

    var particle = {
        type : type,
        x : x,
        y : y,
        weight : weight,
        buoyancy : (config.airWeight - weight),
        mouseDistance : null,
        velx : Math.cos(Math.PI * direction / 180) * thisSpeed,
        vely : Math.sin(Math.PI * direction / 180) * thisSpeed,
        width : size,
        height : size,
        color : "",
        r : pconfig.r,
        g : pconfig.g,
        b : pconfig.b,
        opacity : pconfig.opacity,
        decayStart : pconfig.decayStart,
        decayEnd : pconfig.decayEnd,
        createTime : time.now,
        destroy : false,
    }

    return particle;

};

// Check inputs for how to update sprites
var update = function (modifier) {

    var i;

    //EMITER LOOP
    //each emiter tries to create a particle
    //update velocity of each emiter
    var e;
    for(i = sprites.emiters.length - 1; i >= 0; i--){

        e = sprites.emiters[i];
        e.addParticle();

        e.emiterConfig.x += e.emiterConfig.velx * modifier;
        e.emiterConfig.y += e.emiterConfig.vely * modifier;

        if(e.emiterConfig.x > canvas.width || e.emiterConfig.x < 0){
            e.emiterConfig.velx = e.emiterConfig.velx * -1;
        }
        if(e.emiterConfig.y > canvas.height || e.emiterConfig.y < 0){
            e.emiterConfig.vely = e.emiterConfig.vely * -1;
        }

    }

    //PARTICLE LOOP
    //update the velocity and position of each particle
    var p;
    var r,g,b,opacity;
    for(i = sprites.particles.length - 1; i >= 0; i--){

        p = sprites.particles[i];

        //GRAVITY / BOUYANCY
        p.vely -= config.gravity * modifier * p.buoyancy;

        //MOUSE GRAVITY
        p.mouseDistance = tools.getDistance(state.mousePos.x - p.x,state.mousePos.y - p.y)

        if(p.mouseDistance < config.mouseGravityRange ){
            p.velx += (config.mouseGravityRange - p.mouseDistance) * (state.mousePos.x - p.x) * modifier * config.mouseGravity;
            p.vely += (config.mouseGravityRange - p.mouseDistance) * (state.mousePos.y - p.y) * modifier * config.mouseGravity;
        }

        //opacity = (200-p.mouseDistance)/200;
        opacity = Math.abs(p.createTime - time.now) / (p.decayEnd - p.decayStart);
        r = 300 - p.mouseDistance;
        g = 100 + p.mouseDistance;
        b = 100;

        if(opacity > 1){
            opacity = 1;
        }else{
            opacity = 1 - opacity;
        }

        if(opacity <= .01){
            opacity = 0;
            p.destroy = true;
        }

        //COLOR
        p.color = "rgba("+ p.r +","+ p.g +","+p.b+","+ opacity +")";
        //change color if in mouse gravity
        if(p.mouseDistance < config.mouseGravityRange){
            p.color = "rgba("+ p.r +","+ g +","+ p.b +","+ opacity +")";
        }

        //change color for slow particles
        //if( ( Math.abs(p.velx) + Math.abs(p.vely) ) < 50){
        //    p.color = "rgb(100,100,200)";
        //}

        //position the particle
        p.x += p.velx * modifier;
        p.y += p.vely * modifier;

        //destroy particles off the edge
        if(p.y < -canvas.height || p.x < -canvas.width || p.x > 2 * canvas.width || p.y > 2 * canvas.height){
            p.destroy = true;
        }

        //if destroy is set remove it from the list
        if(p.destroy == true){
            sprites.particles.splice(i,1);
        }

        if(Math.ceil(1000/time.delta) < state.lowestFps){
            state.lowestFps = Math.ceil(1000/time.delta);
        }


    }

};

// Draw everything
var render = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showText();
    showSprites();
};

// game sprites
var showSprites = function(){
    //draw particles
    var p = null;
    for(i=0;i<sprites.particles.length;i++){
        p = sprites.particles[i];
        //set color
        ctx.fillStyle = p.color;
        //ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.width, 0, 2 * Math.PI,false);
        ctx.fill();
    }
};

// game ui
var showText = function(){
    ctx.fillStyle = "white";
    ctx.font = "normal 11pt Verdana";
    ctx.textAlign = "left";

    //Title
    ctx.fillText("Particle", 10, 26);

    //Info
    ctx.fillText('fps: ' + Math.ceil(1000/time.delta), 10, 56);
    ctx.fillText('lowest fps: ' + state.lowestFps, 10, 76);
    ctx.fillText('particles: ' + Math.ceil(sprites.particles.length), 10, 96);
    //ctx.fillText('pps: ' + Math.ceil(1000/config.rateOfParticles), 10, 116);
    ctx.fillText('s: ' + Math.ceil(time.current), 10, 136);
};

var processTick = function (time) {
    //every 10 sec encounter
    if( time % 10 === 0 ){
    }
}

// The main game loop
var mainLoop = function () {
    time.now = performance.now(); //in miliseconds
    time.delta = time.now - time.then;
    time.modifier = time.delta / 1000; //modifier in seconds
    time.modifier = time.modifier * config.gameSpeed;
    time.current = Math.floor( (time.then - time.start) / 1000 );
    update(time.modifier);
    render();

    time.then = time.now;

    // Request to do this again ASAP
    requestAnimationFrame(mainLoop);
};

var toolsObject = function(){
    var getMousePos = function (canvas,e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.floor(e.clientX - rect.left),
            y: Math.floor(e.clientY - rect.top)
        };
    }
    var getDistance = function(x,y){
        var dist = Math.sqrt( Math.pow(x,2) + Math.pow(y,2) );
        return dist;
    }
    var randomRange = function (min,max){ 
        return (Math.floor(Math.random() * (max - min + 1) ) + min);
    }
    return {
        getMousePos : getMousePos,
        getDistance : getDistance,
        randomRange : randomRange
    }
}

// Let's play this game!
init();