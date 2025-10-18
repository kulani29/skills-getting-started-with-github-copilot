document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();

      // Clear activities list
      activitiesList.innerHTML = "";
      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Current Participants</h5>
            <ul class="participants-list">
              ${details.participants.length ? 
                details.participants.map(participant => {
                  // derive initials from an email or name
                  const displayName = participant;
                  const local = participant.split('@')[0];
                  const initials = local.split(/[^a-zA-Z0-9]+/)
                    .map(part => part[0] || '')
                    .join('')
                    .slice(0,2)
                    .toUpperCase();
                  // include a delete button with data attributes
                  return `<li>
                    <span class="participant-avatar">${initials}</span>
                    <span class="participant-name">${displayName}</span>
                    <button class="participant-remove" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(participant)}" aria-label="Remove ${displayName}">✕</button>
                  </li>`;
                }).join('') : 
                '<li class="no-participants">No participants yet</li>'
              }
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

        // (Event delegation) Ensure a single handler handles remove clicks even after re-render
        // Remove any previous listener by re-adding one - safe because we attach to the container only once below
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
        messageDiv.classList.remove('hidden');
        messageDiv.classList.add('message', 'success');
        signupForm.reset();

        // Refresh activities to show updated participants
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.classList.remove('hidden');
        messageDiv.classList.add('message', 'error');
      }

      // already ensured above

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

  // Attach delegated click listener for remove buttons once
  activitiesList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.participant-remove');
    if (!btn) return;
    const activityName = decodeURIComponent(btn.dataset.activity);
    const email = decodeURIComponent(btn.dataset.email);

    if (!confirm(`Remove ${email} from ${activityName}?`)) return;

    try {
      const res = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, { method: 'POST' });
      const payload = await res.json();
      if (res.ok) {
        // refresh activities
        await fetchActivities();
      } else {
        alert(payload.detail || 'Failed to remove participant');
      }
    } catch (err) {
      console.error('Error removing participant', err);
      alert('Network error while removing participant');
    }
  });
});
