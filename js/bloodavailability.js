document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("blood-availability-form");
  const resultsTableBody = document.querySelector("#results-table tbody");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const county = document.getElementById("county").value;
    const bloodType = document.getElementById("blood-type").value;
    const component = document.getElementById("blood-component").value;

    try {
      const response = await fetch("/api/blood/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ county, bloodType, component }),
      });

      const data = await response.json();

      // Clear previous results
      resultsTableBody.innerHTML = "";

      if (data.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="5" style="text-align:center;">No results found for your search.</td>`;
        resultsTableBody.appendChild(row);
        return;
      }

      // Insert new rows
      data.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.hospital}</td>
          <td>${item.county}</td>
          <td>${item.bloodType}</td>
          <td>${item.component}</td>
          <td>${item.units}</td>
        `;
        resultsTableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Error fetching availability:", err);
      alert("An error occurred while fetching blood availability.");
    }
  });
});