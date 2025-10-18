document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      const template = document.getElementById("activity-template");

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = template.content.cloneNode(true);
        const card = activityCard.querySelector('.activity-card');
        
        // Set card properties
        card.dataset.id = name.toLowerCase().replace(/\s+/g, '-');
        card.querySelector('.activity-title').textContent = name;
        card.querySelector('.activity-desc').textContent = details.description;
        card.querySelector('.participants').setAttribute('aria-label', `Participants for ${name}`);

        // Add participants
        const participantsList = card.querySelector('.participants-list');
        if (details.participants.length === 0) {
          participantsList.innerHTML = '<li class="no-participants">No participants yet.</li>';
        } else {
          details.participants.forEach(participant => {
            const initials = participant.split(' ')
              .map(part => part[0])
              .join('')
              .toUpperCase();
            const li = document.createElement('li');
            li.innerHTML = `<span class="avatar">${initials}</span>${participant}`;
            participantsList.appendChild(li);
          });
        }

        // Add schedule and spots info
        const scheduleP = document.createElement('p');
        scheduleP.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        card.querySelector('.activity-desc').after(scheduleP);

        const spotsLeft = details.max_participants - details.participants.length;
        const spotsP = document.createElement('p');
        spotsP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        scheduleP.after(spotsP);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
