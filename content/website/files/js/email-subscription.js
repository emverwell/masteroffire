function subscribe() {
  const emailInput = document.getElementById("emailInput");
  const email = emailInput.value;


  var apiUrl = "https://app.themasteroffire.com/backend?destinationUrl=subscribe"
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Subscription response:", data);
      // Show success message
      notificationMessage.style.color = 'green';
      notificationMessage.textContent = `Successfully subscribed: ${email}`;
      // Optionally, clear the email input field
      emailInput.value = '';
    })
    .catch((error) => {
      console.error("Error subscribing:", error);
      // Show error message
      notificationMessage.style.color = 'red';
      notificationMessage.textContent = 'An error occurred. Please try again.';
    });
}
