document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("camp-registration-form");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formatIrishMobile = (id) => {
      let number = document.getElementById(id)?.value.trim() || "";
      number = number.replace(/\s+/g, "").replace(/^0/, ""); // Remove leading zero
      return number ? `+353${number}` : "";
    };

    const getValue = (id) => document.getElementById(id)?.value.trim() || "";

    const data = {
      orgType: getValue("org-type"),
      orgName: getValue("org-name"),
      organizerName: getValue("organizer-name"),
      contactRole: getValue("contact-role"),
      organizerMobile: formatIrishMobile("organizer-mobile"),
      organizerEmail: getValue("organizer-email"),
      coOrganizerName: getValue("co-organizer-name"),
      coOrganizerMobile: formatIrishMobile("co-organizer-mobile"),
      campName: getValue("camp-name"),
      campAddress: getValue("camp-address"),
      county: getValue("county"),
      eircode: getValue("eircode"),
      bloodBank: getValue("bloodbank"),
      campDate: getValue("camp-date"),
      startTime: `${getValue("start-hour").padStart(2, '0')}:${getValue("start-minute").padStart(2, '0')}`,
      endTime: `${getValue("end-hour").padStart(2, '0')}:${getValue("end-minute").padStart(2, '0')}`,
      preferredSlot: getValue("preferred-slot"),
      refreshments: getValue("refreshments"),
      accessibility: getValue("accessibility"),
      participants: parseInt(getValue("participants")),
      expectedUnits: parseInt(getValue("expected-units") || "0")
    };

    try {
      const response = await fetch("/api/register-camp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      alert(result.message);
      if (response.ok) form.reset();
    } catch (err) {
      console.error("Submit failed", err);
      alert("Error submitting camp. Please try again.");
    }
  });
});