<?php /* 
    Particle System Test
*/ ?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Particle System | HTML5 | JavaScript</title>
        <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        <link rel="stylesheet" type="text/css" href="game.css" media="all" />
        <link href="favicon.ico" rel="shortcut  icon">
    </head>
    <body>
        <div id="game-area" class="game-area">
            <canvas id="game-canvas" class="game-canvas"></canvas>
        </div>


        <div id="game-interface" class="game-interface">
            <form id="form-config" class="form-config" action="#">
                <ul>
                    <li class="p-flow">
                        <label for="flow">flow</label>
                        <!-- <input name="flow" type="number" value="1" data-param="particleFlow" /> -->
                        <input type="range" name="flow" min="1" max="100" value="1" data-param="particleFlow" />
                    </li>
                    <li class="p-rate">
                        <label for="rate">rate</label>
                        <!-- <input name="rate" type="number" value="1" data-param="rateOfParticles" /> -->
                        <input type="range" name="rate" min="1" max="1000" value="1" data-param="rateOfParticles" />
                    </li>
                    <li class="p-speed">
                        <label for="speed">speed</label>
                        <!-- <input name="speed" type="number" value="1" data-param="speedVar" /> -->
                        <input type="range" name="speed" min="1" max="100" value="1" data-param="speedVar" />
                    </li>
                </ul>
            </form>
        </div>


        <div id="game-info" class="game-info">
            <h1>Particle System</h1>
            <p>Design and development by Ben Borkowski & Lengley Rowland</p>
        </div>
        <?php include_once('../../lib/includes/opalgames-footer.php'); ?>
        <?php /* 
            simple way to load js at the end of the body 
        */ ?>
        <script src="game.js?t=<?php print mktime(); ?>"></script>

    </body>
</html>