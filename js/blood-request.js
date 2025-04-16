document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("blood-request-form");
  
    // Function to format Irish mobile number
    function formatIrishMobile(rawMobile) {
      let mobile = rawMobile.trim().replace(/\s+/g, "");
      mobile = mobile.replace(/^0/, ""); // remove leading 0
      return mobile ? `+353${mobile}` : "";
    }
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
  
      const requestData = {
        full_name: getVal("full_name"),
        mobile: formatIrishMobile(getVal("mobile")),
        email: getVal("email"),
        blood_group: getVal("blood_group"),
        component: getVal("component"),
        county: getVal("county"),
        hospital: getVal("hospital"),
        required_date: getVal("required_date"),
        units: parseInt(getVal("units")),
        reason: getVal("reason")
      };
  
      try {
        const res = await fetch("/api/blood-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
  
        const result = await res.json();
        alert(result.message);
  
        if (res.ok) form.reset();
      } catch (err) {
        console.error("Request failed:", err);
        alert("Failed to submit request. Please try again.");
      }
    });
  });  