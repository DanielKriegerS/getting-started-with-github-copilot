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

      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear select options except placeholder
      activitySelect.querySelectorAll("option:not([value=''])").forEach(o => o.remove());

      // Helper to get initials for avatar from an email or name
      function getInitials(text) {
        if (!text) return "?";
        const parts = text.split(/[@._\-+\s]+/).filter(Boolean);
        if (parts.length === 0) return text.slice(0, 2).toUpperCase();
        const first = parts[0][0] || "";
        const second = parts[1] ? parts[1][0] : (parts[0][1] || "");
        return (first + second).toUpperCase();
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section HTML
        let participantsHTML = `<div class="participants"><h5>Participants</h5>`;
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          participantsHTML += `<ul>`;
          details.participants.forEach((p) => {
            const initials = getInitials(p);
            // Use data attributes to identify participant and activity
            participantsHTML += `
              <li data-email="${p}">
                <span class="participant-avatar">${initials}</span>
                <span class="participant-email">${p}</span>
                <button class="participant-delete" title="Unregister" aria-label="Unregister ${p}">✕</button>
              </li>
            `;
          });
          participantsHTML += `</ul>`;
        } else {
          participantsHTML += `<p class="no-participants">No participants yet — be the first to sign up!</p>`;
        }
        participantsHTML += `</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for this activity's participants
        const participantButtons = activityCard.querySelectorAll('.participant-delete');
        participantButtons.forEach((btn) => {
          btn.addEventListener('click', async (event) => {
            const li = btn.closest('li');
            const email = li && li.dataset && li.dataset.email;
            if (!email) return;

            // Confirm before unregistering
            const confirmMsg = `Remove ${email} from ${name}?`;
            if (!window.confirm(confirmMsg)) return;

            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );

              const data = await resp.json();
              if (resp.ok) {
                // Remove the list item from DOM
                li.remove();
                // Optionally update availability display
                const availability = activityCard.querySelector('p strong') || null;
                // Show a short success message
                messageDiv.textContent = data.message || 'Participant removed';
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 3000);
              } else {
                messageDiv.textContent = data.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 5000);
              }
            } catch (err) {
              console.error('Error unregistering participant:', err);
              messageDiv.textContent = 'Failed to remove participant. Try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 5000);
            }
          });
        });

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
        // Refresh activities so the newly signed-up participant appears immediately
        await fetchActivities();
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
