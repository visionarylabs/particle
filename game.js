/**
    Particle System
**/
'use strict'
// main game setup vars
var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext("2d");

// Cross-browser support for requestAnimationFrame
var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame;

var tools = {};
var ui = {};

//start the sim
//called at the end of this file
var init = function(){

    canvas.width = 800;
    canvas.height = 600;
    canvas.id = 'game-canvas';
    canvas.onselectstart = function () { return false; } //stop text select on double click
    canvas.addEventListener('mousemove', function(e) {
        state.mousePos = tools.getMousePos(canvas,e);
    });

    tools = new toolsObject();

    //MAKE EMITERS
    sprites.emiters.push( makeEmiter( 1, canvas.width / 2, canvas.height / 2 ) );
    //sprites.emiters.push( makeEmiter( 2, canvas.width / 4, canvas.height / 4 ) );
    //sprites.emiters.push( makeEmiter( 3, canvas.width / 2, canvas.height / 2 ) );
    //sprites.emiters.push( makeEmiter( 4, canvas.width / 2, canvas.height / 2 ) );

    //make and bind UI (after emiters are made)
    ui = new interfaceObject();
    ui.bindUi();

    mainLoop(time.now);
};

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

    gameSpeed : 1, // 1 to 10 multiply the delta
    gravity : 96, // ?

    airWeight : 1, // ?
    waterWeight : 4, // ?
    waterHeight : 100, // 0 to 200

    mouseGravityRange : 100, // 50 to 200
    mouseGravity : .5,

    maxParticles : 2500, // 100 to 2,000

    speedVar : 10, // 1 to 100 // tricle to burst // multiply the particle velocity
    particleFlow : 1, // 1 to 100 cretae n particles per tick
    rateOfParticles : 10, // 0 to 1000 // wait n miliseconds per tick // 1000 = 1 per s

    particleRange : 360,
    particleDirection : 0,

}

var sprites = {
    particles : new Array(),
    emiters : new Array(),
};

var state = {
    mousePos : {
        x : 0,
        y : 0,
    },
    lowestFps : 1000,
}

var makeEmiter = function(type,x,y){

    var type = type;

    var emiterConfig = {};
    var particleConfig = {};

    emiterConfig = {
        x : x,
        y : y,
        velx : 0,
        vely : 0,

        particleDirection : config.particleDirection,
        particleRange : config.particleRange,
        rateOfParticles : config.rateOfParticles,
        particleFlow : config.particleFlow,
        speedVar : config.speedVar,

        lastParticle : 0,
        createTime : time.now,
        destroy : false,
    },

    particleConfig = {
        r : 200,
        g : 100,
        b : 200,
        opacity : .5,
        decayStart : 1 * 1000, //s * ms
        decayEnd : 10 * 1000, //s * ms
        thirdDimension : false,
    }

    if(type == 2){
        emiterConfig.vely = -250;
        emiterConfig.velx = -250;
        emiterConfig.rateOfParticles = 20;
        particleConfig.r = 0;
    }

    //center Emiter
    if(type == 3){
        particleConfig.decayStart = 10 * 1000;
        particleConfig.decayEnd = 20 * 1000;
        emiterConfig.rateOfParticles = 100;
        particleConfig.r = 200;
        particleConfig.g = 200;
        particleConfig.b = 100;
        particleConfig.thirdDimension = true;
    }

    if(type == 4){

        emiterConfig.x = state.mousePos.x;
        emiterConfig.y = state.mousePos.y;
        emiterConfig.rateOfParticles = 20;
        emiterConfig.particleFlow = 10;
        emiterConfig.speedVar = 250;

        particleConfig.decayStart = 0;
        particleConfig.decayEnd = 1 * 1000;

    }

    var addParticle = function(){
        var n = 0;
        var makeN = emiterConfig.particleFlow;
        
        //if(sprites.particles.length + makeN > config.maxParticles){
            //makeN = Math.floor( (config.maxParticles - sprites.particles.length) * Math.random());
            //makeN = tools.randomRange(0,makeN);
        //}
        
        //check rate of particle
        if( emiterConfig.lastParticle < (time.now - emiterConfig.rateOfParticles) ){
    
            for(n = 0; n < makeN; n++){
                sprites.particles.push( makeParticle(type,emiterConfig,particleConfig) );
            }

            emiterConfig.lastParticle = time.now;
        }
    }

    return{
        type : type,
        emiterConfig : emiterConfig, //emiter settings
        addParticle : addParticle,
    }
}


