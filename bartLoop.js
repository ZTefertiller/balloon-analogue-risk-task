// BART functions 
// Zachary Tefertiller - zachary.tefertiller@tum.de
// Date: October 2024
// Knolle Lab, Graduate School of Systemic Neurosciences, LMU, TUM, Munich
// you need to import a json with breakpoints and balloon orders for this to work for your custom paradigms

let totalPoints = 0;
let currentBalloonInflationRTs = []; 
let lastEventTime = performance.now();
let canInflateOrCashIn = true;
let canPressSpaceBar = false;
let inflateKeyPressed = false; 
let points = 0;
let inflations = 0;
let index = 0; 
let proceedTimer = null;

const balloonImage = document.getElementById('balloonImage');
const maxPresses = 128; 
const minSize = 175; 
const maxSize = 600; 

balloonImage.style.width = `${minSize}px`;
balloonImage.style.height = `${minSize}px`;
balloonImage.style.position = 'absolute';
balloonImage.style.bottom = '0px';
balloonImage.style.left = '50%';
balloonImage.style.transform = 'translateX(-50%)';

let blueArrays, orangeArrays, yellowArrays, order;
let blueIndex = 0;
let yellowIndex = 0;
let orangeIndex = 0;


function initializeWithData(data) {
    blueArrays = data.blue;
    orangeArrays = data.orange;
    yellowArrays = data.yellow;
    order = data.order;
    moveToNextBalloon();
}


function inflate() {
    let currentTime = performance.now();
    let reactionTime = currentTime - lastEventTime;
    currentBalloonInflationRTs.push(reactionTime); 
    lastEventTime = currentTime;
    if (currentBalloon.length > 0) {
        let poppedNumber = currentBalloon.shift();
        if (poppedNumber == 1) {
            popBalloon();
        } else {
            points += 5;
            inflations += 1;
            inflateAudio.play();
            inflateBalloonImage();
        }
    }
}


function storePoints() {
    if (inflations > 0) {
        document.getElementById('instructions').style.display = 'none';
        canInflateOrCashIn = false;
        canPressSpaceBar = false;   
        
        let avgRT = calculateAverageInflationRT();
        totalPoints += points; 
        let optimal_inflations = determineOptimalInflations(currentBalloonColor);

        let trialData = {
            participant_id: participantID,
            trial_number: index,
            balloon_color: currentBalloonColor,
            inflations: inflations,
            optimal_inflations: optimal_inflations,
            points_earned: points,
            total_points_so_far: totalPoints,
            average_inflation_rt: avgRT,
            inflation_rts: currentBalloonInflationRTs
        };

        currentBalloonInflationRTs = [];
        points = 0;
        inflations = 0;

        bankAudio.play();  
        message.style.display = 'block';
        message.innerHTML = `You earned ${trialData.points_earned} points!<br>Next trial in 5 seconds (or press Space to continue).`;
        
        balloonImage.style.display = 'none'; 
        document.getElementById('lastBalloon').style.display = 'none';
        document.getElementById("totalPoints").style.display = 'none';
        document.getElementById('piggyBank').style.display = 'none';
        jatos.appendResultData(JSON.stringify(trialData))
        .then(() => {
            console.log("Trial data appended.");
        })
        .catch((error) => {
            console.error("Error submitting trial data:", error);
        });

        waitToProceed();
    } else {
        message.textContent = 'You must inflate the balloon at least once.'; 
        message.style.display = 'block';
        setTimeout(() => {
            message.style.display = 'none';
        }, 3000);
    }
}


function popBalloon() {
    let currentTime = performance.now(); 
    document.getElementById('instructions').style.display = 'none';

    let avgRT = calculateAverageInflationRT();
    totalPoints += 0; 
    inflations += 1;  
    let optimal_inflations = determineOptimalInflations(currentBalloonColor);
    popAudio.play(); 
    message.style.display = 'block';
    message.innerHTML = `The balloon popped! You earned 0 points.<br>Next trial in 5 seconds (or press Space to continue).`;
    let trialData = {
        participant_id: participantID,
        trial_number: index,
        balloon_color: currentBalloonColor,
        inflations: inflations,
        optimal_inflations: optimal_inflations,
        points_earned: 0,
        total_points_so_far: totalPoints,
        average_inflation_rt: avgRT,
        inflation_rts: currentBalloonInflationRTs
    };

    currentBalloonInflationRTs = []; 
    inflations = 0;
    points = 0; 

    document.getElementById('balloonImage').style.display = 'none'; 
    document.getElementById('piggyBank').style.display = 'none';
    document.getElementById('totalPoints').style.display = 'none';
    document.getElementById('lastBalloon').style.display = 'none';

    jatos.appendResultData(JSON.stringify(trialData))
    .then(() => {
        console.log("Trial data appended.");
    })
    .catch((error) => {
        console.error("Error submitting trial data:", error);
    });

    waitToProceed();
}


