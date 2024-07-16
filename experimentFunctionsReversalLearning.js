// This is the script for a recreation of the Balloon Analogue Risk Task from Lejuez et al. 2002. 
// Author: Zach Tefertiller - zachary.tefertiller@tum.de
// Date: May 2024
// Knolle Lab, Graduate School of Systemic Neurosciences, LMU, TUM, Munich

// Experimental data variables
let totalPoints = 0;
let balloonInflations = [];
let pointsPerBalloon = [];
let pointsOverTime = [];
let balloonColors = [];
let balloonNumber = [];
let timeToComplete = [];
let explosionYesNo = [];
let explosionsOverTime = [];
let explosions = 0;
let optimalInflations = [];
let perfectGame = [];
let factor = Math.pow(10, 2);
const options = { style: 'currency', currency: 'USD' };
const formatter = new Intl.NumberFormat('en-US', options);

// Define start of trial parameters 
let points = 0;
let perfectScore = 0;
let totalScore = 0;
document.getElementById("points").textContent = points;
let burst = "The balloon has popped. You earned no points.";
let lastBalloon;
let currentBalloon;
let inflations = 0;
let index = 0;
let blueIndex = 0;
let yellowIndex = 0;
let orangeIndex = 0;

// Initialize balloon image parameters
const balloonImage = document.getElementById('balloonImage');
let pressCount = 0;
const maxPresses = 128; // Maximum number of inflations

// Initial balloon image size settings
const minSize = 175; // Initial size in pixels
const maxSize = 600; // Maximum size in pixels

balloonImage.style.width = `${minSize}px`;
balloonImage.style.height = `${minSize}px`;
balloonImage.style.position = 'absolute';
balloonImage.style.bottom = '0px';
balloonImage.style.left = '50%';
balloonImage.style.transform = 'translateX(-50%)';

// Initialize balloon images
let blueImage = "blueBalloon2.png";
let orangeImage = "orangeBalloon2.png";
let yellowImage = "yellowBalloon2.png";

// Function to initialize variables with JSON data
function initializeWithData(data) {
    blueArrays = data.blue;
    orangeArrays = data.orange;
    yellowArrays = data.yellow;
    order = data.order;
    moveToNextBalloon();
}

// Function to inflate balloon
function inflate() {
    if (currentBalloon.length > 0) {
        let poppedNumber = currentBalloon.pop();
        if (poppedNumber == 1) {
            popBalloon();
        } else {
            points += .05;
            formatter.format(points)
            inflations += 1;
            inflateAudio.play();
            inflateBalloonImage();
            document.getElementById("points").textContent = points;
        }
    }
}

// Function to store points into lastBalloon
function storePoints() {
    if (inflations > 0) {
        points = Math.ceil(points * factor) / factor;
        formatter.format(points)
        totalPoints += points;  // Take cart of adding points to total, storing to vectors, and reseting point total
        formatter.format(totalPoints)
        pointsOverTime.push(totalPoints); // Push running total to dataframe 
        pointsPerBalloon.push(points); // Push points for the balloon to dataframe
        balloonInflations.push(inflations); // Push number of inflations to dataframe
        lastBalloon = "Your last balloon stored " + points + " points.";
        document.getElementById("lastBalloon").textContent = lastBalloon;
        bankAudio.play();  // Audio cue
        message.style.display = 'block';
        message.textContent = `You earned ${points} points!`; // Tell participant how many points they earned
        points = 0;
        inflations = 0;
        explosionsOverTime.push(explosions);
        explosionYesNo.push(0);
        balloonImage.style.display = 'none'; // Hide everything but the earning message and continue button
        document.getElementById('lastBalloon').style.display = 'none';
        document.getElementById("totalPoints").style.display = 'none';
        document.getElementById('piggyBank').style.display = 'none';
        document.getElementById('inflateButton').style.display = 'none';
        document.getElementById('bankButton').style.display = 'none';
        document.getElementById('continueButton').style.display = 'block';
        continueButton.addEventListener('click', moveToNextBalloon) // Move on
    } else {
        message.textContent = 'You must inflate the balloon at least once.'; // Remind participant one inflation needed.
        message.style.display = 'block';
        setTimeout(() => {
            message.style.display = 'none';
        }, 3000);
    }
}

