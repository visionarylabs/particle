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
var emiterFactory = {};

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
    rateOfParticles : 10, //rate of spawn per ms
    airWeight : 1,
}

var sprites = {
    particles : new Array(),
    emiters : new Array(),
};

var state = {
    lastParticle : 0,
    pos : {},
}



//start the game
var init = function(){
    canvas.width = 800;
    canvas.height = 600;
    canvas.id = 'game-canvas';
    canvas.onselectstart = function () { return false; } //stop text select on double click
    canvas.addEventListener('mousemove', function(e) {
        state.pos = tools.getMousePos(canvas,e);
    });
    tools = new toolsObject();

    e = new emiterFactory();
    var em = e.makeEmiter(null,canvas.width/2,canvas.height/2);
    sprites.emiters.push(em);

    var em2 = e.makeEmiter(null,canvas.width/4,canvas.height/4);
    sprites.emiters.push(em2);

    //console.log(sprites.emiters[0]);
    mainLoop();
};

var getDistance = function(x,y){
    var dist = Math.sqrt( Math.pow(x,2) + Math.pow(y,2) );
    return dist;
};

var emiterFactory = function(){

    var makeEmiter = function(type,x,y){

        var prop = {
            type : type,
            x : x,
            y : y,
            velx : 100,
            vely : 0,
            lastParticle : 0,
            createTime : time.now,
            destroy : false,
        }

        var addParticle = function(){
            if( prop.lastParticle < time.now - (config.rateOfParticles) ){
                sprites.particles.push( makeParticle(prop.type,prop.x,prop.y) );
                prop.lastParticle = time.now;
            }
        }
        return{
            prop : prop,
            addParticle : addParticle,
        }
    }
    return {
        makeEmiter : makeEmiter
    }
};


var makeParticle = function(type,x,y){
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
        color : "rgb(200,200,100)",
        createTime : time.now,
        destroy : false,
    }
    return particle;
};

// Check inputs for how to update sprites
var update = function (modifier) {
    
    //check rate and last made particle
    //to see if we should make a new one
    //if( state.lastParticle < time.now - (config.rateOfParticles) ){
        //two sample emiters
        //sprites.particles.push( makeParticle(null,state.pos.x,state.pos.y) );
        //sprites.particles.push( makeParticle(null,canvas.width/2,canvas.height/2) );
        //state.lastParticle = time.now;
    //}

    var i;
    var e = null;

    //EMITER LOOP
    for(i = sprites.emiters.length - 1; i >= 0; i--){
        e = sprites.emiters[i];
        e.addParticle();

        e.prop.x += e.prop.velx * modifier;
        e.prop.y += e.prop.vely * modifier;

        if(e.prop.x > canvas.width || e.prop.x < 0){
            e.prop.velx = e.prop.velx * -1;
        }

    }

    //update the velocity and position of each particle

    var p = null;
    var opacity = 1;
    var mouseGravityRange = 100;
    var mouseGravity = .5;
    var decayStart = 540 * 1000; //s * ms
    var decayEnd = 600 * 1000; //s * ms
    var r = 200
    var g = 200
    
    for(i = sprites.particles.length - 1; i >= 0; i--){
        p = sprites.particles[i];
        p.vely -= config.gravity * modifier * p.buoyancy;
        
        p.mouseDistance = getDistance(state.pos.x - p.x,state.pos.y - p.y)
        
        if(p.mouseDistance < mouseGravityRange ){
            p.velx += (mouseGravityRange - p.mouseDistance) * (state.pos.x - p.x) * modifier * mouseGravity;
            p.vely += (mouseGravityRange - p.mouseDistance) * (state.pos.y - p.y) * modifier * mouseGravity;
        }

        //opacity = (200-p.mouseDistance)/200;
        opacity = Math.abs(p.createTime - time.now) / (decayEnd - decayStart);
        r = 300 - p.mouseDistance
        g = 100 + p.mouseDistance

        if(opacity > 1){
            opacity = 1;
        }else{
            opacity = 1 - opacity;
        }

        if(opacity <= .01){
            opacity = 0;
            p.destroy = true;
        }

        //change color if in mouse gravity
        if(p.mouseDistance < mouseGravityRange){
            p.color = "rgba("+ r +","+ g +",100,"+ opacity +")";
        }else{
            p.color = "rgba(200,200,100,"+ opacity +")";
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

var toolsObject = function(){
    var getMousePos = function (canvas,e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.floor(e.clientX - rect.left),
            y: Math.floor(e.clientY - rect.top)
        };
    }
    var randomRange = function (min,max){ 
        return (Math.floor(Math.random() * (max - min + 1) ) + min);
    }

    return {
        getMousePos : getMousePos,
        randomRange : randomRange
    }
}

// Let's play this game!
init();