var makeParticle = function(type,econfig,pconfig){

    var thisSpeed = ( ( Math.random() * econfig.speedVar ) + econfig.speedVar ) * tools.randomRange(1,5);;
    var direction = ( Math.random() - .5 ) * econfig.particleRange + econfig.particleDirection;
    var size = tools.randomRange(1,8);
    var weight = 2;

    var particle = {
        type : type,
        x : econfig.x,
        y : econfig.y,
        z : 1,
        weight : weight,
        buoyancy : (config.airWeight - weight),
        mouseDistance : null,
        velx : Math.cos(Math.PI * direction / 180) * thisSpeed + econfig.velx,
        vely : Math.sin(Math.PI * direction / 180) * thisSpeed + econfig.vely,
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
        thirdDimention : pconfig.thirdDimension,
    }

    return particle;

};

// Check inputs for how to update sprites
var update = function (modifier) {

    //console.log('M: ' + modifier);

    var i;

    //EMITER LOOP
    //each emiter tries to create a particle
    //update velocity of each emiter
    var e;

    for(i = sprites.emiters.length - 1; i >= 0; i--){

        e = sprites.emiters[i];

        //add particles from each emiter
        e.addParticle();

        e.emiterConfig.x += e.emiterConfig.velx * modifier;
        e.emiterConfig.y += e.emiterConfig.vely * modifier;

        //bounce emiters off the edge
        if(e.emiterConfig.x < 0){
            e.emiterConfig.x = 1;
            e.emiterConfig.velx = e.emiterConfig.velx * -1;
        }
        if(e.emiterConfig.x > canvas.width){
            e.emiterConfig.x = canvas.width - 1;
            e.emiterConfig.velx = e.emiterConfig.velx * -1;
        }
        
        if(e.emiterConfig.y < 0){
            e.emiterConfig.y = 1;
            e.emiterConfig.vely = e.emiterConfig.vely * -1;
        }
        if(e.emiterConfig.y > canvas.height){
            e.emiterConfig.y = canvas.height - 1;
            e.emiterConfig.vely = e.emiterConfig.vely * -1;
        }
        if(e.type == 4){
            e.emiterConfig.x = state.mousePos.x;
            e.emiterConfig.y = state.mousePos.y;
        }



    }

    //PARTICLE LOOP
    //update the velocity and position of each particle
    var p;
    var r,g,b,opacity;
    var removeN = null;

    if(sprites.particles.length > config.maxParticles){
        removeN = sprites.particles.length - config.maxParticles;
        if(removeN) sprites.particles.splice(0,removeN);
    }

    for(i = sprites.particles.length - 1; i >= 0; i--){

        p = sprites.particles[i];

        // BUOYANCY
        if(p.y >= canvas.height - config.waterHeight){
            p.buoyancy = (config.waterWeight - p.weight);
            //MORE DRAG
            p.vely = p.vely * (1 - .3 * modifier);
            p.velx = p.velx * (1 - .3 * modifier);
        }else{
            p.buoyancy = (config.airWeight - p.weight);
        }
        
        // Z TEST
        if(p.thirdDimension == true){
            p.z += modifier;
        }

        //GRAVITY / BOUYANCY
        p.vely -= config.gravity * modifier * p.buoyancy;
        
        //DRAG
        p.vely = p.vely * (1 - .1 * modifier);
        p.velx = p.velx * (1 - .1 * modifier);

        //MOUSE GRAVITY
        p.mouseDistance = tools.getDistance(state.mousePos.x - p.x,state.mousePos.y - p.y)

        if(p.mouseDistance < config.mouseGravityRange ){
            p.velx += (config.mouseGravityRange - p.mouseDistance) * (state.mousePos.x - p.x) * modifier * config.mouseGravity;
            p.vely += (config.mouseGravityRange - p.mouseDistance) * (state.mousePos.y - p.y) * modifier * config.mouseGravity;
        }

        //opacity = (200-p.mouseDistance)/200;
        opacity = ( (p.decayEnd - p.decayStart) - (time.now - (p.createTime + p.decayStart) ) ) / (p.decayEnd - p.decayStart);

        if(opacity > 1) opacity = 1;

        if( time.now >= (p.createTime + p.decayEnd) ){
            p.destroy = true;
        }

        //COLOR
        r = 300 - p.mouseDistance;
        g = p.g + 100 - p.mouseDistance;
        b = 100;

        p.color = "rgba("+ p.r +","+ p.g +","+p.b+","+ opacity +")";

        //change color if in mouse gravity
        if(p.mouseDistance < config.mouseGravityRange){
            p.color = "rgba("+ p.r +","+ g +","+ p.b +","+ opacity +")";
        }

        //position the particle
        p.x += p.velx * modifier;
        p.y += p.vely * modifier;

        //destroy particles too far off the edge
        if(p.y < -canvas.height || p.x < -canvas.width || p.x > 2 * canvas.width || p.y > 2 * canvas.height){
            p.destroy = true;
        }

        //if destroy is set remove it from the list
        if(p.destroy == true){
            sprites.particles.splice(i,1);
        }

        //set state
        if(time.now > 3000 && Math.ceil(1000/time.delta) < state.lowestFps){
            state.lowestFps = Math.ceil(1000/time.delta);
        }

    }

};
//END UPDATE LOOP


