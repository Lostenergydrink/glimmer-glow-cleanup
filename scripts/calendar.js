const events = [
  {
    day: 10,
    month: 3, // April (0-indexed)
    title: "Paint Party at Brewery",
    venue: "ABC Brewery",
    time: "7:00 PM - 10:00 PM",
    address: "123 Main St, City, State",
    description: "Enjoy an evening of paint and craft beer.",
    paypal: "https://www.paypal.me/thelostenergy",
    image: "https://via.placeholder.com/24/ff0000/ffffff?text=P"
  },
  {
    day: 22,
    month: 3, // April (0-indexed)
    title: "Glow Night at Meadery",
    venue: "XYZ Meadery",
    time: "8:00 PM - 11:00 PM",
    address: "456 Side St, City, State",
    description: "Experience a glow‑in‑the‑dark paint session with mead tasting.",
    paypal: "https://www.paypal.me/thelostenergy",
    image: "https://via.placeholder.com/24/00ff00/ffffff?text=G"
  },
  {
    day: 22,
    month: 1, // February (0-indexed)
    title: "Special Paint Party",
    venue: "Glimmer & Glow Studio",
    time: "6:00 PM - 9:00 PM",
    address: "789 Art St, City, State",
    description: "Join us for a special edition paint party!",
    paypal: "https://www.paypal.me/thelostenergy",
    image: "images/event.svg"
  }
];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function generateCalendar(month, year) {
  const calendarContainer = document.getElementById('calendar-container');
  calendarContainer.innerHTML = ""; // Clear previous calendar

  const table = document.createElement('table');
  table.classList.add('calendar');

  // Create header row for days of the week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  daysOfWeek.forEach(day => {
    const th = document.createElement('th');
    th.textContent = day;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body for days
  const tbody = document.createElement('tbody');
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let row = document.createElement('tr');

  // Add empty cells until the first day of the month
  for (let i = 0; i < firstDay; i++) {
    row.appendChild(document.createElement('td'));
  }

  // Populate days
  for (let day = 1; day <= daysInMonth; day++) {
    if (row.children.length === 7) {
      tbody.appendChild(row);
      row = document.createElement('tr');
    }

    const cell = document.createElement('td');
    const eventData = events.find(e => e.day === day && e.month === month);

    const contentContainer = document.createElement("div");
    contentContainer.style.display = "flex";
    contentContainer.style.flexDirection = "column";
    contentContainer.style.alignItems = "center";
    contentContainer.style.justifyContent = "center";
    contentContainer.style.height = "100%";

    const dayText = document.createElement("span");
    dayText.textContent = day;
    dayText.style.fontSize = eventData ? "24px" : "18px";
    dayText.style.fontWeight = eventData ? "bold" : "normal";
    contentContainer.appendChild(dayText);

    if (eventData) {
      const eventIcon = document.createElement("img");
      eventIcon.src = eventData.image;
      eventIcon.alt = eventData.title;
      eventIcon.classList.add("event-icon");

      eventIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        openEventModal(eventData);
      });

      contentContainer.appendChild(eventIcon);
      cell.title = eventData.title;
    }

    cell.appendChild(contentContainer);
    row.appendChild(cell);
  }

  // Complete the final row if necessary
  while (row.children.length < 7) {
    row.appendChild(document.createElement('td'));
  }
  tbody.appendChild(row);
  table.appendChild(tbody);
  calendarContainer.appendChild(table);

  // Update the displayed month header
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  document.getElementById("calendar-month").textContent = monthNames[month] + " " + year;
}

// Initialize calendar
document.addEventListener('DOMContentLoaded', function() {
  generateCalendar(currentMonth, currentYear);

  // Event listeners for month navigation
  document.getElementById("prev-month").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
  });

  document.getElementById("next-month").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
  });

  // Modal event listeners
  document.querySelector("#event-modal .close-button").addEventListener("click", function() {
    document.getElementById("event-modal").style.display = "none";
  });

  window.addEventListener("click", function(event) {
    const modal = document.getElementById("event-modal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

function openEventModal(eventData) {
  const modal = document.getElementById("event-modal");
  modal.style.display = "block";
  document.getElementById("modal-title").textContent = eventData.title;
  document.getElementById("modal-details").innerHTML = `
    <p>${eventData.description}</p>
    <p><strong>Venue:</strong> ${eventData.venue}</p>
    <p><strong>Address:</strong> ${eventData.address}</p>
    <p><strong>Time:</strong> ${eventData.time}</p>
  `;
  document.getElementById("modal-paypal").href = eventData.paypal;
} 