// Function to iterate through balloons via randomization function, and assign corresponding arrays and images
function moveToNextBalloon() {
    resetBalloonImage();
    document.getElementById('inflateButton').style.display = 'block';  // Hide continue button, show other two buttons
    document.getElementById('bankButton').style.display = 'block';
    document.getElementById('continueButton').style.display = 'none';
    document.getElementById('lastBalloon').style.display = 'block';
    document.getElementById("totalPoints").style.display = 'block';
    document.getElementById('piggyBank').style.display = 'block';
    document.getElementById("totalPoints").textContent = totalPoints;
    if (index < order.length) {
        let balloonType = order.pop();
        balloonColors.push(balloonType);
        if (balloonType == "b") {
            currentBalloon = blueArrays[blueIndex].slice();
            perfectInflations = bestPossibleGame(currentBalloon);
            perfectScore = perfectInflations * .05;
            optimalInflations.push(perfectInflations);
            perfectScore = Math.ceil(perfectScore * factor) / factor;
            perfectGame.push(perfectScore);
            blueIndex++
            document.getElementById("balloonImage").src = blueImage;
        } else if (balloonType == "o") {
            currentBalloon = orangeArrays[orangeIndex].slice();
            perfectInflations = bestPossibleGame(currentBalloon);
            perfectScore = perfectInflations * .05;
            optimalInflations.push(perfectInflations);
            perfectScore = Math.ceil(perfectScore * factor) / factor;
            perfectGame.push(perfectScore);
            orangeIndex++
            document.getElementById("balloonImage").src = orangeImage;
        } else if (balloonType == "y") {
            currentBalloon = yellowArrays[yellowIndex].slice();
            perfectInflations = bestPossibleGame(currentBalloon);
            perfectScore = perfectInflations * .05;
            optimalInflations.push(perfectInflations);
            perfectScore = Math.ceil(perfectScore * factor) / factor;
            perfectGame.push(perfectScore);
            yellowIndex++
            document.getElementById("balloonImage").src = yellowImage;
        }
        balloonNumber.push(index);
    } else {            // End task after last balloon
        const endTime = performance.now(); // Total time for experiment
        const elapsedTime = endTime - startTime
        timeToComplete.push(elapsedTime);
        document.getElementById('inflateButton').style.display = 'none';  // Hide all content except closing message
        document.getElementById('bankButton').style.display = 'none';
        document.getElementById('continueButton').style.display = 'none';
        document.getElementById('lastBalloon').style.display = 'none';
        document.getElementById("totalPoints").style.display = 'none';
        document.getElementById("balloonImage").style.display = 'none';
        document.getElementById('piggyBank').style.display = 'none';
        perfectScore = sumVector(perfectGame); // Might be useless later
        totalScore = sumVector(pointsPerBalloon);
        message.style.display = 'block';
        document.getElementById('endTask').style.display = 'block'
        message.textContent = `Your total score was ${totalPoints} points. Well done!`;
    }
}

// Function to make balloon image larger
function inflateBalloonImage() {
    pressCount++;
    if (pressCount <= maxPresses) {
        const newSize = calculateLogarithmicSize(pressCount, maxPresses);
        balloonImage.style.width = `${newSize}px`;
        balloonImage.style.height = `${newSize}px`;
    }
}

// Function to calculate new size on a logarithmic scale
function calculateLogarithmicSize(count, maxCount) {
    const scaleFactor = Math.log(count + 1) / Math.log(maxCount + 1);
    return minSize + scaleFactor * (maxSize - minSize);
}

function popBalloon() {
    popAudio.play(); // Pop sound
    message.textContent = burst; // Display pop message 
    message.style.display = 'block';
    points = 0; // Push zero points to dataframe
    pointsPerBalloon.push(points);
    lastBalloon = "Your last balloon stored " + points + " points.";
    document.getElementById("lastBalloon").textContent = lastBalloon;
    inflations += 1;
    balloonInflations.push(inflations); // Push number of inflations to dataframe
    inflations = 0;
    pointsOverTime.push(totalPoints); // Push unchanged total points to dataframe
    explosions++ // Increase explosion counter and push
    explosionsOverTime.push(explosions);
    explosionYesNo.push(1);
    document.getElementById('balloonImage').style.display = 'none'; // Hide everything else except continue button
    document.getElementById('piggyBank').style.display = 'none';
    document.getElementById('totalPoints').style.display = 'none';
    document.getElementById('inflateButton').style.display = 'none';
    document.getElementById('bankButton').style.display = 'none';
    document.getElementById('lastBalloon').style.display = 'none';
    document.getElementById('continueButton').style.display = 'block';
    continueButton.addEventListener('click', moveToNextBalloon) // Move on when clicking continue
}

function resetBalloonImage() {
    pressCount = 0;
    message.style.display = 'none';  // Hide message
    balloonImage.style.display = '';  // Reset balloon balloonImage to starting values
    balloonImage.style.width = `${minSize}px`;
    balloonImage.style.height = `${minSize}px`;
    balloonImage.style.position = 'absolute';
    balloonImage.style.bottom = '0px';
    balloonImage.style.left = '50%';
    balloonImage.style.transform = 'translateX(-50%)';
}

// Make a function that looks at the best possible game given an array
function bestPossibleGame(arr) {
    let foundOne = false;
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === 1) {
            foundOne = true;
        } else if (foundOne) {
            count++;
        }
    }
    return count;
}

// Sum vector function
function sumVector(vector) {
    let sum = 0;
    for (let i = 0; i < vector.length; i++) {
        sum += vector[i];
    }
    return sum;
}

function endTask() {
    // Collect data
    let jsonData = {
        totalPoints,
        balloonInflations,
        pointsPerBalloon,
        pointsOverTime,
        balloonColors,
        balloonNumber,
        timeToComplete,
        explosionYesNo,
        explosionsOverTime,
        explosions,
        optimalInflations,
        perfectGame,
        subject_id,
        startTime,
        endTime: performance.now()
    };

    // Stringify JSON data
    let jsonString = JSON.stringify(jsonData);

    // // Create a blob and download the file as .json
    // let blob = new Blob([jsonString], { type: 'application/json' });
    // let url = URL.createObjectURL(blob);
    // let a = document.createElement('a');
    // a.href = url;
    // a.download = 'data.json';
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
    // URL.revokeObjectURL(url);

    // Submit data and end study
    jatos.submitResultData(jsonString)
    
    .then(() => {
        jatos.endStudy();
    }).catch((error) => {
        console.error("Error submitting data:", error);
        alert("Error submitting data. Please try again.");
    });
}
