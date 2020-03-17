// Add Calendar Material Icon for jQuery datepicker
function addCalendarIcon() {
  jQuery('.fsCalendar').each(function(i) {
    var calendarLink = jQuery(this);
    var calendarTrigger = jQuery(calendarLink.siblings('.ui-datepicker-trigger'));
    var newCalendarIcon = jQuery('<i></i>')
      .addClass("material-icons coa-calendar-icon")
      .text("calendar_today")
      .attr({
        "alt": "Select Date",
        "title": "Select Date",
        "aria-hidden": true,
      })
      .click(function(){
        calendarTrigger.trigger('click')
      })
    newCalendarIcon.insertBefore(calendarLink);
  });
}

// Can only modify calendar icon after Formstack's 'load' callback
window.addEventListener('load', addCalendarIcon, false);