function determineOptimalInflations(balloonColor) {
    let currentArray;
    let currentIndex;

    switch(balloonColor) {
        case 'b':  
            currentArray = blueArrays[blueIndex - 1];
            break;
        case 'o':  
            currentArray = orangeArrays[orangeIndex - 1];
            break;
        case 'y':  
            currentArray = yellowArrays[yellowIndex - 1];
            break;
        default:
            return 0;
    }

    // Find the index of the first '1' in the array, 
    // which represents when the balloon would pop
    const popIndex = currentArray.indexOf(1);
    
    // If no '1' is found, return the full length of the array
    // Otherwise, return the index before the '1'
    return popIndex === -1 ? currentArray.length : popIndex;
}


function moveToNextBalloon() {
    if (proceedTimer !== null) {
        clearTimeout(proceedTimer);
        proceedTimer = null;
    }

    canInflateOrCashIn = false;
    canPressSpaceBar = false;

    lastEventTime = performance.now();

    document.getElementById('balloonImage').style.display = 'none';
    document.getElementById('lastBalloon').style.display = 'block';
    document.getElementById("totalPoints").style.display = 'block';
    document.getElementById('piggyBank').style.display = 'block';
    document.getElementById("totalPoints").textContent = totalPoints;

    if (order.length > 0) {
        let balloonType = order.pop();
        let chosenImage;
        if (balloonType == "b") {
            currentBalloon = blueArrays[blueIndex].slice();
            blueIndex++;
            chosenImage = blueImage;
        } else if (balloonType == "o") {
            currentBalloon = orangeArrays[orangeIndex].slice();
            orangeIndex++;
            chosenImage = orangeImage;
        } else if (balloonType == "y") {
            currentBalloon = yellowArrays[yellowIndex].slice();
            yellowIndex++;
            chosenImage = yellowImage;
        }

        currentBalloonColor = balloonType; // Store the current trial's balloon color

        resetBalloonImage();
        index++;

        balloonImage.onload = function() {
            document.getElementById('instructions').style.display = 'block';
            balloonImage.style.display = ''; 
            
            // Re-enable interactions only after the balloon is fully loaded
            canInflateOrCashIn = true;
        };
        balloonImage.src = chosenImage;

    } else {
        endTask()
    }};


function calculateTotalPops() {
    let totalPops = 0;
        blueArrays.forEach(arr => {
            totalPops += arr.filter(val => val === 1).length;
        });
        
        orangeArrays.forEach(arr => {
            totalPops += arr.filter(val => val === 1).length;
        });
        
        yellowArrays.forEach(arr => {
            totalPops += arr.filter(val => val === 1).length;
        });
        
        return totalPops;
    }


function inflateBalloonImage() {
    pressCount++;
    if (pressCount <= maxPresses) {
        const newSize = calculateLogarithmicSize(pressCount, maxPresses);
        balloonImage.style.width = `${newSize}px`;
        balloonImage.style.height = `${newSize}px`;
    }
}


function calculateLogarithmicSize(count, maxCount) {
    const scaleFactor = Math.log(count + 1) / Math.log(maxCount + 1);
    return minSize + scaleFactor * (maxSize - minSize);
}


function resetBalloonImage() {
    pressCount = 0;
    canInflateOrCashIn = true; 
    canPressSpaceBar = false;  
    message.style.display = 'none';  
    balloonImage.style.display = '';  
    balloonImage.style.width = `${minSize}px`;
    balloonImage.style.height = `${minSize}px`;
    balloonImage.style.position = 'absolute';
    balloonImage.style.bottom = '0px';
    balloonImage.style.left = '50%';
    balloonImage.style.transform = 'translateX(-50%)';
}


function calculateAverageInflationRT() {
    if (currentBalloonInflationRTs.length > 0) {
        let sumRT = currentBalloonInflationRTs.reduce((a, b) => a + b, 0);
        let avgRT = sumRT / currentBalloonInflationRTs.length;
        return Math.round(avgRT);
    } else {
        return null;
    }
}


function waitToProceed() {
    // Explicitly disable inflating or cashing in
    canInflateOrCashIn = false;
    
    // Enable spacebar after a short delay to prevent accidental advances
    canPressSpaceBar = true;
    
    // Ensure the message stays visible for the full 5 seconds
    proceedTimer = setTimeout(() => {
        moveToNextBalloon();
    }, 5000);
}


document.addEventListener('keydown', function(event) {
    if (event.defaultPrevented) {
        return; 
    }
    let key = event.key;

    // Additional check to ensure spacebar only works when explicitly allowed
    if (canPressSpaceBar && (key === ' ' || event.keyCode === 32 || event.keyCode === 38)) {
        if (proceedTimer !== null) {
            clearTimeout(proceedTimer);
            proceedTimer = null;
        }
        moveToNextBalloon();
        canPressSpaceBar = false;
        event.preventDefault();
        return;
    }

    // Add an explicit check for canInflateOrCashIn
    if (canInflateOrCashIn) {
        if ((key === 'f' || event.keyCode === 37) && !inflateKeyPressed) {
            inflateKeyPressed = true;
            inflate();
        } else if (key === 'j' || event.keyCode === 39) {
            storePoints();
        }
    }

    event.preventDefault();
}, true);

document.addEventListener('keyup', function(event) {
    let key = event.key;
    if (key === 'f' || event.keyCode === 37) {
        inflateKeyPressed = false;
    }
});
