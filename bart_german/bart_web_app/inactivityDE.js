(function() {
    // === Adjustable settings ===
    // (Edit these values to your preference)
    var inactivityWarningTime   = 30;    // Seconds before showing warning
    var inactivityCountdownTime = 30;    // Seconds to wait on warning
    var inactivityUrl           = inactivityLink; 
                                        // The redirect URL when countdown ends
    
    // === Internal variables ===
    var inactivitySeconds       = 0;
    var inactivityCountdown     = inactivityCountdownTime;
    var inactivityWarningVisible = false;
    var inactivityInterval, inactivityCountdownInterval;
    
    // ------------------------------------------------------------
    // 1. Dynamically create the popup element in the DOM.
    // ------------------------------------------------------------
    var inactivityWarning = document.createElement("div");
    inactivityWarning.id = "inactivityWarning";
    
    // Some basic styling (adjust as needed):
    inactivityWarning.style.display         = "none";
    inactivityWarning.style.position        = "fixed";
    inactivityWarning.style.top             = "30%";
    inactivityWarning.style.left            = "50%";
    inactivityWarning.style.transform       = "translate(-50%, -50%)";
    inactivityWarning.style.background      = "#f8d7da";
    inactivityWarning.style.padding         = "20px";
    inactivityWarning.style.border          = "2px solid #f5c2c7";
    inactivityWarning.style.fontFamily      = "sans-serif";
    inactivityWarning.style.zIndex          = "9999";
    inactivityWarning.style.textAlign       = "center";
    inactivityWarning.style.maxWidth        = "400px";
    inactivityWarning.style.borderRadius    = "8px";
    inactivityWarning.style.boxShadow       = "0 2px 8px rgba(0,0,0,0.2)";
    
    // Warning text
    var warningText = document.createElement("p");
    warningText.textContent = "You have been idle for a while. Please continue with the study or you will be kicked from the study!";
    inactivityWarning.appendChild(warningText);
    
    // Countdown text, including a <span> for the numeric countdown
    var countdownText = document.createElement("p");
    countdownText.innerHTML = 'Redirecting in <span id="inactivityCountdown">30</span> seconds...';
    inactivityWarning.appendChild(countdownText);
    
    // Append the popup to the document body
    document.body.appendChild(inactivityWarning);
    
    // Grab a reference to the countdown <span> (just created above)
    var inactivityCountdownEl = document.getElementById("inactivityCountdown");
    
    // ------------------------------------------------------------
    // 2. Define the main functions
    // ------------------------------------------------------------
    
    // (A) Reset inactivity timer on user activity
    function resetInactivityTimer() {
      inactivitySeconds = 0;
      if (inactivityWarningVisible) {
        hideInactivityWarning();
      }
    }
    
    // (B) Start checking for inactivity
    function startInactivityCheck() {
      inactivityInterval = setInterval(function() {
        inactivitySeconds++;
        // Check if we've hit the warning threshold
        if (inactivitySeconds === inactivityWarningTime) {
          showInactivityWarning();
        }
      }, 1000); // check every second
    }
    
    // (C) Show the warning popup and start the countdown
    function showInactivityWarning() {
      inactivityWarningVisible = true;
      inactivityWarning.style.display = "block";
      
      // Reset the countdown number
      inactivityCountdown = inactivityCountdownTime;
      inactivityCountdownEl.textContent = inactivityCountdown;
      
      // Start counting down
      inactivityCountdownInterval = setInterval(function() {
        inactivityCountdown--;
        inactivityCountdownEl.textContent = inactivityCountdown;
        
        if (inactivityCountdown <= 0) {
          // Time is up; redirect
          window.location.href = inactivityUrl;
          return;
        }
      }, 1000);
    }
    
    // (D) Hide the warning popup and clear the countdown
    function hideInactivityWarning() {
      inactivityWarningVisible = false;
      inactivityWarning.style.display = "none";
      clearInterval(inactivityCountdownInterval);
    }
    
    // ------------------------------------------------------------
    // 3. Attach event listeners for user activity
    // ------------------------------------------------------------
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
    
    // ------------------------------------------------------------
    // 4. Initialize
    // ------------------------------------------------------------
    startInactivityCheck();
  })();
  