document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activitiesData = {};

  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.replaceChildren(activitySelect.options[0]);

    Object.entries(activitiesData).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
      `;

      const participantsSection = document.createElement("div");
      participantsSection.className = "participants-section";

      const participantsHeading = document.createElement("div");
      participantsHeading.className = "participants-heading";

      const participantsTitle = document.createElement("h5");
      participantsTitle.textContent = "Participants";

      const participantCount = details.participants.length;
      const participantCountLabel =
        participantCount === 1 ? "1 signed up" : `${participantCount} signed up`;
      const participantBadge = document.createElement("span");
      participantBadge.className = "participant-count";
      participantBadge.textContent = participantCountLabel;

      participantsHeading.append(participantsTitle, participantBadge);
      participantsSection.appendChild(participantsHeading);

      if (participantCount > 0) {
        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";
        details.participants.forEach((participant) => {
          const participantItem = document.createElement("li");

          const participantEmail = document.createElement("span");
          participantEmail.className = "participant-email";
          participantEmail.textContent = participant;

          const removeButton = document.createElement("button");
          removeButton.className = "remove-participant";
          removeButton.type = "button";
          removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
          removeButton.title = "Unregister participant";
          removeButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm3 2v8h2v-8H9Zm4 0v8h2v-8h-2Z" />
            </svg>
          `;
          removeButton.addEventListener("click", () => unregisterParticipant(name, participant, removeButton));

          participantItem.append(participantEmail, removeButton);
          participantsList.appendChild(participantItem);
        });
        participantsSection.appendChild(participantsList);
      } else {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "participants-empty";
        emptyMessage.textContent = "Be the first to join this activity.";
        participantsSection.appendChild(emptyMessage);
      }

      activityCard.appendChild(participantsSection);
      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function unregisterParticipant(activity, email, button) {
    button.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        messageDiv.textContent = result.detail || "Unable to unregister participant.";
        messageDiv.className = "error";
      } else {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        const activityDetails = activitiesData[activity];
        if (activityDetails) {
          activityDetails.participants = activityDetails.participants.filter(
            (participant) => participant !== email
          );
          renderActivities();
        }
      }
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      console.error("Error unregistering participant:", error);
    } finally {
      if (button.isConnected) {
        button.disabled = false;
      }
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Activity request failed with status ${response.status}`);
      }
      activitiesData = await response.json();

      renderActivities();
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
