document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("camp-search-form");
    const tableBody = document.querySelector("#results-table tbody");
    const noCampsMsg = document.getElementById("no-camps-msg");
  
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const county = document.getElementById("county").value;
  
      try {
        const response = await fetch(`/api/camps?county=${encodeURIComponent(county)}`);
        const camps = await response.json();
  
        tableBody.innerHTML = ""; // Clear existing rows
  
        if (camps.length === 0) {
          noCampsMsg.style.display = "block";
          return;
        }
  
        noCampsMsg.style.display = "none";
  
        camps.forEach(camp => {
          const row = document.createElement("tr");
  
          row.innerHTML = `
            <td>${camp.camp_name}</td>
            <td>${camp.org_name}</td>
            <td>${camp.camp_address}</td>
            <td>${camp.county}</td>
            <td>${new Date(camp.camp_date).toLocaleDateString()}</td>
            <td>${camp.start_time} - ${camp.end_time}</td>
            <td>${camp.organizer_mobile}</td>
          `;
  
          tableBody.appendChild(row);
        });
      } catch (err) {
        console.error("Error fetching camps:", err);
        alert("Failed to load camps. Please try again.");
      }
    });
  });
  