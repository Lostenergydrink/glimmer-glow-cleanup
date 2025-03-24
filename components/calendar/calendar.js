// Existing JavaScript for Calendar

// Add event listener for window resize to adjust calendar
$(window).on('resize', function() {
  adjustCalendarLayout();
});

function adjustCalendarLayout() {
  var width = $(window).width();
  if (width < 768) {
    // Modify calendar for mobile view
    $('.calendar').css({
      'width': '100%',
      'height': 'auto',
    });
    // Initialize or reinitialize calendar scripts if necessary
    initializeMobileCalendar();
  } else {
    // Reset to desktop view
    $('.calendar').css({
      'width': '800px', // Original width
      'height': '600px', // Original height
    });
    initializeDesktopCalendar();
  }
}

function initializeMobileCalendar() {
  // Code to initialize or adjust calendar for mobile
}

function initializeDesktopCalendar() {
  // Code to initialize or adjust calendar for desktop
}
