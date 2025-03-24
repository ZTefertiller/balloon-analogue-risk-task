// BART functions 
// Zachary Tefertiller - zachary.tefertiller@tum.de
// Date: October 2024
// Knolle Lab, Graduate School of Systemic Neurosciences, LMU, TUM, Munich

let totalPoints = 0;
let totalPops = 0;
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
let inactivity = false;
let inactivityTimer;
let totalInactivityPops = 0;
const startTime = new Date().toISOString();
let totalMoney = 0;
let currentBalloonMoney = 0;

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


function handleInactivity(action) {
    if(action === 'start') {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            inactivity = true;
            totalInactivityPops += 1;
            popBalloon();
        }, 15000);
    } else if(action === 'stop') {
        clearTimeout(inactivityTimer);
    }
}

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
            currentBalloonMoney = inflations * 0.05; 
            updatePiggyBankDisplay();
            inflateAudio.play();
            inflateBalloonImage();
            handleInactivity('start');
        }
    }
}

function storePoints() {
    handleInactivity('stop');
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
            popped: 0,
            points_earned: points,
            inactivity_pop: inactivity ? 1 : 0,
            total_points_so_far: totalPoints,
            average_inflation_rt: avgRT,
            inflation_rts: currentBalloonInflationRTs,
        };
        totalMoney += currentBalloonMoney;
        currentBalloonMoney = 0;
        currentBalloonInflationRTs = [];
        points = 0;
        inflations = 0;
        bankAudio.play();  
        message.style.display = 'block';
        message.innerHTML = `You earned €${(trialData.inflations * 0.05).toFixed(2)}!<br>Next trial in 5 seconds (or press Space to continue).`;        balloonImage.style.display = 'none'; 
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
    handleInactivity('stop');
    let currentTime = performance.now(); 
    document.getElementById('instructions').style.display = 'none';
    totalPops += 1;
    let avgRT = calculateAverageInflationRT();
    totalPoints += 0; 
    inflations += 1;  
    currentBalloonMoney = 0;
    updatePiggyBankDisplay();
    let optimal_inflations = determineOptimalInflations(currentBalloonColor);
    popAudio.play(); 
    message.style.display = 'block';
    message.innerHTML = `The balloon popped! You earned no money.<br>Next trial in 5 seconds (or press Space to continue).`;

    let trialData = {
        participant_id: participantID,
        trial_number: index,
        balloon_color: currentBalloonColor,
        inflations: inflations,
        optimal_inflations: optimal_inflations,
        popped: 1,
        points_earned: 0,
        inactivity_pop: inactivity ? 1 : 0,
        total_points_so_far: totalPoints,
        average_inflation_rt: avgRT,
        inflation_rts: currentBalloonInflationRTs,
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
    const popIndex = currentArray.indexOf(1);    
    return popIndex === -1 ? currentArray.length : popIndex;
}

function moveToNextBalloon() {
    // Check if inactivity pops have reached or exceeded the maximum threshold
    if (totalInactivityPops >= maxInactive) {
        endTask(); // Call endTask if threshold is met
        return; // Exit the function to prevent moving to the next balloon
    }

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

        currentBalloonColor = balloonType; 
        updatePiggyBankDisplay();
        resetBalloonImage();
        index++;

        balloonImage.onload = function() {
            document.getElementById('instructions').style.display = 'block';
            balloonImage.style.display = ''; 
            
            canInflateOrCashIn = true;
            handleInactivity('start'); // Start inactivity timer at the beginning of the trial
        };
        balloonImage.src = chosenImage;

    } else {
        endTask();
    }
};


function roundUpToNearestCent(value) {
    return (Math.ceil(value * 100) / 100).toFixed(2);
}



function endTask() {
    document.getElementById('piggyBank').style.display = 'none';
    document.getElementById('totalPoints').style.display = 'none';
    message.style.display = 'block';
    message.textContent = `You earned €${totalMoney.toFixed(2)}. Well done!`;
    totalMoney = roundUpToNearestCent(totalMoney)
    let endTime = new Date().toISOString();
    let task_time_ms = Date.parse(endTime) - Date.parse(startTime);
    
    let finalSummaryData = {
        participant_id: participantID,
        total_score: totalPoints,
        total_pops: totalPops, 
        total_inactive: totalInactivityPops,
        total_money: totalMoney,
        task_time: task_time_ms,
        start_timestamp: startTime,
        end_timestamp: endTime
    };
    jatos.studySessionData.totalMoney = totalMoney;
    jatos.appendResultData(JSON.stringify(finalSummaryData))
    .then(() => {
        if (totalInactivityPops >= maxInactive) {
            window.location.href = inactivityLink;
        } else {
            jatos.studySessionData.bart_180_total = totalPoints;
            setTimeout(() => {
                jatos.startNextComponent();
            }, 5000);
        }
    })
    .catch((error) => {
        console.error("Error in final data submission:", error);
        if (totalInactivityPops >= maxInactive) {
            window.location.href = inactivityLink;
        } else {
            jatos.startNextComponent();
        }
    });
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
    updatePiggyBankDisplay();
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

function updatePiggyBankDisplay() {
    document.getElementById("totalPoints").textContent = 
        `€${(totalMoney + currentBalloonMoney).toFixed(2)}`;
}

function waitToProceed() {
    canInflateOrCashIn = false;
    canPressSpaceBar = true;
    inactivity = false
    
    proceedTimer = setTimeout(() => {
        moveToNextBalloon();
    }, 5000);
}

document.addEventListener('keydown', function(event) {
    if (event.defaultPrevented) {
        return; 
    }
    let key = event.key;

    if (canPressSpaceBar && (key === ' ' || event.keyCode === 32 || event.keyCode === 38)) {
        if (proceedTimer !== null) {
            clearTimeout(proceedTimer);
            proceedTimer = null;
        }
        moveToNextBalloon();
        canPressSpaceBar = false;
        handleInactivity('stop');
        event.preventDefault();
        return;
    }

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