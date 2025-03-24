let inactivityLink = 'https://franziskaknolle.com';
let abortStudyLink = 'https://franziskaknolle.com';
let noConsentLink = 'https://franziskaknolle.com';
let studyCompletedLink = 'https://franziskaknolle.com'

// if you use prolific etc, replace the links above with your prolific completion paths

function abortStudy() {
    if (confirm("Are you sure you want to abort the study? You will be redirected and forfeit your task earnings.")) {
        studyInProgress = false;
        jatos.endStudyAndRedirect(abortStudyLink);
    }
}
window.studyCompletedLink = studyCompletedLink;
window.noConsentLink = noConsentLink

document.addEventListener("DOMContentLoaded", function() {
    const noConsentAnchor = document.getElementById("noConsentLink");
    if (noConsentAnchor) {
        noConsentAnchor.href = window.noConsentLink;
    }
});

window.inactivityLink = inactivityLink