/**
    Particle System
**/

// main game setup vars
var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext("2d");
var w = window;
// Cross-browser support for requestAnimationFrame
var requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

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
    gravity : .35,
    particleDirection : 0,
    particleRange : 360,
    rateOfParticles : 20, //rate of spwan per ms
}

var sprites = {
    particles : new Array()
};

var state = {
    lastParticle : 0,
    pos : {},
}

var toolsObject = function(){
    var getMousePos = function (canvas,e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.floor(e.clientX - rect.left),
            y: Math.floor(e.clientY - rect.top)
        };
    }
    return {
        getMousePos : getMousePos
    }
}

var tools = new toolsObject();

var makeParticle = function(type,x,y){
    var thisSpeed = ( Math.random() * config.speedVar) + config.speedVar;
    var direction = ( Math.random() - .5 ) * config.particleRange + config.particleDirection;
 
    var particle = {
        type : type,
        x : x,
        y : y,
        dist : null,
        velx : Math.cos(Math.PI * direction / 180) * thisSpeed,
        vely : Math.sin(Math.PI * direction / 180) * thisSpeed,
        width : 10,
        height : 10,
        color : "rgb(200,200,100)",
        destroy : false,
    }
    return particle;
};

//start the game
var init = function(){
    canvas.width = 800;
    canvas.height = 600;
    canvas.id = 'game-canvas';
    canvas.onselectstart = function () { return false; } //stop text select on double click
    canvas.addEventListener('mousemove', function(e) {
        state.pos = tools.getMousePos(canvas,e);
    });
    mainLoop();
};

// Check inputs for how to update sprites
var update = function (modifier) {


    //check rate and last made particle
    //to see if we should make a new one
    if( state.lastParticle < time.now - (config.rateOfParticles) ){

        //two sample emiters
        //sprites.particles.push( makeParticle(null,state.pos.x,state.pos.y) );
        sprites.particles.push( makeParticle(null,canvas.width/2,canvas.height/2) );

        state.lastParticle = time.now;
    }



    //update the velocity and position of each particle
    var i;
    var p = null;
    for(i = sprites.particles.length - 1; i >= 0; i--){
        p = sprites.particles[i];
        p.vely += config.gravity * modifier;

        p.dist = Math.sqrt( Math.pow( (state.pos.x - p.x),2) + Math.pow( (state.pos.y - p.y),2) );

        if(p.dist < 100 ){
            p.velx += (100 - p.dist) * (state.pos.x - p.x) * modifier * .9;
            p.vely += (100 - p.dist) * (state.pos.y - p.y) * modifier * .9;
        }

        if(p.dist < 100){
            p.color = "rgba(200,100,100,"+(200-p.dist)/200+")";
        }else{
            p.color = "rgba(200,200,100,"+(200-p.dist)/200+")";
        }

        //if( ( Math.abs(p.velx) + Math.abs(p.vely) ) < 50){
        //    p.color = "rgb(100,100,200)";
        //}

        //position the particle
        p.x += p.velx * modifier;
        p.y += p.vely * modifier;
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
        ctx.fillRect(p.x, p.y, p.width, p.height);
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
    ctx.fillText('particles: ' + Math.ceil(sprites.particles.length), 10, 76);
    ctx.fillText('pps: ' + Math.ceil(1000/config.rateOfParticles), 10, 96);
    ctx.fillText('s: ' + Math.ceil(time.current), 10, 116);
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

// Let's play this game!
init();