// Draw everything
var render = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    showText();
    showSprites();
};

// game sprites
var showSprites = function(){
    //draw particles
    var p = null;
    var i = 0;
    for(i=0;i<sprites.particles.length;i++){
        p = sprites.particles[i];
        //set color
        ctx.fillStyle = p.color;
        //ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.beginPath();
        ctx.arc((p.x - (canvas.width / 2)) / p.z + (canvas.width / 2), (p.y - (canvas.height / 2)) / p.z + (canvas.height / 2), p.width, 0, 2 * Math.PI,false);
        ctx.fill();
    }
    //draw water
    ctx.fillStyle = "rgba(50,100,200,.7)";
    ctx.fillRect(0,canvas.height - config.waterHeight,canvas.width,config.waterHeight)
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
    if(state.lowestFps < 1000){
        ctx.fillText('lowest fps: ' + state.lowestFps, 10, 76);
    }
    ctx.fillText('particles: ' + Math.ceil(sprites.particles.length), 10, 96);
    ctx.fillText('time: ' + Math.ceil(time.current), 10, 116);
    //ctx.fillText('pps: ' + Math.ceil(1000/config.rateOfParticles), 10, 116);
};

var processTick = function (time) {
    //every 10 sec encounter
    if( time % 10 === 0 ){
    }
}

// The main game loop
var mainLoop = function (timestamp) {

    time.now = timestamp;
    time.delta = time.now - time.then;
    time.modifier = time.delta / 1000 * config.gameSpeed; //modifier in seconds
    time.current = Math.floor( (time.then - time.start) / 1000 );

    update(time.modifier);
    render();

    time.then = time.now;

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

var interfaceObject = function(){

    var changeValue = function(param,value){
        sprites.emiters[0].emiterConfig[param] = value;
    }

    var bindUi = function(){

        //form
        var formConfigElem = document.getElementById("form-config");
        formConfigElem.addEventListener("submit", function(e){
          e.preventDefault();
        });

        formConfigElem.addEventListener("change", function(e){
          e.preventDefault();
          changeValue(e.target.dataset.param, e.target.value);
        });

        var inputs = formConfigElem.getElementsByTagName('input');
        var inputArray = Array.from(inputs);
        inputArray.forEach(function(elem,i){
            elem.value = sprites.emiters[0].emiterConfig[elem.dataset.param];
        })


    }
    return {
        bindUi : bindUi
    }
}

// Start the Simulation
init();