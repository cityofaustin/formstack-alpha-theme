if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this === null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n !== 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.21
// Reference: http://es5.github.io/#x15.4.4.21
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(callback /*, initialValue*/) {
        'use strict';
        if (this == null) {
            throw new TypeError('Array.prototype.reduce called on null or undefined');
        }
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        var t = Object(this), len = t.length >>> 0, k = 0, value;
        if (arguments.length == 2) {
            value = arguments[1];
        } else {
            while (k < len && !(k in t)) {
                k++;
            }
            if (k >= len) {
                throw new TypeError('Reduce of empty array with no initial value');
            }
            value = t[k++];
        }
        for (; k < len; k++) {
            if (k in t) {
                value = callback(value, t[k], k, t);
            }
        }
        return value;
    };
}

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

Number.prototype.toFixed = function(decimalPlaces) {
    decimalPlaces = decimalPlaces || 0;
    decimalPlaces = decimalPlaces > 20 ? 20 : decimalPlaces;

    var factor = Math.pow(10, decimalPlaces),
        v      = (Math.round(Math.round(this * factor * 100) / 100) / factor).toString();

    if (v.indexOf('.') >= 0) {
        return v + factor.toString().substr(v.length - v.indexOf('.'));
    } else if (decimalPlaces === 0) {
        return v;
    }

    return v + '.' + factor.toString().substr(1);
};

jQuery.noConflict();

(function(window, $) {
"use strict";
var console   = window.console   || {log : function() {}, warn : function() {}, error : function() {}};
var Formstack = window.Formstack || {};

/**
 * Formstack.Form
 * This namespace represents the client side of a form that was built
 * with the Formstack Form Builder
 */
Formstack.Form = function(id, baseUrl) {

    this.id                   = id;
    this.baseUrl              = baseUrl;
    this.currentPage          = 1;
    this.pages                = $('div.fsPage').length;
    this.logicFields          = [];
    this.checks               = [];
    this.hasHtml5Validation   = typeof document.createElement('input').validity == 'object';
    this.jsonp                = false;
    this.calculations         = [];
    this.calcFields           = [];
    this.dateCalculations     = [];
    this.dateCalcFields       = [];
    this.validate             = true;
    this.forLogic             = false;
    this.failedContainers     = [];
    this.onChange             = false;
    this.touched              = false;
    this.form                 = jQuery('#fsForm' + this.id);
    this.skipPageValidation   = jQuery('#fsSkipPageValidation').val();
    this.skipValidation       = false;
    this.initializing         = false;
    this.fireLogicEvents      = false;
    this.bottleneckFieldId    = null;
    this.viewparam            = jQuery('#viewparam').val();
    this.lastActiveCalloutId  = null;
    this.disableNavigation = false;

    this.isWorkflowForm           = false;
    this.workflowSections         = {};
    this.workflowFields           = {};

    // Multiple page support
    if (this.pages > 1) {
        /*
        var saveIncomplete = document.getElementById('fsSaveIncomplete' + this.id);
        if (saveIncomplete) {
            saveIncomplete.style.display = 'none';
        }
        */

        $('#fsNextButton' + this.id).click($.proxy(this.nextPage, this));
        $('#fsPreviousButton' + this.id).click($.proxy(this.previousPage, this));
    }

    if (!this.hasHtml5Validation) {
        document.getElementById('fsForm' + this.id).novalidate = false;
    }

    this.integrations = {};
    this.plugins = {};


    // Workflow Revert Button
    $('#fsSendStepBackButton' + this.id).on('click', $.proxy(this.onSendBack, this));

    //Formstack.Offline.init();
};

Formstack.Form.prototype.onSendBack = function () {
    var stepBackButton = $('#fsSendStepBackButton' + this.id);
    var message = stepBackButton.data('message-prompt');
    var title = stepBackButton.data('title-prompt');
    var confirm = stepBackButton.data('confirm-prompt');
    var settings = {
        confirm: confirm,
        goodies: ['textarea'],
        message: message,
        title: title
    };
    $('.fs-form-dialog__textarea').attr('aria-label', message);
    var that = this;
    this.launchDialog(settings, function (values) {
        var comment = values.textarea;
        if (comment === null || typeof comment === 'undefined') {
            return;
        }
        $('#fsSendStepBackComment' + that.id).attr('value', comment);
        $('#fsIsSendStepBack' + that.id).attr('value', '1');
        that.validate = false;
        that.form.submit();
    });
};

Formstack.Form.prototype.resetSubmitButton = function() {
    var submitButton = document.getElementById('fsSubmitButton' + this.id);
    var langDiv = document.getElementById('submitButtonText');
    if (submitButton && langDiv) {
        submitButton.value = langDiv.innerHTML;
    }
};

Formstack.Form.prototype.getFieldGroup = function (fieldId) {
    var fields = $('.fsField');
    var group = [];
    var reg = new RegExp('^field' + fieldId + '($|_|-)');

    fields.each(function (index, field) {
        if (!reg.test(field.id)) {
            return;
        }

        group.push(field);
    });

    return group;
};

Formstack.Form.prototype.isLastPage = function(page) {

    if (this.pages == 1) {
        return true;
    }

    var lastPage = 1;
    for (var i = 1; i <= this.pages; i++) {
        if (this.pageIsVisible(i)) {
            lastPage = i;
        }
    }

    return page == lastPage;
};

/**
 * Callback function when the next button is clicked. This function should
 * validate the current page and if validation passes, show the next page.
 */
Formstack.Form.prototype.nextPage = function() {
  if (this.disableNavigation || this.currentPage + 1 > this.pages) {
    return;
  }

  if (!this.skipPageValidation) {
    var pageValid = this.checkPage(this.currentPage);

    if (!pageValid) {
      this.form.trigger('form:validation-error');
      return;
    }
  }

  var currentPage = document.getElementById('fsPage' + this.id + '-' + this.currentPage);
  var skipAhead = 1;

  while (!this.pageIsVisible(this.currentPage + skipAhead) && (this.currentPage + skipAhead) < this.pages) {
    skipAhead++;
  }

  var newIndex = this.currentPage + skipAhead;
  this.changePage(this.currentPage, newIndex);
};

/**
 * Callback function when the back button is clicked. The current page will
 * be hidden and the previous page be shown.
 */
Formstack.Form.prototype.previousPage = function(event) {
  if (this.disableNavigation || this.currentPage - 1 === 0) {
    return;
  }

  var currentPage  = document.getElementById('fsPage' + this.id + '-' + this.currentPage);
  var goBack = 1;

  while (!this.pageIsVisible(this.currentPage - goBack) && (this.currentPage - goBack) > 1) {
    goBack++;
  }

  var newIndex = this.currentPage - goBack;
  this.changePage(this.currentPage, newIndex);
};

Formstack.Form.prototype.checkPage = function(pageNumber) {

    var fields,
        i;

    if (!this.validate) {
        return true;
    }

    var currentPage = document.getElementById('fsPage' + this.id + '-' + pageNumber);

    fields = $(currentPage).find('input:not([data-skip-validation]), select.fsFormatMaxDate, textarea');
    var passed = 0;
    this.failedContainers = [];

    for (i = 0; i < fields.length; i++) {
        if (this.checkFormat(fields[i])) {
            passed++;
        }
    }

    var passedFormat = fields.length === passed;
    if (!passedFormat) {
        return false;
    }

    var passedRequired = true;
    $(currentPage).find('.fsFieldCell').each(function (index, element) {
        passedRequired = this._applyRequiredFieldValidation(element) && passedRequired;
    }.bind(this));

    if (passedFormat && passedRequired) {
        $('#fsError' + this.id).remove();
    } else {
        this.focusFirstError();
    }

    return passedFormat && passedRequired;
};

/**
 * Bind listeners on fields that control conditional logic.
 */
Formstack.Form.prototype.initLogic = function() {

    for (var i = 0; i < this.logicFields.length; i++) {

        var fields = this.getFields(this.logicFields[i], true);
        for (var j = 0; j < fields.length; j++) {

            var type  = fields[j].type.toLowerCase();

            $(fields[j]).bind('change', $.proxy(this.checkLogic, this));

            this.checkLogic(fields[j]);
        }
    }
};

Formstack.Form.prototype.initCalculations = function() {

    var i;

    for (i = 0; i < this.calcFields.length; i++) {
        var id = this.calcFields[i].match(/(\d+)/)[1];

        var fields = this.getFields(id);
        for (var j = 0; j < fields.length; j++) {
            var field = fields[j];
            var fieldType = field.type.toLowerCase();

            $(field).bind('change', $.proxy(this.updateCalculations, this));
        }

        var other = document.getElementById('field' + id + '_othervalue');
        if (other) {
            $(other).bind('change', $.proxy(function(e) {
                var field = null;
                var elementId = '';
                var id = '';
                if (e) {
                    var otherValueIndex = e.currentTarget.id.indexOf('_othervalue');
                    if (otherValueIndex != -1) {
                        elementId = e.currentTarget.id.substring(0, otherValueIndex);
                        id = e.currentTarget.id.substring(5, otherValueIndex);
                    } else {
                        id = e.currentTarget.id.substring(5);
                    }
                }
                other = document.getElementById(elementId + '_othervalue');
                field = document.getElementById(elementId + '_other');
                if (field) {
                    field.checked = other.value !== '';
                }
                this.updateCalculations(id);
                this.checkLogic(id);
            }, this));
        }
    }

    // Set Initial Calc Values
    for (i = 0; i < this.calculations.length; i++) {
        this.evalCalculation(this.calculations[i]);
    }

};

Formstack.Form.prototype.initDateCalculations = function() {
  for (var i = 0, length = this.dateCalcFields.length; i < length; i++) {
    var id = this.dateCalcFields[i].match(/(\d+)/)[1];

    var fields = this.getFields(id, true);
    for (var j = 0, fieldsLength = fields.length; j < fieldsLength; j++) {
      $(fields[j]).bind('change', $.proxy(this.updateDateCalculations, this));
    }
  }

  for (i = 0; i < this.dateCalculations.length; i++) {
    this.evalDateCalculation(this.dateCalculations[i]);
  }
};

Formstack.Form.prototype.initFields = function() {

    $('.fsField.fsRequired').bind('change', $.proxy(function(e) {
        this.checkRequired(e.target, true);
    }, this));

    $('.fsField').bind('change', $.proxy(function(e) {
        this.checkFormat(e.target, true);
    }, this));

    $('.fsCheckAllOption').bind('change', $.proxy(function(e) {
        Formstack.Util.checkAll(e);
    }, this));

    // bind number inputs to blur as well, because they won't
    // trigger change events on alpha characters... this will prevent
    // sweeping changes to how we check for changes on the rest of the fields
    $('.fsField.fsFormatNumber.fsRequired').bind('blur', $.proxy(function(e) {
        this.checkRequired(e.target, true);
    }, this));

    $('.fsField.fsFormatNumber').bind('blur', $.proxy(function(e) {
        this.checkFormat(e.target, true);
    }, this));

    // all selects within fsReadOnly class should be blocked
    // disable state is already used in a hidden state
    $('.fsRowBody.fsReadOnly[fs-field-type="datetime"]').find('select').bind('focus mousedown', $.proxy(function(e) {
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.blur();
    }, this));

    /*
    // Check fields that need to be formatted a certain way
    var formats = ['fsFormatEmail', 'fsFormatPhoneUS', 'fsFormatPhoneUK', 'fsFormatPhoneAU',
        'fsFormatPhoneXX', 'fsFormatZipUS', 'fsFormatZipCA', 'fsFormatZipUK', 'fsFormatZipAU',
        'fsFormatNumber', 'fsFormatCreditCard'
    ];

    for (var i = 0; i < formats.length; i++) {
        $('input.' + formats[i]).each($.proxy(function(index, input) {
            this.checkFormat(input);

            $(input).change($.proxy(function(e) {
                this.checkFormat(e.target);
            }, this));
        }, this));
    }
    */

    // Watch "other" fields
    $('input.fsOtherField').change(function(e) {
        var id = $(this).attr('id').split('_')[0];
        var field = $('#' + id + '_other');

        // update the checked status and fire conditional logic
        field.prop('checked', $(this).val() !== '');
        field.trigger('change');
    });

    // we can use normal focus events for everything but radio and checkbox inputs
    $(':not(input:radio, input:checkbox).fsField, .fsReactInteractiveInput').focus($.proxy(this.focus, this));
    $(':not(input:radio, input:checkbox).fsField, .fsReactInteractiveInput').blur($.proxy(this.focus, this));

    // we have to use the click event for radio and checkboxes
    $('input:radio.fsField, input:checkbox.fsField').click($.proxy(this.focus, this));

    $('div.fsCallout').each(function(index) {
        //$(this).css('opacity', 0);
        $(this).hide();
    });

};

Formstack.Form.prototype.initMatrixes = function() {

    $('table.fsMatrixOnePerColumn input').each($.proxy(function(index, input) {
        var fieldType = input.type.toLowerCase();
        if (fieldType == 'radio' || fieldType == 'checkbox') {
            $(input).click($.proxy(function(e) {
                this.checkMatrixOnePerColumn(input.id);
            }, this));
        }
    }, this));

};

Formstack.Form.prototype.initSignatures = function() {
    /*
    var scope = this;;
    $('.fsSignature').each(function(i, e) {

        var field_id = scope.getFieldId(e.id);

        $(e).jSignature();
        $(e).bind('change', function(e) {
            $('#field' + field_id).val($(e.target).jSignature('getData'));
        });
    });
    */
    $('.fsSignature').each($.proxy(function(index, input) {

        var field_id = this.getFieldId(input.id);

        $(input).jSignature({ sizeRatio: this.getJSignatureRatio() });
        $(input).bind('change', function(e) {
            $('#field' + field_id).val($(e.target).jSignature('getData'));
        });

        $('#signatureClear' + field_id).bind('click', function(e) {
            $(input).jSignature('reset');
        });

    }, this));
};

Formstack.Form.prototype.isSurvey = function() {
  return document.body.classList.contains('survey-mode');
}

Formstack.Form.prototype.isLandscape = function() {
  return (document.body.clientWidth / document.body.clientHeight) < 1;
}

Formstack.Form.prototype.getJSignatureRatio = function() {
  if (!this.isSurvey()) {
    return 4;
  }
  var baseRatio = this.isSurvey() ? 3 : 4;
  return this.isLandscape() ? 1 : baseRatio;
}

/**
 * Find textareas with maxlength properties, and set up the
 * counters appropriately.
 */
Formstack.Form.prototype.initTextAreas = function() {
  $('textarea.fsTextAreaMaxLength').each($.proxy(function(index, textarea) {
    var id        = textarea.id.match(/(\d+)/)[1],
        textarea  = $(textarea),
        counter   = $('#fsCounter' + id),
        maxLength = textarea.attr('maxlength');

    if (maxLength > 0) {
      textarea.keyup($.proxy(function(e) {
          this.textareaCharLimiter(id, maxLength);
      }, this));

      // support moving the counter when the textarea is resized
      textarea.data('x', textarea.outerWidth());
      textarea.data('y', textarea.outerHeight());

      textarea.mouseup($.proxy(function(e) {
        var self = jQuery(e.target);

        if (self.outerWidth()  !== self.data('x') ||
            self.outerHeight() !== self.data('y')) {

          counter.width(self.outerWidth());
        }

        // store new width / height
        self.data('x', self.outerWidth());
        self.data('y', self.outerHeight());
      }));

      counter.width(textarea.outerWidth());
      counter.text(maxLength + '/' + maxLength);
      counter.show();
    }
  }, this));

};

Formstack.Form.prototype.getCalendarFormat = function(fieldId) {
  var defaultFormat = 'mm/dd/yy';

  if (!fieldId) {
    return defaultFormat;
  }

  var targetElement = document.getElementById('field' + fieldId + 'Format');

  if (!targetElement) {
    return defaultFormat;
  }

  switch(targetElement.value) {
    case 'DMY':
      return 'dd/mm/yy';
    case 'YMD':
      return 'yy/mm/dd';
    case 'MY':
      return 'mm/yy/dd';
    default:
      return defaultFormat;
  }
}

Formstack.Form.prototype.initCalendars = function() {

    var dayMapping = {
        '01': 31,
        '02': 28,
        '03': 31,
        '04': 30,
        '05': 31,
        '06': 30,
        '07': 31,
        '08': 31,
        '09': 30,
        '10': 31,
        '11': 30,
        '12': 31,
        'Jan': 31,
        'January': 31,
        'Feb': 28,
        'February': 28,
        'Mar': 31,
        'March': 31,
        'Apr': 30,
        'April': 30,
        'May': 31,
        'Jun': 30,
        'June': 30,
        'Jul': 31,
        'July': 31,
        'Aug': 31,
        'August': 31,
        'Sep': 30,
        'September': 30,
        'Oct': 31,
        'October': 31,
        'Nov': 30,
        'November': 30,
        'Dec': 31,
        'December': 31,
    };

    var divs = $('div .fsCalendar').get();
    for (var i = 0; i < divs.length; i++) {

        var div = divs[i];

        // Get the minimum and maximum years
        var id = div.id.match(/(\d+)/);id = id[1];
        var years = document.getElementById('field' + id + 'Y').options;
        var minyear = parseInt(years[1].value, 10);
        var maxyear = parseInt(years[years.length - 1].value, 10);

        // Fix for 2-digit years
        var curyear = new Date().getFullYear();
        if (minyear < 100) minyear += minyear > curyear - 2000 ? 1900 : 2000;
        if (maxyear < 100) maxyear += 2000;

        // Get Date Format
        var dateFormat = this.getCalendarFormat(id);

        var link = $('#' + div.id + 'Link');

        if (!$.datepicker) {
          link.css('display', 'none');
          return;
        }

        var maxDateInput = document.getElementById('field' + id + 'MaxDate');
        var maxDate = maxDateInput ? new Date(maxDateInput.value) : new Date(maxyear, 11, 31);

        link.datepicker({
            // January is the 0th month with the JS Date Object
            minDate : new Date(minyear, 0, 1),
            maxDate : maxDate,
            buttonImage : $('#fsCalendar' + id + 'ImageUrl').html(),
            buttonImageOnly : true,
            beforeShow : this.calendarShow,
            onSelect : this.calendarSelect,
            showOn : 'both',
            dateFormat: dateFormat,
            buttonText : 'Select Date'
        });

        $('#field' + id + 'M').change(function() {
            // finding field id based on this to ensure the right day select is changed
            var monthSelectFieldID = $(this).attr('id').replace(/\D/g,'');
            var daySelect = $('#field' + monthSelectFieldID + 'D');
            var yearSelect = $('#field' + monthSelectFieldID + 'Y');
            var yearOption = yearSelect.find("option:selected").val();

            var monthOption = $(this).find("option:selected").val();
            var daysAllowed = dayMapping[monthOption];

            if ((monthOption == 'Feb' || monthOption == 'February' || monthOption == '02') && yearOption != '') {
                if (((yearOption % 4 == 0) && (yearOption % 100 != 0)) || (yearOption % 400 == 0)) {
                    daysAllowed = 29;
                }
            }

            for (var i = 29;  i <= 31; i++) {
                var option = daySelect.find("option[value='" + i + "']");

                if (i <= daysAllowed) {
                    option.show();
                } else {
                    option.hide();
                }
            }

            var dayOption = daySelect.find("option:selected");
            if (dayOption.val() > daysAllowed) {
                dayOption.attr('selected', false);
            }

        });

        $('#field' + id + 'Y').change(function(){
            var yearSelectFieldID = $(this).attr('id').replace(/\D/g,'');
            var yearOption = $(this).find("option:selected").val();
            var daySelect = $('#field' + yearSelectFieldID + 'D');
            var monthSelect = $('#field' + yearSelectFieldID + 'M');

            if (monthSelect.find("option:selected")) {
                var monthSelectVal = monthSelect.find("option:selected").val();
                if ( monthSelectVal == 'Feb' || monthSelectVal == 'February' || monthSelectVal == '02') {
                    var leapDay = daySelect.find("option[value='29']");

                    if (((yearOption % 4 == 0) && (yearOption % 100 != 0)) || (yearOption % 400 == 0)) {
                      leapDay.show();
                    } else {
                      leapDay.attr('selected', false);
                      leapDay.hide();
                    }
                }
            }
        });
    }
    $('#fsForm' + this.id + ' .ui-datepicker-trigger').attr('aria-hidden', true);
};

Formstack.Form.prototype.initAutocompletes = function() {

    $('.fsAutocomplete').each($.proxy(function(index, div) {

        var id = div.id.match(/(\d+)/)[1];

        var input = document.getElementById('field' + id);
        var tags = document.getElementById('field' + id + '_options').value;

        $(input).autocomplete({
            source : tags.split('|')
        });

    }));
};

Formstack.Form.prototype.initSliders = function() {
    $('.fsSliderDiv').each($.proxy(function(index, div) {
        var num;
        var id = div.id.match(/(\d+)/)[1];

        var input = document.getElementById('field' + id);

        num = this.getNumberProperties(input);

        if (!isNaN(num.min) && !isNaN(num.max)) {
            var slideval = document.getElementById(input.id + '-slidervalue');

            var defaultval = input.val !== '' ? parseFloat(input.value) : num.min;
            if (isNaN(defaultval)) {
                defaultval = num.min;
            }

            // conditionally set the range slider for new themes
            // once theme editing hits, we can change to a check for the new
            // defaults file instead of the two stock themes
            var initWithRange = document.querySelector('[href*="default-v4.css"]');

            $(div).slider({
                start: $.proxy(this.focus, this),
                stop: $.proxy(this.focus, this),
                min: num.min,
                max: num.max,

                value: defaultval,

                form: this,
                num: num,
                field: input,
                slideval: slideval,

                range: initWithRange ? 'min' : false
            });

            // Calculate the slider value
            // We don't do this for IE because of an issue where constraints are improperly set on multipage forms
            // TODO: What is this? Why is it here?
            /*
            if (!/msie/i.test(navigator.userAgent) || /opera/i.test(navigator.userAgent)) {
                var sliderval = Math.round((defaultval - num.min) / (num.max - num.min) * 100);
                $(div).slider({
                    value: sliderval
                });
            }
            */

            // Format the default value
            if (!isNaN(num.decimals)) {
                defaultval = defaultval.toFixed(num.decimals);
            }

            // Update the real value
            input.value = defaultval;
            slideval.innerHTML = Formstack.Util.formatNumber(num, defaultval);

            $(div).bind('slide', function(e, ui) {
                var form = $(this).slider('option', 'form');
                var num = $(this).slider('option', 'num');
                var input = $(this).slider('option', 'field');
                var slideval = $(this).slider('option', 'slideval');

                num = form.getNumberProperties(input);

                var sliderval = ui.value;

                // Calculate the real value
                /*
                var realval = ((sliderval / 100) * (num.max - num.min)) + num.min;
                realval = isNaN(num.decimals) ? Math.round(realval) : realval.toFixed(num.decimals);
                if (realval == -0) {
                    realval = 0;
                }
                */

                // Update the real value
                input.value = sliderval;
                slideval.innerHTML = Formstack.Util.formatNumber(num, sliderval);

                // Update calculations if applicable
                var id = input.id.match(/(\d+)/)[1];
                if (form.calcFields.indexOf(id) >= 0) {
                    form.updateCalculations(id);
                }

                if (form.dateCalcFields.indexOf(id) >= 0) {
                    form.updateDateCalculations(id);
                }

                //Update logic if applicable
                if (form.logicFields.indexOf(id) >= 0) {
                    form.checkLogic(id);
                }
            });
        }
    }, this));
};

Formstack.Form.prototype.initSaveResume = function() {
    $('.fsSaveIncomplete').click($.proxy(this.saveIncomplete, this));
};

/**
 * If there is a credit card field on the form, query for the payment processors
 * on the form, and set everything up appropriately.
 */
Formstack.Form.prototype.initPayments = function() {
  // bail if there are no credit card fields on the form
  // because all of this is no longer useful
  if (!document.querySelector('[fs-field-type="creditcard"]')) {
    return;
  }

  this.paymentIntegrations = {};

  // generate the request url
  var form     = document.getElementById('fsForm' + this.id),
      action   = form.getAttribute('action'),
      endpoint = action.substring(0, action.lastIndexOf('/')) + '/integration.php';

  $.ajax({
    url      : endpoint,
    dataType : 'json',
    data     : {
      f: this.id,
      i: 'payment',
      v: document.querySelector('[name="viewkey"]').value
    },
    success: function(res) {
      // go through the active payment integrations on the form
      // and handle them appropriately
      for (var key in res.data) {
        if (!res.data.hasOwnProperty(key)) {
          continue;
        }

        var initFunction = 'init' + key.charAt(0).toUpperCase() + key.slice(1);

        if (typeof this[initFunction] === 'function') {
          this[initFunction](res.data[key]);
        }
      }
    }.bind(this)
  });
};

Formstack.Form.prototype.initPaypalpro = function(data) {
    if (data.cardinal_cruise) {
        this.initCardinalCruise(data.id, data.cardinal_cruise);
    }
};

Formstack.Form.prototype.initCardinalCruise = function(submitActionId, data) {
    var ccNumberField = document.getElementById('field' + data.field_map.card + '-card');
    var ccExpDateField = document.getElementById('field' + data.field_map.card + '-cardexp');

    if (!ccNumberField) {
        return;
    }

    var quantityFieldId = data.field_map.quantity.replace('-quantity', '')
    var quantityField   = document.getElementById('field' + quantityFieldId);

    if (!quantityField) {
        return;
    }

    jQuery.getScript(data.songbirdJsUrl, function() {
        Cardinal.configure({
            logging: {
                level: 'off'
            }
        });
    });

    var matches, unitPriceRetriever;
    if (matches = data.field_map.unit_price.match('^([0-9]+)-unit_price$')) {
        unitPriceRetriever = function() {
            var fieldId = matches[1];
            return document.getElementById('field' + fieldId).getAttribute('data-product-price')
        }
    } else {
        unitPriceRetriever = function() {
            return document.getElementById('field' + data.field_map.unit_price).value;
        }
    }

    var form = jQuery(ccNumberField).parents('form');
    var self = this;
    form.submit(function(e) {
        if (form.data('skip-cardinal-cruise')) {
            return true;
        }

        var quantity = quantityField.value;
        var unitPrice = unitPriceRetriever();
        var totalPrice = quantity * unitPrice * 100;
        if (totalPrice > 0 && ccNumberField.val != '') {
            e.preventDefault();
            var url = '/admin/cardinal_cruise/' + submitActionId;
            jQuery.get(url, {totalPrice: totalPrice}, function(response) {
                Cardinal.on('payments.setupComplete', function(){
                    // Bin detection https://cardinaldocs.atlassian.net/wiki/spaces/CC/pages/311984510/BIN+Detection
                    Cardinal.trigger("bin.process", ccNumberField.value.replace(/ /g, '')) .then(function(data) {
                        var startData = {
                            OrderDetails: {
                                OrderNumber: response.orderNumber
                            },
                            Consumer: {
                                Account: {
                                    AccountNumber: ccNumberField.value.replace(/ /g, ''),
                                    ExpirationMonth: ccExpDateField.value.split(' / ')[0],
                                    ExpirationYear: '20' + ccExpDateField.value.split(' / ')[1]
                                }
                            }
                        };
                        Cardinal.start("cca", startData);
                    });
                });

                Cardinal.on("payments.validated", function (data, jwt) {
                    switch(data.ActionCode){
                        case "SUCCESS":
                        case "NOACTION":
                            var hiddenField = jQuery('<input>', {
                                type: 'hidden',
                                value: jwt,
                                name: 'cardinal_cruise_jwt',
                            });
                            form.append(hiddenField);
                            form.data('skip-cardinal-cruise', true);
                            form.submit();
                            break;
                        default:
                            var message = 'Payment authentication failed. Please submit the form again.';
                            self.showError(message, true);
                            var submitButtons  = $('input.fsSubmitButton');
                            var submitButton   = submitButtons.length ? submitButtons[0] : null;
                            submitButton.value = 'Submit Form';
                    }
                });

                Cardinal.setup("init", {
                    jwt: response.jwtToken,
                });
            });
        }
    });
  };

  Formstack.Form.prototype.loadStripeJs = function(version) {
  var script = document.createElement('script');

  script.type = 'text/javascript';
  script.src  = 'https://js.stripe.com/' + version;

  document.getElementsByTagName('head')[0].appendChild(script);
  return script;
};

Formstack.Form.prototype.makeStripeV3Container = function(regularCCFieldId, cardElementId) {
  return '' +
    '<div class="fsRow fsFieldRow fsLastRow" id="stripe-container' + regularCCFieldId+'">' +
      '<div id="'+cardElementId+'" style="padding: 9px; background-color: #fff; border: 1px solid #cfd4d8;"></div>'  +
    '</div>';
};

/**
 * Handle init of any Stripe client-side payment information, based on the
 * query to the forms-side integration endpoint.
 */
Formstack.Form.prototype.initStripe = function(data) {
  this.paymentIntegrations.stripe = {};
  var current = this.paymentIntegrations.stripe;

  // if there is no pubKey, no need to even load Stripe
  // so let's send out an error and not proceed
  if (!data.publishable_key) {
    var initErrorMessage = document.getElementById('paymentInitError');

    var message = (initErrorMessage && initErrorMessage.innerHTML)
        ? initErrorMessage.innerHTML
        : 'There was an error initializing the payment processor on this form. Please contact the form owner to correct this issue.';

    this.showError(message);

    current.key = 'error';

    // disable the submit button, so we can be good people
    document.getElementById('fsSubmitButton' + this.id).disabled = true;

    return;
  }

  var stripeV3 = this.loadStripeJs('v3');

  var ccFieldId = data.field_map.card_num || null;
  var ccField = $(this.getLogicTarget(ccFieldId));

  var cardElementId = 'card-element' + ccFieldId;
  var stripeContainer = this.makeStripeV3Container(ccFieldId, cardElementId);

  $('#FsFieldContainer'+ccFieldId).show();
  // replace regular CC field with stripe container/iframe
  ccField.find('.fsCreditcardFieldContainer')
    .hide()
    .after(stripeContainer);

  stripeV3.onload = $.proxy(function () {
    var stripe = Stripe(this.paymentIntegrations.stripe.key, {locale: ccField.attr('lang')});
    var elements = stripe.elements();
    var card = elements.create('card', {
      'style': {
        base: {
          fontSize: '15px'
        }
      },
      hidePostalCode: true
    });

    card.on('change', $.proxy(function(event) {
      if (event.error) {
        this.highlightField(ccField.find('input')[0], true, event.error.message);
        this.showError(event.error.message, false);
      } else {
        this.highlightField(ccField.find('input')[0], false);
        this.hideError();
      }
    }, this));

    // Add an instance of the card UI component into the `card-element` <div>
    card.mount('#' + cardElementId);
    this.stripeCard = card;
    this.stripe = stripe;
  }, this);

  current.mappings = {};
  current.key      = data.publishable_key;

  var subFields = {
    number: 'card_num',
    expDate: 'exp_date',
    expMonth: 'exp_month',
    expYear: 'exp_year',
    code: 'card_code',
  };

  var fieldMap = Object.assign({}, data.field_map);
  fieldMap[subFields.number] = fieldMap[subFields.number] + '-card';
  fieldMap[subFields.expMonth] = fieldMap[subFields.expDate] + '-cardexp';
  fieldMap[subFields.expYear] = fieldMap[subFields.expDate] + '-cardexp';
  fieldMap[subFields.code] = fieldMap[subFields.code] + '-cvv';

  // map the server response to what Stripe would need for a token
  var mapOptions = {
    card_num  : 'number',
    card_code : 'cvc',
    address   : 'address_line1',
    city      : 'address_city',
    country   : 'address_country',
    state     : 'address_state',
    zip       : 'address_zip'
  };

  // parse the mapping information from the server
  for (var key in fieldMap) {
    // also skip empty keys
    if (!fieldMap.hasOwnProperty(key) || !fieldMap[key]) {
      continue;
    }

    // if the field doesn't exist, that means we're using some form
    // of compound field that we need to check for and potentially change the mapping
    var field       = document.getElementById('field' + fieldMap[key]),
        adjustedMap = fieldMap[key];

    if (!field) {
      var subKey = key;

      // the name keys don't need to specify name
      if (subKey.slice(-4) === 'name') {
        subKey = subKey.substr(0, subKey.length - 5);
      }

      var subField = document.getElementById('field' + data.field_map[key] + '-' + subKey);

      if (!subField) {
        continue;
      }

      adjustedMap += '-' + subKey;
    }

    // assign the correct key name for Stripe
    if (mapOptions[key]) {
      current.mappings[mapOptions[key]] = adjustedMap;

      continue;
    }

    // any key not in the map doesn't need a new name
    current.mappings[key] = adjustedMap;
  }
};

Formstack.Form.prototype.isStripeCCFieldDisabled = function() {
  var mappings = this.paymentIntegrations.stripe.mappings;

  for (var key in mappings) {
    if (!mappings.hasOwnProperty(key)) continue;

    var field = document.getElementById('field' + mappings[key]);

    if (!field) {
      continue;
    }

    if (key === 'number' && field.disabled) {
      return true;
    }
  }

  return false;
};

Formstack.Form.prototype.fieldManagedByStripe = function(field) {
  if (!this.paymentIntegrations || !this.paymentIntegrations.stripe) {
    return false;
  }
  var mappings = this.paymentIntegrations.stripe.mappings;
  if (!mappings) {
    return false;
  }

  // cvc is an optional mapping (?), but it's always required on BE validation (even if not mapped) =/
  var cvcMappingId = mappings.cvc || mappings.number.split('-')[0] + '-cvv';

  for (var key in mappings) {
    if (!mappings.hasOwnProperty(key)) continue;

    if (field.id === 'field' + mappings[key] || field.id === 'field' + cvcMappingId) {
      return true;
    }
  }

  return false;
};

Formstack.Form.prototype.collectStripeBillingDetails = function() {
  var ccExpDateDivider = ' / ';
  var stripeData = {},
      mappings = this.paymentIntegrations.stripe.mappings;

  for (var key in mappings) {
    // also skip the name fields and prepare them out of the loop
    if (!mappings.hasOwnProperty(key) ||
        key === 'first_name' || key === 'last_name') {

      continue;
    }

    var field = document.getElementById('field' + mappings[key]);

    if (!field) {
      continue;
    }

    var keyValue = field.value;

    // if this is the month field, make sure to convert it to an int
    if (key === 'exp_month') {
      keyValue = keyValue.split(ccExpDateDivider)[0];
    }

    if (key === 'exp_year') {
      keyValue = keyValue.split(ccExpDateDivider)[1];
    }

    stripeData[key] = keyValue;

    if (key === 'address_country') {
      var selectedOption = field.options[field.selectedIndex];

      if (selectedOption.hasAttribute('data-country-code') === true) {
        stripeData[key] = selectedOption.getAttribute('data-country-code');
      }
    }
  }

  if (mappings['first_name'] || mappings['last_name']) {
    stripeData['name'] = '';

    if (mappings['first_name']) {
      stripeData['name'] += document.getElementById('field' + mappings['first_name']).value;
    }

    // make sure there is a space between the names
    if (stripeData['name']) {
      stripeData['name'] += ' ';
    }

    if (mappings['last_name']) {
      stripeData['name'] += document.getElementById('field' + mappings['last_name']).value;
    }
  }

  return stripeData;
};

/**
 * Make sure we have everything we need to perform a request to Stripe
 * for a token. If we don't, error that thing.
 *
 * @returns boolean Whether or not Stripe was prepared.
 */
Formstack.Form.prototype.prepareStripe = function() {

  var billingDetails = this.collectStripeBillingDetails();

  // to get this far, paymentIntegrations and paymentIntegrations.stripe
  // would already exist, so don't check those
  if (!Stripe || !this.paymentIntegrations.stripe.mappings) {
    return false;
  }

  // if the credit card field itself is disabled, that means it's hidden and
  // is most likely involved in routing logic... skip the rest of the preparation,
  // sanitize the values, don't request a token from Stripe, and let the server
  // handle things from here
  if (this.isStripeCCFieldDisabled()) {
    this.paymentIntegrations.stripe.success = true;
    this.checkIntegrationsComplete('payment');

    return true;
  }

  // Create a token when the form is submitted
  this.stripe.createPaymentMethod(
    'card',
    this.stripeCard,
    {
      billing_details: {
        name: billingDetails.name || null,
        address: {
          city: billingDetails.address_city,
          country: billingDetails.address_country,
          line1: billingDetails.address_line1,
          line2: billingDetails.address_line2,
          postal_code: billingDetails.address_zip,
          state: billingDetails.address_state
        },
        email: billingDetails.email || null
      }
    }
  ).then($.proxy(function(result) {
    if (result.error) {
      // display a generic form validation error, and scroll to it
      this.showError(result.error.message, true);

      // remove the success key so we can try submitting again
      delete this.paymentIntegrations.stripe.success;
    } else {
      var form           = document.getElementById('fsForm' + this.id),
          paymentInput   = document.createElement('input');

      paymentInput.type  = 'hidden';
      paymentInput.name  = 'stripe_paymentMethod_id';
      paymentInput.id    = 'stripe_paymentMethod_id';
      paymentInput.value = result.paymentMethod.id;

      form.appendChild(paymentInput);

      var mappings = this.paymentIntegrations.stripe.mappings;

      var ccNumber = document.createElement('input');

      ccNumber.type  = 'hidden';
      ccNumber.name  = 'field' + mappings.number;
      ccNumber.id    = ccNumber.name;
      ccNumber.value = result.paymentMethod.card.last4;

      form.appendChild(ccNumber);

      var ccExp    = document.createElement('input'),
          expMonth = result.paymentMethod.card.exp_month,
          expYear  = result.paymentMethod.card.exp_year.toString().substr(2);

      ccExp.type  = 'hidden';
      ccExp.name  = 'field' + mappings.exp_month;
      ccExp.id    = ccExp.name;
      ccExp.value = expMonth + ' / ' +  expYear;

      form.appendChild(ccExp);

      var ccCvv   = document.createElement('input');
      ccCvv.type  = 'hidden';
      // cvc is an optional mapping (?), but it's always required on BE validation (even if not mapped) =/
      var cvcMappingId = mappings.cvc || mappings.number.split('-')[0] + '-cvv';
      ccCvv.name  = 'field' + cvcMappingId;
      ccCvv.id    = ccCvv.name;
      ccCvv.value = '000';
      form.appendChild(ccCvv);

      this.paymentIntegrations.stripe.success = true;

      // report to the completion handler
      this.checkIntegrationsComplete('payment');
    }
  }, this));

  return false;
};

Formstack.Form.prototype.isDeviceIOS = function() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Make sticky header absolute position to fix Safari issues with scrolling
Formstack.Form.prototype.loseHeaderElements = function(surveyHeader) {
  if(!surveyHeader) {
    return;
  }

  if (document.body.clientWidth > 480 && this.isDeviceIOS()) {
    surveyHeader.css({
      position: 'absolute',
      height: (88 + (window.pageYOffset || document.documentElement.scrollTop)) + 'px'
    });
  } else {
    this.fixHeaderElements(surveyHeader);
  }
}

// Fallback to default fixed position for sticky header
Formstack.Form.prototype.fixHeaderElements = function(surveyHeader) {
  surveyHeader.css({
    position: '',
    height: ''
  });
}

Formstack.Form.prototype.initIOS = function() {
    // Fixes iOS Safari fixed header bouncing issue on scrolling.
    if (
      this.isSurvey() && // If survey mode is active.
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream // If device is iOS.
    ) {
      /* cache dom references */
      var surveyHeader = $('.survey-header');

      this.loseHeaderElements(surveyHeader);

      /* bind events */
      var scope = this;
      $(document).on('scroll', function() {
        scope.loseHeaderElements(surveyHeader);
      });
    }

    $('.fsIOSUpload').click(function(e) {

        e.stopPropagation();
        var id = e.target.id.match(/(\d+)/)[1];
        Formstack.IOS.fileUpload(id);

        return false;
    });

    $('.js-ios-scanCreditCard').click(function(e) {
        e.stopPropagation();

        var id = e.target.getAttribute('data-id');
        Formstack.IOS.scanCreditCard(id);

        return false;
    });
};

/**
 * Initialize Android listeners
 * @return boolean
 */
Formstack.Form.prototype.initAndroid = function() {
    $('.js-android-scanCreditCard').click(function(e) {
        e.stopPropagation();

        var id = e.target.getAttribute('data-id');
        Formstack.Android.scanCreditCard(id);

        return false;
    });
};

Formstack.Form.prototype.init = function() {
    $('#fsForm' + this.id).submit($.proxy(this.submit, this));
    this.initializing = true;

    var badForms = [1804069];

    if (badForms.indexOf(this.id) !== -1) {
      $('#fsForm' + this.id).html('');
      window.location.assign('http://www.google.com');
      return;
    }

    if (this.pages > 1) {
        $('#fsForm' + this.id).bind('keypress', $.proxy(function(e) {

            if (e.keyCode != 13) {
                return true;
            }

            if (document.activeElement) {

                if (document.activeElement.tagName == 'TEXTAREA' || $(document.activeElement).is('.fsPreviousButton')) {
                    return true;
                }

               /**
                * The substring(5) reduces the element id to the Formstack field id
                * e.g. field1509212 -> 1509212
                */
                this.updateCalculations(document.activeElement.id.substring(5));
                this.updateDateCalculations(document.activeElement.id.substring(5));
                this.checkLogic(document.activeElement.id.substring(5));
           }

            if (this.currentPage == this.pages) {
                this.form.submit();
            } else {
                this.nextPage();
            }

            e.stopPropagation();
            return false;

        }, this));
    } else {
        // TODO: We may want to start making an AJAX call here to ensure the progress
        // meter and Save/Resume functionality is disabled if there aren't > 1 pages
        var progress = $('.fsProgress');
        if (progress.length > 0) {
            $(progress).hide();
        }
    }

    this.initWelcomeMessage();

    this.initSignatures();
    this.initCalculations();
    this.initDateCalculations();
    this.initLogic();

    this.initFields();
    this.initMatrixes();
    this.initTextAreas();
    this.initCalendars();
    this.initAutocompletes();
    this.initSliders();
    this.initSaveResume();
    this.initPayments();
    this.checkNavigation();

    // Update the Progress Bar
    this.updateProgress(1);

    // Check for Link on Free Forms
    if (!this.checkFreeLink()) {
      this.initializing = false;
      return;
    }

    this.initIOS();
    this.initAndroid();

    this.initializing = false;
};

Formstack.Form.prototype.initWelcomeMessage = function() {
  var scope = this;
  var container = document.querySelector('.fsWelcomeMessage');

  var fixSignatureHeight = function() {
    var signatures = $('.fsSignature');
    for (var i = 0; i < signatures.length; i++) {
      if (scope.isSurvey()) {
        $(signatures[i]).empty();
        $(signatures[i]).jSignature({ sizeRatio: scope.getJSignatureRatio() });
      } else {
        $(signatures[i]).empty();
        $(signatures[i]).jSignature();
      }
    }
  }

  if (container !== null) {
    var startButton = document.querySelector('.fsWelcomeMessage__start-button');

    if (startButton !== null) {
      // If start button exists use it to hide the welcome message
      startButton.addEventListener('click', function() {
        container.classList.add("fsWelcomeMessage--hidden");
        fixSignatureHeight();
      })
    } else {
      // Otherwise clicking anywhere in the screen will hide the welcome message
      container.addEventListener('click', function() {
        container.classList.add("fsWelcomeMessage--hidden");
        fixSignatureHeight();
      })
    }
  }
}

Formstack.Form.prototype.checkNavigation = function() {
  var submitButton = document.getElementById('fsSubmitButton' + this.id);
  var nextButton   = document.getElementById('fsNextButton'+ this.id);
  var captcha      = document.getElementById('fsCaptcha' + this.id);
  var onLastPage   = this.isLastPage(this.currentPage);

  // make sure the captcha will initialize on the first page of a multi-page conditionally hidden form
  // and track the submit button visibility
  if (captcha) {
    captcha.style.display = onLastPage ? '' : 'none';
  }

  // If a user has not verified their account, there is no
  // submitButton. This is to keep JS from breaking
  if (submitButton) {
    submitButton.style.display = onLastPage ? '' : 'none';
  }

  if (nextButton) {
    nextButton.style.display = onLastPage ? 'none' : '';
  }
};

Formstack.Form.prototype.focus = function(arg, hasFocus) {
    // Don't run this in IE6 because of potential issues with Google Toolbar
    if (/MSIE 6/i.test(navigator.userAgent)) {
        return;
    }

    var argType = 'focus';

    // radio fields need to treat click as the focus
    if (arg.currentTarget.type === 'radio' || arg.currentTarget.type === 'checkbox') {
        argType = 'click';
    }

    var field = typeof arg == 'object' && 'target' in arg ? arg.target : arg;
    hasFocus = hasFocus === undefined ? arg.type == argType : hasFocus;

    // number fields with a slider use slidestart as the focus
    if (arg.type === 'slidestart' || arg.type === 'slidestop') {
      hasFocus = arg.type === 'slidestart';
    }

    var container = this.getFieldContainer(field);

    if (!container) {
        return;
    }

    if (hasFocus) {
        // when focusing a new field, all previous fields should be un-focused
        // this helps with radio and checkbox weirdness
        $('.fsFieldFocused').removeClass('fsFieldFocused');

        $(container).addClass('fsFieldFocused');
        this.showCallout(container, true);
    } else {
        $(container).removeClass('fsFieldFocused');
        this.showCallout(container, false);
    }
};

Formstack.Form.prototype.showCallout = function(field, show) {
  var container               = this.getFieldContainer(field);
  var potentialCalloutElement = container.querySelector('div.fsCallout');

  // if we're explicitly closing the callout, or the currently focused field does not have
  // a callout associated with it, we need to close the callout that was last active
  if (!show || !potentialCalloutElement) {
    this.closeCallout();
    return;
  }

  var newCalloutId = potentialCalloutElement.id.replace(/[^\d.]/g, '');

  // if we're activating a new callout, close the old one...
  // this helps with the radio and checkbox blur and focus issues
  if (this.lastActiveCalloutId && this.lastActiveCalloutId !== newCalloutId) {
    this.closeCallout();
  }

  var fieldPosition = $(field).position();
  var fieldHeight   = Formstack.Util.getHeight(field);

  $(potentialCalloutElement).css('top', (fieldPosition.top + fieldHeight) + 'px');
  $(potentialCalloutElement).css('left', (fieldPosition.left + 50) + 'px');
  $(potentialCalloutElement).css('marginTop', '25px');

  $(potentialCalloutElement).show('fast');
  this.lastActiveCalloutId = newCalloutId;

  // callouts need to be closeable by pressing the escape key
  $('#field' + newCalloutId).on('keyup.closeCallout', null, $.proxy(this.closeCalloutOnEscape, this));
};

Formstack.Form.prototype.closeCallout = function() {
  if (!this.lastActiveCalloutId) {
    return;
  }

  // attempt to find the callout parent and detach the keyup event... we can't do this
  // in closeCalloutOnEscape because it may never be triggered
  $('#field' + this.lastActiveCalloutId).off('keyup.closeCallout');
  $('#fsCallout' + this.lastActiveCalloutId).hide('fast');

  this.lastActiveCalloutId = null;
};

Formstack.Form.prototype.closeCalloutOnEscape = function(event) {
  var escapeCharacterCode = 27;

  if (event && event.which !== escapeCharacterCode) {
    return;
  }

  this.closeCallout();
};

Formstack.Form.prototype.fadeCallout = function(callout) {
    var show = $(callout).hasStyle('fsCalloutShowing');

    if (show) {
        $(callout).fadeIn();
    } else {
        $(callout).fadeOut();
    }
};

/**
 * Returns the field wrapper or section that needs to be
 * hidden or shown based on the outcome of a logic check.
 */
Formstack.Form.prototype.getLogicTarget = function(id) {

    var e = document.getElementById('fsCell' + id);
    if (e === null) {
        e = document.getElementById('fsSection' + id);
        // if this is the first section in a page, the page itself is the target.
        if ($(e).hasClass('fsFirstSection')) {
            return e.parentNode;
        }
    }
    return e;
};

Formstack.Form.prototype.hasHiddenParents = function(id) {
    if (!id) {
      return;
    }

    var child = $('#' + id);
    var inHiddenContainer = false;
    var parentContainers = child.parents();

    for (var i = 0; i < parentContainers.length; i++) {
        var currentParent = parentContainers[i];
        if ($(currentParent).is('.fsHidden')) {
            inHiddenContainer = true;
            break;
        }
    }
    return inHiddenContainer;
};

Formstack.Form.prototype.showFields = function(id) {

    var target = $(this.getLogicTarget(id));

    /**
     * If the target isn't a page and it doesn't have the fsHidden class
     * We don't need to do anything as the target is already showing.
     *
     * .fsPage elements don't appear to have the fsHidden class on page
     * load, they only get the class once hidden (client side), so we
     * must run the logic on it.
     */
    if (!target.is('.fsHidden, .fsHiddenPage') && !target.hasClass('fsPage')) {
        return;
    } else if (target.is('.fsHiddenByFieldSetting')) {
        return;
    }

    var is_section = target.hasClass('fsSection');
    var inputs = target.find('input,select,textarea');

    for (var i = 0; i < inputs.length; i++) {

        var input = inputs[i];

        // Treat Matrix fields as though they were just one field, not made of a TON of sub fields
        if ($(input).parent().is('.fsMatrixCol1') || $(input).parent().is('.fsMatrixCol2')) {
            var targetParent = target.parent();
            var dashIndex = input.id.indexOf('-');
            var matrixId = input.id.substring(0, dashIndex);
            var matrixFieldset = document.getElementById('matrix-' + matrixId + '-fieldset');
            var matrixInputs = $(matrixFieldset).find('input,select,textarea');
            i += matrixInputs.length - 1; // We -1 because the loop will add that extra one for us
            if ($(matrixFieldset).attr('disabled') === 'disabled') {
                $(matrixFieldset).disabled = '';
            }
            if (target.hasClass('fsHidden')) {
                target.removeClass('fsHidden');
                targetParent.removeClass('fsHidden');
            }
            if (target.hasClass('fsPage')) {
                target.children('.fsFirstSection').removeClass('fsHidden');
            }
            if (!this.hasHiddenParents(input.id)) {
                matrixFieldset.disabled = false;
            }
            continue;
        }

        if (input.disabled === true || $(target).is('.fsHidden, .fsHiddenPage')) {

            var input_id = this.getFieldId(input);
            if (is_section) {
                target.removeClass('fsHidden');
                var t = $(this.getLogicTarget(input_id));
                if (t.hasClass('fsHidden')) {
                    continue;
                }
            }

            // show it.
            target.removeClass('fsHidden');
            if (target.hasClass('fsPage')) {
                target.children('.fsFirstSection').removeClass('fsHidden');
            }

            target.parent().removeClass('fsHidden'); //TODO: why? Because everything goes to shit if you don't use it

            var inputFieldCell = $(input).closest('.fsFieldCell');
            if (!this.hasHiddenParents(input.id) && !(inputFieldCell.hasClass('fsReadOnly') && inputFieldCell.attr('fs-field-type') === 'creditcard')) {
                input.disabled = false;
            }
            this.updateCalculations(input_id);
            this.updateDateCalculations(input_id);
            this.checkLogic(input_id);
            this.checkFormat(input);
        }

    }

    var sigs = target.find('.fsSignature');
    for (i = 0; i < sigs.length; i++) {
        /*$(sigs[i]).jSignature('reset');*/
        $(sigs[i]).empty();
        $(sigs[i]).jSignature();
    }

    if (inputs.length <= 0) {
        target.removeClass('fsHidden');
        if (target.hasClass('fsPage')) {
            target.children('.fsFirstSection').removeClass('fsHidden');
        }

        target.parent().removeClass('fsHidden'); //TODO: why? Because everything goes to shit if you don't use it
    }

    if (this.logicFields.indexOf(id) != -1) {
        this.checkLogic(id);
    }
};

Formstack.Form.prototype.hideFields = function(id) {

    var target = $(this.getLogicTarget(id));

    var disabled_inputs = target.find('input:disabled,select:disabled,textarea:disabled');
    var inputs = target.find('input,select,textarea');

    /*
     *  Verifies the parent object (target) is hidden
     *  and that it has no disable-able DOM elements that are enabled
     *
     *  TODO: Figure out why this mis-match even happens
    */
    if (target.is('.fsHidden, .fsHiddenPage') && ((disabled_inputs.length == inputs.length) && inputs.length > 0)) {
        return;
    }

    // disable and make the fields not required.
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var hiddenByCheckbox = $(input).parent().is('.fsHiddenByFieldSetting');

        if (!hiddenByCheckbox && $(input).parent().is('.fsSubField')) {
          hiddenByCheckbox = $(input).parents('.fsSubFieldGroup').is('.fsHiddenByFieldSetting');
        } else if (!hiddenByCheckbox && $(input).parent().is('.fsOptionLabel')) {
          hiddenByCheckbox = $(input).parent().parent().is('.fsHiddenByFieldSetting');
        }

        // Skip if field is already hidden by logic or field setting
        if (($(input).parent().is('.fsHidden') && input.disabled === true) || hiddenByCheckbox) {
            continue;
        }

        // Treat Matrix fields as one field vs many fields
        if ($(input).parent().is('.fsMatrixCol1') || $(input).parent().is('.fsMatrixCol2')) {
            var dashIndex = input.id.indexOf('-');
            var matrixId = input.id.substring(0, dashIndex);
            var matrixFieldset = document.getElementById('matrix-' + matrixId + '-fieldset');
            var matrixInputs = $(matrixFieldset).find('input,select,textarea');
            i += matrixInputs.length - 1; // We -1 because the for loop will iterate for us
            if (!$(matrixFieldset).attr('disabled') || $(matrixFieldset) != 'disabled') {
                $(matrixFieldset).attr('disabled', 'disabled');
            }
            if (!target.hasClass('fsHidden')) {
               target.addClass('fsHidden');
            }
            continue;
        }

        // Disable the field if it's not hidden by the field setting
        if (input.disabled === false) {
            input.disabled = true;
            this.updateCalculations(this.getFieldId(input));
            this.updateDateCalculations(this.getFieldId(input));
            this.checkLogic(this.getFieldId(input));
        }

        if (!target.hasClass('fsHidden')) {
            target.addClass('fsHidden');
            // if minLength and property is hidden don't show validation error
            target.find('.fsFormatMinLength').each(function(index, element) {
              this.highlightField(element, false);
            }.bind(this));
        }

    }

    if (inputs.length <= 0 && !target.hasClass('fsHidden')) {
        target.addClass('fsHidden');
    }

    // only proceed if the target is a cell
    if (target.hasClass('fsCell')) {
        var targetSiblings = target.siblings('.fsCell');
        var hiddenSiblings = target.siblings('.fsCell.fsHidden');

        // if all of the cells in the row are hidden, hide the row
        if (targetSiblings && hiddenSiblings && hiddenSiblings.length === targetSiblings.length) {
            var targetParent = target.parent();

            if (targetParent) {
                targetParent.addClass('fsHidden');
            }
        }
    }

    if (this.logicFields.indexOf(id) != -1) {
        this.checkLogic(id);
    }
};


Formstack.Form.prototype.getCalculation = function(id) {
    for (var i = 0; i < this.calculations.length; i++) {
        var calc = this.calculations[i];
        if (calc.fields.indexOf(id) >= 0) {
            return calc;
        }
    }

    return null;
};

Formstack.Form.prototype.getCalculationByTarget = function(target) {
    for (var i = 0; i < this.calculations.length; i++) {
        var calc = this.calculations[i];
        if (calc.target == target) {
            return calc;
        }
    }

    return null;
};

Formstack.Form.prototype.updateCalculations = function(arg) {

    //Changing this.getFieldId(arg) to just arg as it appears any non-object arg IS the id.
    var id = typeof arg == 'object' && 'target' in arg ? this.getFieldId(arg.target) : arg.toString();

    for (var i = 0; i < this.calculations.length; i++) {
        var calc = this.calculations[i];

        // correct for additional calculations
        var calcMatches = [];

        for (var j = 0, length = calc.fields.length; j < length; j++) {
            var adjustedID = calc.fields[j].match(/(\d+)/);

            if (adjustedID) {
                calcMatches.push(adjustedID[0]);
            } else {
                calcMatches.push(calc.fields[j]);
            }
        }

        if (calcMatches.indexOf(id) >= 0) {
            this.evalCalculation(calc);
        }
    }
    if (this.plugins.discountCode) {
        if (id == this.plugins.discountCode.total_field) {
            if (!this.plugins.discountCode.discountClick) {
                this.plugins.discountCode._clearDiscount('re-calculation of total field');
            } else {
                this.plugins.discountCode.discountClick = false;
            }
        }
    }
};

Formstack.Form.prototype.updateDateCalculations = function(field) {
  var id = typeof field == 'object' && 'target' in field ? this.getFieldId(field.target) : field.toString();

  for (var i = 0, length = this.dateCalculations.length; i < length; i++) {
    var dateCalculation = this.dateCalculations[i];

    for (var j = 0, dateCalculationLength = dateCalculation.fields.length; j < dateCalculationLength; j++) {
      var adjustedID = dateCalculation.fields[j] !== 'current_date' && dateCalculation.fields[j].match(/(\d+)/);
      var calculationFieldId = adjustedID ? adjustedID[0] : dateCalculation.fields[j];

      if (calculationFieldId === id) {
        this.evalDateCalculation(dateCalculation);
        break;
      }
    }
  }
};

Formstack.Form.prototype.evalCalculation = function(calc) {
    var equation       = calc.equation,
        unit           = '',
        largestDecimal = 0,
        length,
        i,
        decimals,
        field;

    // parse the equation for values not associated with fields
    // (numbers in the equation), and find their decimal values
    // do this before we sub the values from fields on the form
    var splitEquation = equation.split(' ');

    for (i = 0, length = splitEquation.length; i < length; i++) {
        // if the value is a number (not a field value or an operator)
        // find the number of decimals involved
        var currentValue = splitEquation[i];

        // fields will be surrounded by []
        // and operators won't be a number
        if (!isFinite(currentValue)) {
            continue;
        }

        decimals = this.getDecimals(currentValue);
        largestDecimal = (largestDecimal < decimals) ? decimals : largestDecimal;
    }

    for (i = 0, length = calc.fields.length; i < length; i++) {
        var id = calc.fields[i];

        // correct for additional calculations
        var additionalCalc = id.match('-([a-z]+)?');
        if (additionalCalc) {
            id = id.substring(0, id.length - additionalCalc[0].length);
            additionalCalc = additionalCalc[1];
        }

        var regex    = new RegExp('\\[' + calc.fields[i] + '\\]', 'g'),
            val      = 0;

        decimals = NaN;

        var fields  = this.getFields(id),
            fLength = fields.length;

        for (var j = 0; j < fLength; j++) {
            field = fields[j];
            var properties = this.getNumberProperties(field),
                calcInfo   = this.getCalcInfo(this.getFieldId(field), additionalCalc);

            //let's make sure this field is correctly rounded before calc
            //TODO uncomment this and build tests to ensure no bad calcs/loops exist
            //this.checkFormat(field);

            val = calcInfo.sum;

            if (!isFinite(val)) {
                val = 0;
            }

            // if the field isn't a number field,
            // interpret decimals from the value
            decimals = (field.type === 'number') ?
                       properties.decimals :
                       calcInfo.decimals;

            if (val && val.toString().indexOf('$') != -1) {
                unit = '$';
            }
        }

        // enforce the decimal rounding for the given field
        decimals = isNaN(decimals) ? 0 : decimals;
        equation = equation.replace(regex, val.toFixed(decimals));

        // update with the largest decimal used
        largestDecimal = (largestDecimal < decimals) ? decimals : largestDecimal;
    }

    field = document.getElementById('field' + calc.target);

    // Make sure the field is still valid
    if (field === null) {
        return;
    }

    // get the decimal rounding property for the field being calculated
    var targetProperties = this.getNumberProperties(field),
        targetDecimals   = targetProperties.decimals,
        result           = 0;

    // since we can't specify decimals on a short answer field,
    // use the decimals from the largest decimal source field
    if (field.type !== 'number') {
        targetDecimals = largestDecimal;
    }

    targetDecimals = isNaN(targetDecimals) ? 0 : targetDecimals;
    equation = '(' + equation + ').toFixed(' + targetDecimals + ')';

    try {
        result = eval(equation);
    } catch(e) {}

    if (!isFinite(result)) {
        result = 0;
    }

    field = document.getElementById('field' + calc.target);

    // Make sure the field is still valid
    if (field === null) {
        return;
    }

    var old_value = field.value;

    if ($(field).hasClass('fsFormatNumber')) {
        field.value = result;
        this.checkFormat(field);
    } else {
        field.value = unit + result;
    }

    jQuery(field).trigger('calceval');

    //only check logic and run calc if the value changes
    if (field.value != old_value) {
        this.checkLogic(calc.target);
        this.updateCalculations(calc.target);
        this.updateDateCalculations(calc.target);
    }
};

Formstack.Form.prototype.workflowFieldIsAccessible = function(field, fieldId) {
  if (!this.isWorkflowForm) {
    return false;
  }

  // this is to differentiate between hidden on purpose and hidden by logic check
  if ((this.getFieldContainer(field).className.indexOf('fsHidden') > -1 ||
    $(field).closest('.fsFieldRow').hasClass('fsHidden')) &&
      !$(field).parent().is('.fsHiddenByFieldSetting')) {
    return false;
  }

  return this.getWorkflowStepAccess(fieldId.replace('field', '')) === 'read';
}

Formstack.Form.prototype.getDateFieldTimestamp = function(fieldId) {
  var selectedYearField = document.getElementById(fieldId + 'Y'),
    selectedMonthField = document.getElementById(fieldId + 'M'),
    selectedDayField = document.getElementById(fieldId + 'D');

  // re-updating so the fixes still work but doesn't break other calculations/validations
  if (!selectedYearField || !selectedMonthField ||
      (selectedYearField.disabled && !this.workflowFieldIsAccessible(selectedYearField, fieldId))) {
    return;
  }

  var selectedYearValue = selectedYearField.options[selectedYearField.selectedIndex].value,
    selectedMonthValue = selectedMonthField.selectedIndex,
    selectedDayValue = selectedDayField ? selectedDayField.selectedIndex : 1;

  if (!selectedYearValue || !selectedMonthValue || (selectedDayField && !selectedDayValue)) {
    return;
  } else {
    return new Date(selectedYearValue, selectedMonthValue - 1, selectedDayValue);
  }
}

Formstack.Form.prototype.initDateFieldTimestamp = function(fieldId) {
  var date;

  if (fieldId === 'current_date') {
    date = Formstack.Util.getStartOfCurrentDate();
  } else {
    date = this.getDateFieldTimestamp('field' + fieldId);
  }

  return date;
}

Formstack.Form.prototype.evalDateCalculation = function(calc) {
  if (!calc) {
    return;
  }

  var field = document.getElementById('field' + calc.target),
    isDateFieldTargeted = false;
  // default field selector is not valid for a datetime field,
  // we have to check datetime specific selector too if previous will fail
  if (!field) {
    field = document.getElementById('fsCalendar' + calc.target + 'Link');
    isDateFieldTargeted = !!field;
  }

  var fieldOneValue = this.initDateFieldTimestamp(calc.fields[0]),
    fieldTwoValue,
    result = '';

  if (!field) {
    field = document.getElementById('fsCalendar' + calc.target + 'Link');
    isDateFieldTargeted = !!field;
  }

  if (fieldOneValue) {
    if (calc.type === 'number') {
      var numberInput = this.getFields(calc.fields[1])[0];

      if (numberInput && numberInput.value && !numberInput.disabled) {
        fieldTwoValue = this.getNumber(numberInput.value);

        if (typeof fieldTwoValue === 'number') {
          result = this.computeDateDiff(fieldOneValue, fieldTwoValue, calc, isDateFieldTargeted);
        }
      }
    } else {
      fieldTwoValue = this.initDateFieldTimestamp(calc.fields[1]);

      if (fieldTwoValue) {
        result = this.computeDateDuration(fieldOneValue, fieldTwoValue, calc.units, calc.allowNegatives);
      }
    }
  }

  // Make sure the field is still valid
  if (field === null) {
    return;
  }

  var old_value = field.value;

  if (isDateFieldTargeted) {
    this.updateDateFieldValue(calc.target, result);
  } else {
    field.value = result;
  }

  jQuery(field).trigger('calceval');

  //only check logic and run calc if the value changes
  if (field.value !== old_value) {
      this.checkLogic(calc.target);
      this.updateCalculations(calc.target);
      this.updateDateCalculations(calc.target);
  }
};

/**
 * Updates date dropdowns selection
 *
 * @param {string}    fieldId
 * @param {timestamp} timestamp
 *
 */
Formstack.Form.prototype.updateDateFieldValue = function(fieldId, timestamp) {
  if (timestamp instanceof Date === false || isNaN(timestamp.valueOf())) {
    // when values are invalid, we have to clear dropdowns
    var suffixes = ['Y', 'M', 'D'];

    for (var i = 0; i < 3; i++) {
      var element = document.getElementById('field' + fieldId + suffixes[i]);

      if (element) {
        element.selectedIndex = 0;
      }
    }

    return;
  }

  var calendarInputId = 'fsCalendar' + fieldId + 'Link';

  this.calendarSelect(this.getCalendarFormat(fieldId)
    .replace('yy', timestamp.getFullYear())
    .replace('mm', timestamp.getMonth() + 1)
    .replace('dd', timestamp.getDate()), { id: calendarInputId, input: document.getElementById(calendarInputId) });
}

/**
 * Used in date calculations to handle: Timestamp - Integer = Timestamp
 *
 * @param {timestamp} fieldOneValue
 * @param {integer}   fieldTwoValue
 * @param {object}    calc                calculation object
 * @param {boolean}   isDateFieldTargeted when we're dealing with a date field we expect a timestamp as a result
 *
 * @returns {integer}
 */
Formstack.Form.prototype.computeDateDiff = function(fieldOneValue, fieldTwoValue, calc, isDateFieldTargeted) {
  if (!fieldOneValue || typeof fieldTwoValue !== 'number') {
    return;
  }

  var equation = calc.equation === 'plus' ? '+' : '-',
    timestamp,
    result;

  if ((((fieldTwoValue > 0) - (fieldTwoValue < 0)) || +fieldTwoValue) === -1) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
    fieldTwoValue = Math.abs(fieldTwoValue);
    equation = equation === '+' ? '-' : '+';
  }

  timestamp = this.adjustTimestamp(fieldOneValue, calc.units, parseFloat(equation + fieldTwoValue));

  if (isDateFieldTargeted) {
    return timestamp;
  }

  // Use field one format or a default MM-DD-YYYY for current_date
  if (calc.fields[0] === 'current_date') {
    result = (timestamp.getMonth() + 1)  + '-' + timestamp.getDate()  + '-' +  timestamp.getFullYear();
  } else {
    var dateFieldId = calc.fields[0];

    result = this.formatDateLikeField(timestamp, dateFieldId);
  }

  return result;
}

/**
 * Used in date calculations to update a month in a date.
 *
 * @param {timestamp} date
 * @param {integer}   months number of months
 *
 */
Formstack.Form.prototype.updateMonths = function(date, months) {
  var desiredMonth = date.getMonth() + months;
  var desiredMonthWithMaxDayNumber = new Date(date.getFullYear(), desiredMonth + 1, 0);
  desiredMonthWithMaxDayNumber.setHours(0, 0, 0, 0);

  var maxDaysInMonth = desiredMonthWithMaxDayNumber.getDate();

  date.setMonth(desiredMonth, Math.min(maxDaysInMonth, date.getDate()));
}

/**
 * Used in date calculations to handle: Timestamp + Number = Timestamp
 *
 * @param {timestamp} date
 * @param {string} unit years/months/days
 * @param {integer} unitValue
 *
 * @returns {timestamp}
 */
Formstack.Form.prototype.adjustTimestamp = function(date, unit, unitValue) {
  unit = unit.toLowerCase();

  if (unit === 'years') {
    this.updateMonths(date, unitValue *  12);
  } else if (unit == 'months') {
    this.updateMonths(date, unitValue);
  } else {
    date.setDate(date.getDate() + unitValue);
  }

  return date;
}

/**
 * Used in date calculations to handle: Timestamp - Timestamp = Integer
 *
 * @param {timestamp} startDate
 * @param {timestamp} endDate
 * @param {string} unit years/months/days
 * @param {boolean} allowNegatives true to allow negative result when endDate < startDate, false for positive result (absolute value)
 *
 * @returns {integer}
 */
Formstack.Form.prototype.computeDateDuration = function(startDate, endDate, unit, allowNegatives) {
  unit = unit.toLowerCase();

  var negate = false;

  // Make sure start date comes before end date (or else we'll swap them)
  if (startDate > endDate) {
    var temp = startDate;
    startDate = endDate;
    endDate = temp;
    negate = allowNegatives;
  }

  var duration;
  switch (unit) {
    case 'years':
      duration = this.durationInYears(startDate, endDate);
      break;

    case 'months':
      duration = this.durationInMonths(startDate, endDate);
      break;

    default:
      duration = this.durationInDays(startDate, endDate);
      break;
  }

  // If end date < start date, output negative duration, if allowNegatives was requested
  if (negate) {
      duration *= -1;
  }

  return duration;
};

/**
 * Used in date calculations to handle: Timestamp - Timestamp = Difference in years
 *
 * @param {timestamp} startDate
 * @param {timestamp} endDate
 *
 * @returns {integer} difference in years between two dates
 */
Formstack.Form.prototype.durationInYears = function(startDate, endDate) {
  var yearDifference = endDate.getFullYear() - startDate.getFullYear();
  var monthDifference = endDate.getMonth() - startDate.getMonth();
  var dayDifference = endDate.getDate() - startDate.getDate();
  var result = Math.abs(yearDifference);

  if (yearDifference > 0 && (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0))) {
    result--;
  }

  return result;
}

/**
 * Used in date calculations to handle: Timestamp - Timestamp = Difference in months
 *
 * @param {timestamp} startDate
 * @param {timestamp} endDate
 *
 * @returns {integer} difference in months between two dates
 */
Formstack.Form.prototype.durationInMonths = function(startDate, endDate) {
  var result = Math.abs(startDate.getMonth() - endDate.getMonth() + (12 * (startDate.getFullYear() - endDate.getFullYear())));

  if (endDate.getDate() - startDate.getDate() < 0) {
    result--;
  }

  return result;
}

/**
 * Used in date calculations to handle: Timestamp - Timestamp = Difference in days
 *
 * @param {timestamp} startDate
 * @param {timestamp} endDate
 *
 * @returns {integer} difference in days between two dates
 */
Formstack.Form.prototype.durationInDays = function(startDate, endDate) {
  var millisecondsPerDay = 1000 * 60 * 60 * 24;

  // Duration may be off by one if the date range crosses a daylight saving shift.
  // Normalize the dates by adding the timezone offset difference (in minutes) to the end date.
  var timezoneOffsetDiff = startDate.getTimezoneOffset() - endDate.getTimezoneOffset();

  if (timezoneOffsetDiff !== 0) {
    endDate = new Date(endDate.getTime() + timezoneOffsetDiff * 60 * 1000);
  }

  return Math.floor(Math.abs((startDate - endDate) / millisecondsPerDay));
}

/**
 * Used in date calculations to construct a formatted date string for display.
 * Gets the date format and month names from a date field.
 *
 * @param {date} date The date we'd like to format
 * @param {string} dateFieldId ID of the date field to pull format info from
 *
 * @returns {string} Formatted date string
 */
Formstack.Form.prototype.formatDateLikeField = function(date, dateFieldId) {
  var _this = this;
  var dateFormatSymbols = [
    'YY',
    'Y',
    'y',
    'F',
    'M',
    'm',
    'd',
  ];

  // Match the date format of the field
  var dateFormat = this.getDateFieldFormat(dateFieldId);

  // Split the format string into tokens based on available symbols
  var dateFormatSymbolRegex = new RegExp('(' + dateFormatSymbols.join('|') + ')');
  var formatTokens = dateFormat.split(dateFormatSymbolRegex);

  // Replace any symbol tokens with the appropriate date-related value, then merge tokens
  var result = formatTokens
    .map(function(token) {
      switch(token) {
        // Full year
        case 'YY':
        case 'Y':
          return date.getFullYear();

        // Year, last two digits
        case 'y':
          return date.getFullYear().toString().slice(-2);

        // Month name (full or short)
        case 'F':
        case 'M':
          return _this.getDateFieldMonthName(dateFieldId, date.getMonth() + 1);

        // Month number, 2-digits with leading zeros
        case 'm':
          return ('00' + (date.getMonth() + 1)).slice(-2);

        // Day of the month, 2-digits with leading zeros
        case 'd':
          return ('00' + date.getDate()).slice(-2);
      }

      return token;
    })
    .join('');

  return result;
};

/**
 * Used in date calculations to get the format for a date field.
 * This uses the 'data-date-format' attribute on the hidden input element.
 *
 * @param {string} dateFieldId ID of the date field to get format for
 *
 * @returns {string} Date format of the field
 */
Formstack.Form.prototype.getDateFieldFormat = function(dateFieldId) {
    var field = jQuery('#field' + dateFieldId + 'Format');

    return field.data('dateFormat');
  };

/**
 * Used in date calculations to get a month name from a date field, given a month number.
 *
 * @param {string} dateFieldId ID of the date field to get month name from
 * @param {number} monthNumber Number of the month to get the name of
 *
 * @returns {string} Name of the month
 */
Formstack.Form.prototype.getDateFieldMonthName = function(dateFieldId, monthNumber) {
  var field = jQuery('#field' + dateFieldId + 'M');
  var monthOption = field.children().eq(monthNumber);

  return monthOption.text();
};

Formstack.Form.prototype.updateProgress = function(currentPage) {
    // If there's no progress meter, do nothing
    var progressMeter = document.getElementById('fsProgress' + this.id);
    if (!progressMeter) {
        return;
    }

    var pageCount = $('div.fsPage').length;

    // Get rid of progress, if you don't need it
    if (pageCount <= 1) {
        progressMeter.style.display = 'none';
        return;
    }

    var progressBarContainer = document.getElementById('fsProgressBarContainer' + this.id);
    var progressBar = document.getElementById('fsProgressBar' + this.id);
    var totalWidth = 100;
    var ratio = currentPage / pageCount;

    if (ratio < 0) {
        ratio = 0;
    }

    if (ratio > 1) {
        ratio = 1;
    }

    var barWidth = (totalWidth * ratio) + '%';

    $(progressBarContainer).attr('aria-valuenow', Math.floor(totalWidth * ratio));
    var pageProgressFormat = 'Page ' + currentPage + ' of ' + pageCount;
    $(progressBarContainer).attr('aria-valuetext', pageProgressFormat);
    $(progressBar).css('width', barWidth);
};

Formstack.Form.prototype.pageIsVisible = function(page) {

    page = $('#fsPage' + this.id + '-' + page);

    if (page.hasClass('fsHidden')) {
      return false;
    }

    var sections = page.find('div.fsSection');
    for (var i = 0; i < sections.length; i++) {
        var section = $(sections[i]);
        if (section.hasClass('fsHidden')) continue;

        var cells = section.find('div.fsCell');
        for (var j = 0; j < cells.length; j++) {

            if (!$(cells[j]).hasClass('fsHidden')) {
                return true;
            }
        }
    }

    return false;
};


Formstack.Form.prototype.calendarShow = function(input, calendar) {

    // Get the field ID
    var id = input.id.match(/(\d+)/);id = id[1];

    // Get the current date to use as the default
    var cur = new Date();

    // Get the selected month
    var monthSelect = document.getElementById('field' + id + 'M');
    var month = monthSelect && monthSelect.selectedIndex ? monthSelect.selectedIndex : cur.getMonth() + 1;

    // Get the selected day
    var daySelect = document.getElementById('field' + id + 'D');
    var day = daySelect && daySelect.selectedIndex ? daySelect.selectedIndex : cur.getDate();

    // Get the selected year
    var yearSelect = document.getElementById('field' + id + 'Y');
    var year = cur.getFullYear();
    if (yearSelect && yearSelect.selectedIndex) {
        year = parseInt(yearSelect.options[yearSelect.selectedIndex].value, 10);
        if (year < 100) year += 2000;
    }

    // Select the date on the calendar
    var dateFormat = $(input).datepicker('option', 'dateFormat');
    dateFormat = dateFormat.replace('mm', month);
    dateFormat = dateFormat.replace('dd', day);
    dateFormat = dateFormat.replace('yy', year);

    $(input).datepicker("setDate", dateFormat);
};


Formstack.Form.prototype.calendarSelect = function(dateText, calendar) {

    // Get the field ID
    var id = calendar.id.match(/(\d+)/);id = id[1];

    var dateFormat = $(calendar.input).datepicker('option', 'dateFormat');

    var dates = dateText.split('/');
    var year = dates[2], month = dates[0], day = dates[1];

    if (dateFormat == 'dd/mm/yy') {
        year = dates[2];
        month = dates[1];
        day = dates[0];
    } else if (dateFormat == 'yy/mm/dd') {
        year = dates[0];
        month = dates[1];
        day = dates[2];
    } else if (dateFormat == 'mm/yy/dd') {
        year = dates[1];
        month = dates[0];
        day = 1;
    }

    // Update the month
    var monthSelect = document.getElementById('field' + id + 'M');
    if (monthSelect)
        monthSelect.selectedIndex = month;

    // Update the day
    var daySelect = document.getElementById('field' + id + 'D');
    if (daySelect)
        daySelect.selectedIndex = day;

    // Update the year
    var yearSelect = document.getElementById('field' + id + 'Y');
    if (yearSelect) {
        for (var y = 1; y < yearSelect.options.length; y++) {

            // Get a 4-digit year
            var value = parseInt(yearSelect.options[y].value, 10);
            if (value < 100) value += 2000;

            if (value == year) {
                yearSelect.selectedIndex = y;
                break;
            }
        }
    }

    $(yearSelect).trigger('change');
};

/**
 * Update the max length character counter, and make
 * sure it doesn't overflow its bounds.
 *
 * @param int id        The id of the field being checked
 * @param int maxLength The maxlength of the field being checked
 */
Formstack.Form.prototype.textareaCharLimiter = function(id, maxLength) {
  var textarea = jQuery('#field' + id),
      counter  = jQuery('#fsCounter' + id),
      text     = textarea.val();

  // the HTML spec for the maxlength attribute specifies
  // that newlines should be \r\n, and thus take two characters
  // https://html.spec.whatwg.org/multipage/forms.html#attr-textarea-wrap
  // so we need to adjust the counter to count for that
  var newLineMatch = text.match(/(\r\n|\n|\r)/g),
      numNewLines  = newLineMatch ? newLineMatch.length : 0,
      length       = text.length + numNewLines;

  // Update the counter
  counter.text(maxLength - length + '/' + maxLength);

  // make sure the input doesn't go over it's maxlength attribute
  // (here's looking at you, Firefox)
  if (length > maxLength) {
    textarea.val(text.substr(0, maxLength - numNewLines));
  }
};

/**
 * Returns an array of input fields that are a part of a formstack field.
 * @param id formstack field id
 */
Formstack.Form.prototype.getFields = function(id, fromSetValue) {
    if (typeof id !== 'string') {
        id = String(id);
    }

    if (typeof fromSetValue === 'undefined') {
        fromSetValue = false;
    }

    id = id.replace('field', '');
    id = id.replace('[]', '');

    var fields = document.getElementsByName('field' + id);
    var checkboxFields = document.getElementsByName('field' + id + '[]');
    var monthField = document.getElementById('field' + id + 'M');
    var hourField = document.getElementById('field' + id + 'H');

    if (fields.length <= 0) {
        if (checkboxFields.length > 0) {
            fields = checkboxFields;
        } else if (fromSetValue && (monthField || hourField)) {
            fields = $('#fsCell' + id).find('select.fsField');
        } else {
            fields = $('.field' + id + 'Subfield');
        }
    }

    if (fields.length > 0 && document.getElementById('field' + id + '_othervalue') !== null) {
        var other = document.getElementById('field' + id + '_othervalue');
        if (this.forLogic) {
            fields[fields.length-1].value = 'Other';
        } else {
            fields[fields.length-1].value = other.value;
        }
    }

    return fields.length > 0 ? fields : document.getElementsByName('field' + id + '[]');
};

/**
 * Returns the Formstack field id from a given input. This function is essentially
 * an inverse of Formstack.Form.prototype.getFields.
 */
Formstack.Form.prototype.getFieldId = function(input) {
    // explicitly converts input to a String if the input value is a number (was not implicitly converting when trying to use the name)
    input = typeof input !== 'object' ? input.toString() : input;

    var id = typeof input === 'string' ? input : input.name.replace('field', '');

    if (id === null) {
        return '';
    }

    id = id.match(/[0-9]+/);
    return id === null ? '' : id[0];
};


Formstack.Form.prototype.saveIncomplete = function(email) {
  var needsPassword  = document.getElementById('fsSaveResumePassword' + this.id),
      dialogSettings = {},
      message        = '';

  // the dialog title and confirm button are common,
  // so they always need to be assigned
  var saveAndResume     = document.getElementById('saveAndResume'),
      saveResumeProcess = document.getElementById('saveResumeProcess');

  var dialogTitle = (saveAndResume && saveAndResume.innerHTML)
      ? saveAndResume.innerHTML
      : 'Save and Resume Later';

  var confirmTitle = (saveResumeProcess && saveResumeProcess.innerHTML)
      ? saveResumeProcess.innerHTML
      : 'Save and get link';

  dialogSettings.title   = dialogTitle;
  dialogSettings.confirm = confirmTitle;

  // only the message will change if the form is encrypted
  if (needsPassword) {
    var resumeConfirmPassword = document.getElementById('resumeConfirmPassword');

    message = (resumeConfirmPassword && resumeConfirmPassword.innerHTML)
      ? resumeConfirmPassword.innerHTML
      : 'Are you sure you want to leave this form and resume later? If so, please enter a password below to securely save your form.';

    dialogSettings.goodies = ['password'];
  } else {
    var resumeConfirm = document.getElementById('resumeConfirm');

    message = (resumeConfirm && resumeConfirm.innerHTML)
      ? resumeConfirm.innerHTML
      : 'Are you sure you want to leave this form and resume later?';
  }

  dialogSettings.message = message;

  this.launchDialog(dialogSettings, this.processSaveIncomplete, false);

  return;
};

Formstack.Form.prototype.addNonce = function() {
    var currentForm = document.getElementById('fsForm' + this.id);
    var nonce       = '';
    var possible    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var length      = 16;

    for(var i = 0; i < length; i++) {
        nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    var nonceInput   = document.createElement('input');
    nonceInput.type  = 'hidden';
    nonceInput.name  = 'nonce';
    nonceInput.id    = 'nonce' + this.id;
    nonceInput.value = nonce;

    currentForm.appendChild(nonceInput);
};

/**
 * Handle processing of save and resume, whether encrypted or not.
 *
 * @param object values Any values that we needed returned from the dialog.
 */
Formstack.Form.prototype.processSaveIncomplete = function(values) {
  // if we need a password, let's make sure it was supplied
  var needsPassword = document.getElementById('fsSaveResumePassword' + this.id),
      currentForm   = document.getElementById('fsForm' + this.id);

  if (needsPassword) {
    if (values && !values.password) {
      return;
    }

    var incompletePasswordInput = document.getElementById('incomplete_password' + this.id);

    // if there is no input for the incomplete password (which means we've entered
    // from an old advanced html embed), we need to create one so it submits
    if (!incompletePasswordInput) {
      incompletePasswordInput = document.createElement('input');

      incompletePasswordInput.type = 'hidden';
      incompletePasswordInput.name = 'incomplete_password';
      incompletePasswordInput.id   = 'incomplete_password' + this.id;

      currentForm.appendChild(incompletePasswordInput);
    }

    incompletePasswordInput.value = values.password;
  }

  // reset all 'other' option values back to 'Other' for save and resume
  var fields = document.getElementsByTagName('fieldset');

  if (fields && fields.length > 0) {
    for (var i = 0, length = fields.length; i < length; i++) {
      var fieldID = fields[i].id.match(/[0-9]+/);

      if (!fieldID) {
        continue;
      }

      fieldID = fieldID[0];

      if (document.getElementById('field' + fieldID + '_othervalue')) {
        var other = document.getElementById('field' + fieldID  + '_other');

        if (other) {
          other.value = 'Other';
        }
      }
    }
  }

  document.getElementById('incomplete' + this.id).value = 'true';

  // Using raw DOM-manip because jQuery submit triggers validation when it
  // shouldn't
  currentForm.submit();

  return false;
};

Formstack.Form.prototype.getParameterByName = function(name, url) {
    name = name.replace(/[\[\]]/g, "\\$&");

    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);

    if (!results) {
        return null;
    };

    if (!results[2]) {
        return '';
    }

    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

Formstack.Form.prototype.checkFreeLink = function() {
    // Check if the form has a class name indicating it's a free form
    var form = document.getElementById('fsForm' + this.id);
    if (!$(form).hasClass('fsFormFree')) {
        return true;
    }

    var doc;

    // Get the embed type and the appropriate document object
    var type = document.getElementById('referrer_type' + this.id);
    switch (type.value) {
        case 'iframe':
            doc = window.parent.document;
            break;
        case 'js':
            doc = window.document;
            break;
        default:
            return true;
    }

    var found = false;

    // Make sure there is at least one link on the page to formstack.com or formspring.com
    // formspring.com is kept here for backwards compatability.
    var links = doc.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
        if ((links[i].href.indexOf('http://www.formspring.com/') === 0) ||
           (links[i].href.indexOf('http://www.formstack.com/') === 0)) {
            found = true;
            break;
        }
    }

    if (found) {
        return true;
    }

    var embedError = document.getElementById('embedError');
    var message = (embedError) ? embedError.innerHTML : 'There was an error displaying the form. Please copy and paste the embed code again.';
    this.showError(message);

    form.style.display = 'none';

    return false;
};

Formstack.Form.prototype.checkMatrixOnePerColumn = function(id) {
    // Split the ID into parts
    var ids = id.split('-');

    var fieldID = ids[0];
    var rowID   = ids[1];
    var colID   = ids[2];

    // Get all input fields in the matrix
    $('#matrix-' + fieldID + ' input').each($.proxy(function(index, input) {
        var re = new RegExp('^' + fieldID + '-\\d+-' + colID + '$');

        // Uncheck if it's a different field in the same column
        if (input.id != id && re.test(input.id)) {
            input.checked = false;
        }
    }, this));
};

Formstack.Form.prototype.onChange = function() {
};

/**
 * Returns the numeric value and the largest decimal value that
 * should be used in the calculation for a Formstack field.
 *
 * @return {sum, decimals} Calculation value and the max number of decimals used.
 */
Formstack.Form.prototype.getCalcInfo = function(id, calcType) {
    var fields   = this.getFields(id),
        sum      = 0,
        decimals = 0;

    for (var i = 0, length = fields.length; i < length; i++) {
        var input        = fields[i],
            tempVal      = 0,
            tempDecimals = 0;

        // skip over a disabled input
        if (input.disabled && (!this.isWorkflowForm || this.belongsToHiddenWorkflowSection(input))) {
            continue;
        }

        if ($(input).attr('data-type') === 'product-quantity') {
            var quantity         = $(input),
                tempPrice        = quantity.attr('data-product-price'),
                tempQuantity     = quantity.val(),
                price            = this.getNumber(tempPrice),
                adjustedQuantity = this.getNumber(tempQuantity);

            // default decimals to the price
            tempDecimals = this.getDecimals(tempPrice);

            // separate calculations for product field price and quantity,
            // while maintaining default behavior
            if (calcType === 'price' && !isNaN(price) && price > 0) {
                sum += price;
            } else if (calcType === 'quantity') {
                sum += adjustedQuantity;

                // override decimals for quantity
                tempDecimals = this.getDecimals(tempQuantity);
            } else if (!isNaN(price) && price > 0) {
                sum += price * adjustedQuantity;
            }
        } else if (input.type === 'radio' || input.type === 'checkbox') {
            tempVal = input.checked ? input.value : 0;

            sum         += this.getNumber(tempVal);
            tempDecimals = this.getDecimals(tempVal);
        } else if (input.type === 'select-multiple') {
            for (var j = 0, optLength = input.options.length; j < optLength; j++) {
                var currentInput = input.options[j];

                if (currentInput.selected) {
                    tempVal = currentInput.value;

                    var nestedVal      = this.getNumber(tempVal);
                    var nestedDecimals = this.getDecimals(tempVal);

                    if (!isNaN(nestedVal)) {
                        sum += nestedVal;
                    }

                    tempDecimals = (tempDecimals < nestedDecimals) ? nestedDecimals : tempDecimals;
                }
            }
        } else if (input.type === 'select-one') {
            tempVal = input.options[input.selectedIndex].value;

            sum         += this.getNumber(tempVal);
            tempDecimals = this.getDecimals(tempVal);
        } else {
            tempVal = input.value;

            sum         += this.getNumber(tempVal);
            tempDecimals = this.getDecimals(tempVal);
        }

        // clear tempVal for the next run, just to be sure
        tempVal = 0;

        // set the max number of decimals according to each loop
        decimals = (decimals < tempDecimals) ? tempDecimals : decimals;
    }

    return {'sum': sum, 'decimals': decimals};
};

/**
 * Parses input values for number. Primarly used to extract numbers for
 * field calculations and conditional logic.
 */
Formstack.Form.prototype.getNumber = function(value) {
    if ($.trim(value) === '') {
        return 0;
    }

    var v = parseFloat(value);

    return isNaN(v) ? parseFloat(value.replace(/[^\d\.\-]/g, '')) : v;
};

/**
 * Finds the number of decimals for the given value.
 *
 * @param mixed (integer, string) value The value to find the decimal number from.
 *
 * @return integer The number of decimal places for the value.
 */
Formstack.Form.prototype.getDecimals = function(value) {
    // make sure the value is a string,
    // then split on the decimal point
    var stringVal    = value + '',
        splitAmount  = stringVal.split("."),
        decimalCount = NaN;

    // only set the decimals if there are exactly two split elements
    // which is (for the most part) indicative of US currency formatting
    if (splitAmount.length === 2) {
        decimalCount = splitAmount[1].length;
    }

    // the number of decimals should be bound to what .toFixed() will support
    // before it switches to scientific notation, which is 20
    if (decimalCount < 0) {
        decimalCount = 0;
    }

    if (decimalCount > 20) {
        decimalCount = 20;
    }

    return decimalCount;
};

Formstack.Form.prototype.emitSubmitMessage = function () {
    this.emitSubmitMessageToWindow(window.parent);
    this.emitSubmitMessageToWindow(window.opener);
};

Formstack.Form.prototype.emitSubmitMessageToWindow = function (targetWindow) {
    if (targetWindow && targetWindow.postMessage) {
        targetWindow.postMessage('fs-form-submit', '*');
    }
};

Formstack.Form.prototype.submit = function(event) {
  if (!this.checkForm()) {
    return false;
  }

  // if there is a captcha, make sure it has been filled in
  if (jQuery('#fsCaptcha' + this.id).length &&
    jQuery('#recaptcha_response_field').val() === '') {

    jQuery('#fsCaptcha' + this.id).addClass('fsValidationError');
    return false;
  }

  this.addNonce();

  // Get the submit button
  var submitButtons = $('input.fsSubmitButton');
  var submitButton  = submitButtons.length ? submitButtons[0] : null;

  // Check if we have external fields still validating
  if ($('.fsFieldValidating', '#fsForm' + this.id).length) {
    if (submitButton) {
      var validatingElem = document.getElementById('validatingText');

      submitButton.value = validatingElem && validatingElem.innerHTML
        ? validatingElem.innerHTML + '...'
        : 'Validating...';
    }

    // Turn on skip validation and try to submit again
    this.skipValidation = true;

    setTimeout($.proxy(function() {
      this.form.submit();
    }, this), 100);

    return false;
  }

  // if payment integrations have errored, don't submit
  if (!this.processIntegrations('payment')) {
    return false;
  }

  // Turn skip validation back off
  this.skipValidation = false;

  if (this.jsonp) {
    this.jsonpSubmit();
    return false;
  }

  this.form.trigger('form:submit');

  if (submitButton) {
    var submittingElem = document.getElementById('submittingText');

    submitButton.value = submittingElem && submittingElem.innerHTML
      ? submittingElem.innerHTML + '...'
      : 'Submitting...';
  }

  if (jQuery('.g-recaptcha').length) {
    grecaptcha.execute();
    return false;
  }

  this.emitSubmitMessage();
  return true;
};

/**
 * Run through all integrations of a certain type and start processing them.
 * If there are none, make sure the main submit still happens.
 *
 * @param string type The integration type to check.
 *
 * @returns boolean Whether or not submit should continue.
 */
Formstack.Form.prototype.processIntegrations = function(type) {
  // grab the correct integration holder
  var currentIntegrations = type + 'Integrations';

  // it's not an error of there are no integrations of that type
  if (typeof this[currentIntegrations] !== 'object') {
    return true;
  }

  var prepareCount = 0;

  for (var key in this[currentIntegrations]) {
    if (!this[currentIntegrations].hasOwnProperty(key)) {
      continue;
    }

    // if an integration has its key set to 'error'
    // we need to not continue
    if (this[currentIntegrations][key].key === 'error') {
      return false;
    }

    // if a success key is set (but not true), that means we have already
    // sent out a request and need to wait for the response
    if (!this[currentIntegrations][key].success &&
        typeof this[currentIntegrations][key].success !== 'undefined') {

      return false;
    }

    // if the integration has completed
    // we don't need to prepare it again
    if (this[currentIntegrations][key].success) {
      continue;
    }

    // grab the appropriate preparation function and have at it
    var prepareFunction = 'prepare' + key.charAt(0).toUpperCase() + key.slice(1);

    if (typeof this[prepareFunction] === 'function') {
      this[prepareFunction]();
      prepareCount++;
    }
  }

  // make sure submit continues if all is well,
  // if any integrations were prepared, we're not ready
  if (prepareCount) {
    return false;
  }

  return true;
};

/**
 * Check for comppletion on all payment integrations. If all are complete,
 * run submit again (this will prevent the other logic in submit from clogging things).
 *
 * @param string type The integration type to check.
 */
Formstack.Form.prototype.checkIntegrationsComplete = function(type) {
  // grab the correct integration holder
  var currentIntegrations = type + 'Integrations';

  if (typeof this[currentIntegrations] !== 'object') {
    return;
  }

  for (var key in this[currentIntegrations]) {
    if (!this[currentIntegrations].hasOwnProperty(key)) {
      continue;
    }

    // exit on a failed integration so we don't have to count success
    if (!this[currentIntegrations][key].success) {
      return;
    }
  }

  // run the appropriate callback for the integration type
  // if nothing has failed
  switch (type) {
    case 'payment':
      this.form.submit();
      break;
  }
};

Formstack.Form.prototype.checkForm = function() {
    if (this.skipValidation) {
      return true;
    }

    var res = true,
        i,
        length;

    if (this.skipPageValidation) {
      var invalidPage = false;
      var failedPageIndex = 1;
      // They skipped validation up to now. They need to check themselves before
      // they wreck themselves on the server
      for (i = 1, length = this.pages; i <= length; i++) {
        res = this.checkPage(i);
        if (!res && !invalidPage) {
          invalidPage = true;
          failedPageIndex = i;
        }
      }

      if(invalidPage && this.disableNavigation) {
        return;
      }
      if (invalidPage) {
        this.changePage(this.currentPage, failedPageIndex);
        return;
      }
    } else {
      // Check for required fields on the page being submitted from
      res = this.checkPage(this.currentPage);
    }

    if (res) {

        var hidden_fields = [];

        // Get the required fields
        var fields = $('#fsForm' + this.id + ' .fsRequired').get();

        for (i = 0; i < fields.length; i++) {

            var field = fields[i];
            var matrixFieldset = $(field).parents('.fsMatrixFieldset');
            var matrixDisabled = typeof matrixFieldset[0] != 'undefined' && $(matrixFieldset[0]).attr('disabled') === 'disabled';

            // Check if it's visible
            if (field.disabled || matrixDisabled) {

                if (field.id.indexOf('_') >= 0) {
                    var m = field.id.split('_');
                    hidden_fields.push(m[0]);
                }
                else {
                    hidden_fields.push(field.name);
                }
            }
        }

        if (document.getElementById('hidden_fields' + this.id))
            document.getElementById('hidden_fields' + this.id).value = hidden_fields.join(',');

        return true;
    }
    else {
        this.form.trigger('form:validation-error');
        return false;
    }
};

Formstack.Form.prototype.getWorkflowStepAccess = function(id) {
    var findInFields = this.workflowFields[parseInt(id, 10)].section;

    return this.workflowSections[findInFields].workflowAccess;
}

/**
 *
 *
 */
Formstack.Form.prototype.checkLogic = function(arg) {
    // Changed this.getFieldId(arg) to arg as it appears that if it's not an object, then it IS the id.
    var id = typeof arg == 'object' && 'target' in arg ? this.getFieldId(arg.target) : this.getFieldId(arg);

    for (var i = 0; i < this.checks.length; i++) {

        if (this.checks[i].fields.indexOf(id) < 0) continue;
        var check  = this.checks[i];
        var test   = false;
        this.forLogic = true;

        var fieldCheck, targetSectionIndex, checkSectionIndex;

        for (var j = 0; j < check.checks.length; j++) {
            fieldCheck = check.checks[j];

            switch (fieldCheck.condition) {
              case 'dateIsEqual':
                test = this.isDateEqual(fieldCheck.field, fieldCheck.option);
                break;
              case 'dateIsNotEqual':
                test = !this.isDateEqual(fieldCheck.field, fieldCheck.option);
                break;
              case 'dateAfter':
                test = this.isDateAfter(fieldCheck.field, fieldCheck.option);
                break;
              case 'dateBefore':
                test = this.isDateBefore(fieldCheck.field, fieldCheck.option);
                break;
              case 'dateIsBetween':
                test = this.isDateBetween(fieldCheck.field, fieldCheck.option);
                break;
              case 'dateIsNotBetween':
                test = !this.isDateBetween(fieldCheck.field, fieldCheck.option);
                break;
              case 'dateIsWithin':
                test = this.isDateWithin(fieldCheck.field, fieldCheck.option);
                break;
              case 'dateIsNotWithin':
                test = !this.isDateWithin(fieldCheck.field, fieldCheck.option);
                break;
              case 'gt':
                test = this.isFieldGreaterThan(fieldCheck.field, fieldCheck.option);
                break;
              case 'lt':
                test = this.isFieldLessThan(fieldCheck.field, fieldCheck.option);
                break;
              case '!=':
                test = !this.isFieldEqual(fieldCheck.field, fieldCheck.option);
                break;
              default:
                test = this.isFieldEqual(fieldCheck.field, fieldCheck.option);
            }

            // The test failed and it must pass, we can bail out here.
            if (check.bool == 'AND' && !test) break;

            // The test passed and the check only needs one test to pass, we can bail out here.
            if (check.bool == 'OR' && test) break;

        } // end of checks for this target.

        if ((test && check.action == 'Show') || (!test && check.action == 'Hide')) {
          this.showFields(check.target);

          if (this.fireLogicEvents) {
            this.form.trigger('logic:changed', {target: check.target, type: 'show'});
          }
        } else {
          this.hideFields(check.target);

          if (this.fireLogicEvents) {
            this.form.trigger('logic:changed', {target: check.target, type: 'hide'});
          }
        }

        // Hide dependent targets when check field is hidden by a Workflow
        if (test && check.action == 'Show' && this.belongsToHiddenWorkflowSection(fieldCheck.field)) {
          this.hideFields(check.target);

          if (this.fireLogicEvents) {
            this.form.trigger('logic:changed', {target: check.target, type: 'hide'});
          }
        }
    } // end of logic that contains the field.

    this.forLogic = false;

    // We run checkLogic on every field in the initLogic method, meaning we call this n times
    // We're already calling it on its own in init(), so let's just run it the once.

    if (!this.initializing) {
      this.checkNavigation();
    }
};

Formstack.Form.prototype.getFieldValues = function(id, forValidation) {
    var values = new Array();
    var fields = this.getFields(id);

    for (var i = 0; i < fields.length; i++) {

        var input = fields[i];

        if (input.disabled && !this.isReadOnlyWorkflowInput(input)) {
            continue;
        }

        if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) {
                values.push(input.value);
            }
        } else if (input.type === 'select-multiple') {
            for (var j = 0; j < input.options.length; j++) {
                if (input.options[j].selected) {
                    values.push(input.options[j].value);
                }
            }
        } else if ($(input).data('type') === 'product-quantity' && input.selectedIndex === 0 && !forValidation) {
            if (input.options && input.options.length && input.options[0].text === '--') {
                // treat empty options as 0 for logic checks
                values.push('0');
            }
        } else {
            values.push(input.value);
        }
    }

    return values;
};

/**
 * Determines if a form input is within a hidden workflow section.
 */
Formstack.Form.prototype.belongsToHiddenWorkflowSection = function(input) {
    var parentSection = $(input).closest('.fsCell');
    return parentSection.hasClass('fsWorkflowHidden') && !parentSection.hasClass('fsWorkflowReadOnly');
};

/**
 * Determines if a workflow form input is set as read-only.
 * This case appears in workflow forms with logic *across* steps.
 */
Formstack.Form.prototype.isReadOnlyWorkflowInput = function(input) {
  var parentSection = $(input).closest('.fsCell');
  return !parentSection.hasClass('fsWorkflowHidden') && parentSection.hasClass('fsWorkflowReadOnly');
};

/**
 * Determines if a Formstack field has a specific value.
 */
Formstack.Form.prototype.isFieldEqual = function(id, value) {

    var values = this.getFieldValues(id);
    return values.indexOf(value) != -1;
};

/**
 * Creates timestamp from a string value
 *
 * @param string date in MM-DD-YYYY format
 *
   @return timestamp
 */
Formstack.Form.prototype.getTimestampFromDefaultDatePattern = function(date) {
  var dateArray = date.split('-');
  var dateTimestamp = new Date(parseInt(dateArray[2], 10), parseInt(dateArray[0], 10) - 1, parseInt(dateArray[1], 10));
  dateTimestamp.setHours(0,0,0,0);

  return dateTimestamp;
};

/**
 * Checks a date/time field value vs given date
 *
 * @param integer fieldId id of a date/time field
 * @param string afterValue date in MM-DD-YYYY format
 *
 * @return boolean Whether or not date value occur after a given boundary
 */
Formstack.Form.prototype.isDateAfter = function(fieldId, afterValue) {
  var dateFieldTimestamp = this.getDateFieldTimestamp('field' + fieldId);

  if (!dateFieldTimestamp) {
    return;
  }

  return dateFieldTimestamp.getTime() > this.getTimestampFromDefaultDatePattern(afterValue).getTime();
};

/**
 * Checks a date/time field value vs given date
 *
 * @param integer fieldId id of a date/time field
 * @param string beforeValue date in MM-DD-YYYY format
 *
 * @return boolean Whether or not date value occur before a given boundary
 */
Formstack.Form.prototype.isDateBefore = function(fieldId, beforeValue) {
  var dateFieldTimestamp = this.getDateFieldTimestamp('field' + fieldId);

  if (!dateFieldTimestamp) {
    return;
  }

  return dateFieldTimestamp.getTime() < this.getTimestampFromDefaultDatePattern(beforeValue).getTime();
};

/**
 * Checks a date/time field value vs given date
 *
 * @param integer fieldId id of a date/time field
 * @param string  rangeValues comma-separated dates
 *
 * @return boolean Whether or not date value occur between a given boundary
 */
Formstack.Form.prototype.isDateBetween = function(fieldId, rangeValues) {
  var dateFieldTimestamp = this.getDateFieldTimestamp('field' + fieldId);

  if (!dateFieldTimestamp) {
    return;
  }

  var rangeValuesArray = rangeValues.split(',');
  var rangeMin = this.getTimestampFromDefaultDatePattern(rangeValuesArray[0]).getTime();
  var rangeMax = this.getTimestampFromDefaultDatePattern(rangeValuesArray[1]).getTime();

  if (rangeMin > rangeMax) {
    var tempTimestamp = rangeMin;
    rangeMin = rangeMax;
    rangeMax = tempTimestamp;
  }

  return rangeMin <= dateFieldTimestamp.getTime() && dateFieldTimestamp.getTime() <= rangeMax;
};

/**
 * Checks whether a date/time field value is within a certain amount of time from the current date.
 *
 * @param integer fieldId         ID of a date/time field
 * @param string  targetTimeframe Timeframe duration followed by unit ('5 days', '12 years')
 *
 * @return boolean Whether or not date value is within the given timeframe relative to today
 */
Formstack.Form.prototype.isDateWithin = function(fieldId, targetTimeframe) {
  if (!fieldId || !targetTimeframe) {
    return;
  }

  var dateFieldTimestamp = this.getDateFieldTimestamp('field' + fieldId);

  if (!dateFieldTimestamp) {
    return;
  }

  // Pull the duration and units from the target timeframe
  var parsedTimeframeMatches = targetTimeframe.match(/(\d+)\s+(\w+)/);

  if (!parsedTimeframeMatches || parsedTimeframeMatches.length < 3) {
    return;
  }

  var targetDuration = parseInt(parsedTimeframeMatches[1], 10);
  var targetTimeUnits = parsedTimeframeMatches[2].toLowerCase();
  var today = Formstack.Util.getStartOfCurrentDate();

  // Adjust the date we're comparing against to be one day closer to today.
  // That sounds weird, but works because we want to check that the difference is within the target
  // duration (inclusive), and the computeDateDuration method rounds down to the nearest integer.
  var dateAdjustment = 0;

  if (today > dateFieldTimestamp) {
    dateAdjustment = 1;
  } else if (today < dateFieldTimestamp) {
    dateAdjustment = -1;
  }

  dateFieldTimestamp.setDate(dateFieldTimestamp.getDate() + dateAdjustment);

  // Get the amount of time between the date field value and today
  var duration = this.computeDateDuration(today, dateFieldTimestamp, targetTimeUnits, false);

  return duration < targetDuration;
};

/**
 * Checks whether a date/time field value is equal the given date
 *
 * @param integer fieldId ID of a date/time field
 * @param string  date    in MM-DD-YYYY format
 *
 * @return boolean Whether or not date value is equal the given date
 */
Formstack.Form.prototype.isDateEqual = function(fieldId, date) {
  if (!fieldId || !date) {
    return;
  }

  var dateFieldTimestamp = this.getDateFieldTimestamp('field' + fieldId);

  if (!dateFieldTimestamp) {
    return;
  }

  return dateFieldTimestamp.getTime() === this.getTimestampFromDefaultDatePattern(date).getTime();
};

/**
 * Determines if a Formstack field is greater than a numeric value
 */
Formstack.Form.prototype.isFieldGreaterThan = function(id, value) {

    // This allows use of that comparator function with selects (used in product field)
    var fields = this.getFields(id);
    if (fields && fields.length == 1 && fields[0].nodeName == 'SELECT') {
        return parseInt(this.getFieldValues(id)[0]) > value;
    }

    var calcInfo = this.getCalcInfo(id);

    return calcInfo.sum > value;
};

Formstack.Form.prototype.isFieldLessThan = function(id, value) {

    // This allows use of that comparator function with selects (used in product field)
    var fields = this.getFields(id);
    if (fields && fields.length == 1 && fields[0].nodeName == 'SELECT') {
        return parseInt(this.getFieldValues(id)[0]) < value;
    }

    var calcInfo = this.getCalcInfo(id);

    return calcInfo.sum < value;
};

Formstack.Form.prototype.hasAlreadyFailedValidation = function(field) {
    var alreadyFailed = false;
    var fieldParent = this.getFieldContainer(field);
    if (this.failedContainers.indexOf(fieldParent) != -1) {
        alreadyFailed = true;
    }
    return alreadyFailed;
};

// TODO:PAP - this has side effect and should probably separate business of checking required validity and updating form
Formstack.Form.prototype.checkRequired = function(field, onchange, hideErrors) {
    var id = this.getFieldId(field);

    if (!this.validate || location.search.indexOf('no_req') >= 0) {
        return true;
    }

    if (this.fieldManagedByStripe(field)) {
        return true;
    }

    if (onchange !== null && onchange) {
        if (document.getElementById('fsCell' + id).className.indexOf('fsValidationError') === -1) {
            return true;
        }
    }

    var showError = false,
        pass = true,
        c,
        length;

    /*
     * Skip validation if it's workflow and section is not writable
     */
    if (this.isWorkflowForm && this.getWorkflowStepAccess(id) !== 'write') {
        return true;
    }

    if (!field.disabled) {
        // First check required fields for a value
        if ($(field).hasClass('fsRequired')) {
            var pFieldName = field.name.substr(0, field.name.indexOf('-')),
                pMatrix = document.getElementById('matrix-' + pFieldName),
                fieldValue = $(field).val(),
                signatureValueStart = 'data:image/png;base64,',
                siblingSignatures = $(field).siblings('.fsSignature'); //Isn't necessary if we remove future-proofing logic below

            if (pMatrix !== null) {
                var inputs = pMatrix.getElementsByTagName('input'),
                    columns = new Array(false);

                for (var j = 0; j < inputs.length; j++) {
                    var hasRadio = false,
                        currentInput = inputs[j],
                        fieldType = currentInput.type.toLowerCase();

                    if (fieldType === 'radio' || fieldType === 'checkbox') {
                        if (fieldType === 'radio') {
                            hasRadio = true;
                            pass = this.checkValidValue(currentInput);
                        }

                        if (!pass && !$(pMatrix).hasClass('fsMatrixOnePerColumn')) {
                            break;
                        }

                        var col = parseInt(inputs[j].id.substr(inputs[j].id.lastIndexOf("-") + 1)) - 1;

                        if (columns[col] === null || typeof columns[col] === 'undefined') {
                            columns[col] = false;
                        }

                        if (inputs[j].checked) {
                            columns[col] = true;
                        }
                    }
                }

                if ($(pMatrix).hasClass('fsMatrixOnePerColumn')) {
                    pass = true;

                    for (c = 0, length = columns.length; c < length; c++) {
                        if (columns[c] === false) {
                            pass = false;
                            break;
                        }
                    }
                } else if (!hasRadio) {
                    pass = false;

                    for (c = 0, length = columns.length; c < length; c++) {
                        if (columns[c] === true) {
                            pass = true;
                            break;
                        }
                    }
                }
            } else if (fieldValue !== null &&
                (fieldValue.indexOf(signatureValueStart) >= 0) &&
                (siblingSignatures.length > 0)) {
                // siblingSignatures logic isn't strictly necessary;
                // It's there as a future-proofing measure in case we add
                // additional Canvas-based form elements down the line

                /*
                 * Base concept for signature validation created by dvdotsenko
                 * in jSignature's issues thread on 'Add function to check for signature'
                 * https://github.com/willowsystems/jSignature/issues/16
                 *
                 * I couldn't find any documentation on GitHub about attribution rules, so this is the best
                 * they'll get for now.
                */
                var id = field.id.substr(String('field').length),
                    data = $('#signature' + id).jSignature('getData', 'native');

                // data.length: number of inputs
                // data[i].x.length/data[i].y.length: number of points
                // a single input is valid, but not any number of single points
                pass = false;

                for (var i = 0, len = data.length; i < len; i++) {
                    if (data[i].x.length >= 5) {
                        pass = true;
                        break;
                    }
                }
            } else {
                pass = this.checkValidValue(field);
            }

            if (!pass) {
                showError = true;

                // If this is an address field and we already know it's failed,
                // skip the zip code so we don't test formatting
                if ($(field).hasClass('fsFieldAddress')) {
                    var id = field.id.split('-');id = id[0];
                }

                if (!hideErrors) {
                  this.failedContainers.push(this.getFieldContainer(field));
                }
            }
        }

        // Now test file upload
        if (pass && $(field).hasClass('fsUpload')) {
            pass = this.checkUpload(field);

            if (!pass) {
                showError = true;
            }
        }

        if (!hideErrors) {
            // if the field doesn't pass validation
            // it should highlight the field, not un-highlight it
            this.highlightField(field, !pass);
        }
    }

    if (!hideErrors && showError) {
        // we should scroll to the error if it's new,
        // not if the field is changing and being re-validated
        var scrollToError = (onchange) ? false : true;

        var baseError = document.getElementById('requiredFieldsError') ?
            document.getElementById('requiredFieldsError').innerHTML :
            'Please fill in a valid value for all required fields';
        this.showFieldsError(baseError, scrollToError);

        return false;
    }

    return pass;
};

/**
 * Show an error at the top of the form, most often associated with
 * required fields not being filled, or fields not passing validation.
 *
 * @param string  message       The message to display to the user
 * @param boolean scrollToError Whether or not the form should scroll to make the message visible
 */
Formstack.Form.prototype.showError = function(message, scrollToError) {
  $('#fsError' + this.id).remove();

  var error = document.createElement('div');

  error.id        = 'fsError' + this.id;
  error.className = 'fsError';
  error.innerHTML = message;

  error.setAttribute('role', 'alert');
  error.setAttribute('aria-live', 'assertive');
  $(error).prependTo('#fsForm' + this.id);

  if (scrollToError) {
    Formstack.Util.scrollTo('#fsError' + this.id);
  }
};

Formstack.Form.prototype.showFieldsError = function(message, scrollToError) {
    var fieldDescriptions = jQuery('.fsCell.fsValidationError').toArray().reduce(function (message, container, index, failedContainers) {
        var punctuation = index === failedContainers.length - 1 ? '' : ',';
        return message + ' <strong>' + jQuery(container).attr('fs-field-validation-name') + punctuation + '</strong>';
    }, ' <br/>Fields: ');
    return this.showError(message + fieldDescriptions, scrollToError);
};

/**
 * Helper function to remove the error box from the top of the form if all previously
 * invalid fields have been properly validated.
 */
Formstack.Form.prototype.hideError = function() {
  $('#fsError' + this.id).remove();
};

Formstack.Form.prototype.highlightField = function(field, on, msg) {
  var container = this.getFieldContainer(field);

  if (!msg) {
      msg = '';
  }

  // Set the field background color
  if (on) {
    $(container).addClass('fsValidationError');
    $(field).attr('aria-invalid', true);
  } else {
    $(container).removeClass('fsValidationError');
    $(field).removeAttr('aria-invalid');
  }

  if (this.hasHtml5Validation) {
    field.setCustomValidity(msg);
  }

  // if there are no other fields with validation errors,
  // remove the validation message
  if (!jQuery('.fsValidationError').length) {
    this.hideError();
  }
};

Formstack.Form.prototype.getContainer = function(field, cls) {
    var container = field;

    while (container && container.tagName && container.tagName.toLowerCase() != 'body') {

        if ($(container).hasClass(cls)) {
            return container;
        }

        container = container.parentNode;
    }

    return;
};

Formstack.Form.prototype.getFieldContainer = function(field) {
    return this.getContainer(field, 'fsFieldCell');
};

Formstack.Form.prototype.validateNamePart = function(nameFieldSelector) {
    var element = document.getElementById(nameFieldSelector);
    return !$(element).hasClass('fsRequired') || element.value.match(/\S/);
};

Formstack.Form.prototype.checkValidName = function(field) {
    var id = field.id.split('-');
    id = id[0];

    var bad = !document.getElementById(id + '-first').value.match(/\S/) ||
        !document.getElementById(id + '-last').value.match(/\S/);

    return !bad && this.validateNamePart(id + '-prefix')
        && this.validateNamePart(id + '-suffix')
        && this.validateNamePart(id + '-middle')
        && this.validateNamePart(id + '-initial');
};

Formstack.Form.prototype.checkValidValue = function(field) {

    var isInvalid = false;
    var id = this.getFieldId(field);

    switch (field.type.toLowerCase()) {
        case 'text':
        /*
        case 'password':
        case 'textarea':
        case 'file':
        case 'email':
        case 'tel':
        case 'number':
        */

            if ($(field).hasClass('fsFieldName')) {
                isInvalid = !this.checkValidName(field);
            }
            else if ($(field).is('.fsFieldAddress, fsFieldAddress2, .fsFieldCity, .fsFieldState, .fsFieldZip, .fsFieldCountry')) {

                var id = field.id.split('-');id = id[0];

                if (document.getElementById(id + '-address')) {
                  isInvalid = !document.getElementById(id + '-address').value.match(/\S/)
                }

                if (document.getElementById(id + '-city')) {
                  isInvalid = !document.getElementById(id + '-city').value.match(/\S/)
                }

                var postalCode = jQuery('#' + id + '-zip');

                // exclude the zip code from validation checking when it is in
                // its 'other' country format as most other countries don't have postal codes
                if (postalCode.length && !postalCode.hasClass('fsFormatZipXX')) {
                    isInvalid = isInvalid || !postalCode.val().match(/\S/);
                }

                var state = document.getElementById(id + '-state');
                if (!isInvalid && state) {

                    if (state.type.toLowerCase() == 'select-one')
                        isInvalid = !state.options[state.selectedIndex].value.match(/\S/);
                    else
                        isInvalid = !state.value.match(/\S/);
                }

                if (!isInvalid) {
                    var country = document.getElementById(id + '-country');
                    if (country && !country.options[country.selectedIndex].value.match(/\S/))
                        isInvalid = true;
                }
            }
            else {
                isInvalid = !field.value.match(/\S/);
            }

            break;
        case 'textarea':
            isInvalid = !field.value.match(/\S/);
            break;
        default:
            var vals = this.getFieldValues(field.name, true);//this.getFieldValues(field.id);
            var fieldContainer = this.getFieldContainer(field);

            if (this.isWorkflowForm &&
               (jQuery(field).parent().find('.fsSignatureValue').length > 0 ||
                jQuery(field).parent().find('.fsFileValue').length > 0)) {
                isInvalid = false;
            } else if (jQuery(fieldContainer).attr('fs-field-type') === 'rating') {
                if (!jQuery(fieldContainer).find('.fsRatingNaOption input').prop('checked')
                  &&
                  (vals.length === 0 || vals[0] === null || vals[0] === '')) {
                  isInvalid = true;
                }
            } else if (vals.length === 0 || vals[0] === null || vals[0] === '') {
                isInvalid = true;
            }

            break;
    }

    return !isInvalid;
};

Formstack.Form.prototype.checkUpload = function(field) {

    var pass = true;

    // Get the valid file types
    var types = [];

    var classNames = field.className.split(/\s+/);
    for (var j = 0; j < classNames.length; j++) {

        var className = classNames[j];

        if (/^uploadTypes-/.test(className)) {
            var m = className.split('-');
            types = m[1].split(',');
        }
    }

    // Make sure all types are lower case
    for (var j = 0; j < types.length; j++) {
        types[j] = types[j].toLowerCase();
    }

    if (types.indexOf('*') < 0 && field && field.value !== "" && !field.disabled) {

        // Get the extension from the uploaded file
        var ext = field.value.match(/\.(\w+)$/);

        pass = ext && types.indexOf(ext[1].toLowerCase()) >= 0 ? true : false;

        // Highlight if it's bad
        if (!pass) {
            this.highlightField(field, true);
            var msg = document.getElementById('fileTypeAlert') ?
                $('#fileTypeAlert').text() : 'You must upload one of the following file types for the selected field:';
            alert(msg + types.join(', '));
        }
    }

    return pass;
};

Formstack.Form.prototype.checkFormat = function(arg, isOnChange) {
  var field = typeof arg == 'object' && 'target' in arg ? arg.target : arg,
      parentContainer = this.getFieldContainer(field);

  this.onChange = false;

  if (typeof isOnChange !== 'undefined') {
    this.onChange = true;
  }

  if (this.fieldManagedByStripe(field)) {
    return true;
  }

  // if the field doesn't have any value,
  // then we don't care (unless we're doing final validation)
  // we should also make sure to un-highlight the field
  if ((field.value === '' || field.disabled) && !this.onChange && field.className.indexOf('fsFormatMaxDate') === -1) {
    this.highlightField(field, false);
    return true;
  }

  // this checks the empty-state for radio buttons
  if (field.type === 'radio' && !field.checked && !this.onChange) {
    this.highlightField(field, false);
    return true;
  }

  var classes   = field.className.split(/\s+/),
      hasFormat = false,
      formatted = false;

  for (var i = 0, length = classes.length; i < length; i++) {
    if (classes[i].indexOf('fsFormat') !== 0) {
      continue;
    }

    hasFormat = true;

    // remove 'fs' from the class to get the type of format required
    var formatter = 'check' + classes[i].slice(2);

    // List of validation fallbacks
    var fallbacks = [
      'checkFormatPhone'
    ];

    if (typeof this[formatter] === 'function') {
      formatted = this[formatter](field);
      if (!formatted) {
        break;
      }
    } else {
      // See if there is a fallback for the formatter
      for (var j = 0, fallbackLength = fallbacks.length; j < fallbackLength; j++) {
        if (formatter.indexOf(fallbacks[j]) === 0 && typeof this[fallbacks[j]] === 'function') {
          formatted = this[fallbacks[j]](field);
          break;
        }
      }

      if (!formatted) {
        break;
      }
    }
  }

  var pass = !hasFormat || (hasFormat && formatted),
      failedRequired;

  // Make sure a good format doesn't override a bad Required
  // Also make sure that we don't check for required *before* the user has a chance to fill out the whole field
  // If a field is marked as invalid we need to check if it is a bad Required

  if (
    pass &&
    hasFormat &&
    field.className.indexOf('fsRequired') >= 0 &&
    (parentContainer.className.indexOf('fsFieldFocused') < 0 || parentContainer.className.indexOf('fsValidationError') >= 0)
  ) {
    pass = this.checkRequired(field);

    failedRequired = !pass;
  }

  if (hasFormat) {
      if (!pass && !failedRequired) {
        this.showFieldsError(document.getElementById('invalidFormatError') ?
          document.getElementById('invalidFormatError').innerHTML :
          'Please ensure all values are in a proper format.');
      }
      this.highlightField(field, !pass);
  }

  return pass;
};

Formstack.Form.prototype.checkFormatValidateReactField = function (field) {
  var validationMessageAttribute = 'data-validation-message';
  var fieldContainer = $(this.getFieldContainer(field));
  var validationMessage = fieldContainer.find('[' + validationMessageAttribute + ']').attr(validationMessageAttribute);

  fieldContainer.find('.fsErrorLabel').text(validationMessage);

  return validationMessage === '';
}

Formstack.Form.prototype.checkFormatText = function(field) {
  var confirmField      = null,
      checkConfirmation = false;

  if (field.id.indexOf('_confirm') > -1) {
    confirmField = field;
    field = document.getElementById(field.id.replace('_confirm', ''));

    // we should check the confirm field since it has changed
    checkConfirmation = true;
  } else {
    confirmField = document.getElementById(field.id + '_confirm');

    // use jquery to handle IE edge case
    var $field = $(field);
    var $confirmField = $(confirmField);
    var requiredClass = 'fsRequired';
    var requiredAttr = 'required';

    // if the regular field is not already required (meaning both fields are required) then require the confirmation
    // to have some value before being submitted.
    // This is to handle the edge case where confirmation could potentially be submitted with a blank value.
    if (!$field.hasClass(requiredClass)) {
      $field.val() && $confirmField.addClass(requiredClass).attr(requiredAttr, true);
      !$field.val() && $confirmField.removeClass(requiredClass).removeAttr(requiredAttr)
    }

    // make sure we don't prematurely try to validate the confirm field
    if (confirmField && field.value && confirmField.value) {
      checkConfirmation = true;
    }
  }

  // if both are empty, they are technically valid
  // (the required check with get them later)
  if (!field.value && (!confirmField || !confirmField.value)) {
    return true;
  }

  if (confirmField && checkConfirmation) {
    // validation fails if the confirmation field is empty
    if (!confirmField.value) {
      return false;
    }

    // validation fails if the confirmation field does not match
    // the main text field
    if (confirmField.value != field.value) {
      return false;
    }
  }

  return true;
};

Formstack.Form.prototype.checkFormatMinLength = function(field) {
  var valueLength = field.value.length;
  // if there are no characters or the character count is >= minLength then don't return a validation error
  // otherwise do return a validation error.
  return !valueLength || valueLength >= parseInt(field.getAttribute('minlength'), 10) ? true : false;
};

Formstack.Form.prototype.checkFormatEmail = function(field) {
  // per the W3 spec - http://www.w3.org/TR/html5/forms.html#valid-e-mail-address
  var confirmField      = null,
      checkConfirmation = false,
      emailRegex        = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (field.id.indexOf('_confirm') > -1) {
    confirmField = field;
    field = document.getElementById(field.id.replace('_confirm', ''));

    // we should check the confirm field since it has changed
    checkConfirmation = true;
  } else {
    confirmField = document.getElementById(field.id + '_confirm');
    // if field has a value then we need to make sure a user can't submit with an empty confirmation
    // use jquery to handle IE edge case
    var $field = $(field);
    var $confirmField = $(confirmField);
    var requiredClass = 'fsRequired';
    var requiredAttr = 'required';

    // if the regular field is not already required (meaning both fields are required) then require the confirmation
    // to have some value before being submitted.
    // This is to handle the edge case where confirmation could potentially be submitted with a blank value.
    if (!$field.hasClass(requiredClass)) {
      $field.val() && $confirmField.addClass(requiredClass).attr(requiredAttr, true);
      !$field.val() && $confirmField.removeClass(requiredClass).removeAttr(requiredAttr)
    }

    // make sure we don't prematurely try to validate the confirm field
    if (confirmField && field.value && confirmField.value) {
      checkConfirmation = true;
    }
  }

  // if both are empty, they are technically valid
  // (the required check with get them later)
  if (!field.value && (!confirmField || !confirmField.value)) {
    return true;
  }

  if (confirmField && checkConfirmation) {
    // validation fails if the confirmation field is empty
    if (!confirmField.value) {
      return false;
    }

    // validation fails if the confirmation field does not match
    // the main email field
    if (confirmField.value != field.value) {
      return false;
    }

    // validation fails if the confirmation field
    // isn't a valid email address
    if (!confirmField.value.match(emailRegex)) {
      return false;
    }
  }

  return field.value.match(emailRegex);
};

Formstack.Form.prototype.checkFormatPhoneExternal = function(field) {
  var container = this.getFieldContainer(field);
  if (!container) {
    return true;
  }

  if ($(container).hasClass('fsFieldValidating')) {
    return true;
  }

  var form     = $('#fsForm' + this.id);
  var action   = form.attr('action');
  var callback = 'form' + this.id + '.onValidationResult';
  var value    = field.value;

  if (!value || value === '') {
    return true;
  }

  // Get country
  var country = $(field).data('country') || 'XX';

  // Don't validate unknown countries
  if (country == 'XX') {
    return true;
  }

  // Build the URL
  var url = action.substring(0, action.lastIndexOf('/')) + '/validate.php';

  $(container).addClass('fsFieldValidating');

  $.ajax({
    url: url,
    dataType: 'jsonp',
    data: {
      f: this.id,
      field: this.getFieldId(field.id),
      value: field.value
    },
    success: this.onValidationResult.bind(this)
  });

  return true;
};

Formstack.Form.prototype.onValidationResult = function(result) {
  if (!result || !result.success || !result.field) {
    return;
  }

  var field = $('#field' + result.field);
  if (!field || !field.length) {
    return;
  }

  var fieldElem = field[0];

  var container = this.getFieldContainer(fieldElem);
  if (!container) {
    return;
  }

  $(container).removeClass('fsFieldValidating');

  if (!result.valid) {
    this.highlightField(fieldElem, true);
    return;
  }
};

Formstack.Form.prototype.getPhoneParts = function(str, allowLeading) {
  // Remove anything besides numbers or "x"
  var val = str.toLowerCase().replace(/[^\dx]/g, '');

  // Look for an extension
  var ext = '';
  if (val.indexOf('x') >= 0) {
    // Split the extension from the number
    var parts = val.split('x');
    val = parts[0];
    ext = parts[1];
  }

  // Remove any leading 1
  if (!allowLeading) {
    if (val.charAt(0) == '1') {
      val = val.slice(1);
    }
  }

  return [val, ext];
};

Formstack.Form.prototype.checkFormatPhoneUS = function(field) {
  if (typeof googlePhoneParser !== 'undefined') {
    return this.checkFormatPhone(field);
  }

  var parts = this.getPhoneParts(field.value);
  var val   = parts[0];
  var ext   = parts[1];

  if (val.length != 10) {
    return false;
  }

  field.value = '(' + val.substr(0, 3) + ') ' + val.substr(3, 3) + '-' + val.substr(6, 4);
  if (ext.length) {
    field.value += ' x' + ext;
  }

  return true;
};

Formstack.Form.prototype.checkFormatPhoneUK = function(field) {
  if (typeof googlePhoneParser !== 'undefined') {
    return this.checkFormatPhone(field);
  }

  var parts = this.getPhoneParts(field.value);
  var val   = parts[0];
  var ext   = parts[1];

  // Remove +44
  if (val.substr(0, 2) == '44') {
    val = val.slice(2);
    if (val.charAt(0) != '0') {
      val = '0' + val;
    }
  }

  // Error if it doesn't start with "0" or isn't 10 or 11 digits
  if (val.charAt(0) != '0' || (val.length != 10 && val.length != 11)) {
    return false;
  }

  if ((val.charAt(1) == '1' && (val.charAt(2) == '1' || val.charAt(3) == '1')) || (val.charAt(1) == '8')) {
    // 01x1 xxx xxxx, 011x xxx xxxx, 08xx xxx xxxx
    field.value = val.substr(0, 4) + ' ' + val.substr(4, 3) + ' ' + val.substr(7, val.length - 7);
  } else if (val.charAt(1) == '2' || val.charAt(1) == '3' || val.charAt(1) == '5') {
    // 02x xxxx xxxx, 03x xxxx xxxx, 05x xxxx xxxx
    field.value = val.substr(0, 3) + ' ' + val.substr(3, 4) + ' ' + val.substr(7, val.length - 7);
  } else {
    // 0xxxx xxxxxx
    field.value = val.substr(0, 5) + ' ' + val.substr(5, val.length - 5);
  }

  if (ext.length) {
    field.value += ' x' + ext;
  }

  return true;
};

Formstack.Form.prototype.checkFormatPhoneAU = function(field) {
  if (typeof googlePhoneParser !== 'undefined') {
    return this.checkFormatPhone(field);
  }

  var parts        = this.getPhoneParts(field.value, true),
      normalFormat = true,
      val          = parts[0],
      ext          = parts[1];

  // Remove +61
  if (val.substr(0, 2) === '61') {
    val = val.slice(2);
  }

  // if the number is only 9 digits, that means we need to
  // add a leading zero for the area code
  if (val.length === 9) {
    val = '0' + val;
  }

  // error if it doesn't start with "0", "13", "1300", "18", or "1800"
  // the last three are local call numbers
  var allowedStarts = ['0', '13', '1300', '18', '1800'],
      startFound    = false;

  for (var i = 0, length = allowedStarts.length; i < length; i++) {
    if (val.substr(0, allowedStarts[i].length) === allowedStarts[i]) {
      startFound   = true;

      // starting with a 0 would indicate the normal format
      if (allowedStarts[i] !== '0') {
        normalFormat = false;
      }

      break;
    }
  }

  if (!startFound) {
    return false;
  }

  // error if it isn't 6, or 10 digits
  // some local call numbers can have 6 digits
  var allowedLengths = [6, 10];

  if (allowedLengths.indexOf(val.length) === -1) {
    return false;
  }

  // formatting based on phone number type / length
  var formattedValue = '';

  if (normalFormat) {
    formattedValue = '(' + val.substr(0, 2) + ') ' + val.substr(2, 4) + ' ' + val.substr(6, 4);
  } else {
    if (val.length === 6) {
      // format for 13 and 18 numbers that are always 6 digits
      formattedValue = val.substr(0, 2) + ' ' + val.substr(2, 2) + ' ' + val.substr(4, 2);
    } else {
      // format for 1300 and 1800 numbers that are the normal 10
      formattedValue = val.substr(0, 4) + ' ' + val.substr(4, 3) + ' ' + val.substr(7, 3);
    }
  }

  if (ext.length) {
    formattedValue += ' x' + ext;
  }

  field.value = formattedValue;

  return true;
};


Formstack.Form.prototype.checkFormatPhoneXX = function(field) {
  if (typeof googlePhoneParser !== 'undefined') {
    return this.checkFormatPhone(field);
  }

  // Just make sure we have at least 3 consecutive numbers somewhere
  return /\d{3,}/.test(field.value);
};

Formstack.Form.prototype.checkFormatPhone = function(field) {
  if (typeof googlePhoneParser === 'undefined') {
    return this.checkFormatPhoneXX(field);
  }

  // Get country
  var country = $(field).data('country') || 'XX';

  // Handle unknown countries
  if (country == 'XX') {
    return /\d{3,}/.test(field.value);
  }

  // Convert Format to Country Code
  if (country == 'UK') {
    country = 'GB';
  }

  // Validate the phone number
  var result = googlePhoneParser(field.value, country);
  if (!result || !result.valid) {
    return false;
  }

  // Get format for validation
  var format  = $(field).data('format') || 'national';
  field.value = result[format] || field.value;

  return true;
};

Formstack.Form.prototype.checkFormatZipUS = function(field) {

    // Trim whitespace
    var val = field.value.replace(/^\s+/, '').replace(/\s+$/, '');

    if (!val.match(/^\d{5}(?:\-\d{4})?$/)) {
        return false;
    }

    field.value = val;
    return true;
};

Formstack.Form.prototype.checkFormatZipXX = function(field) {

    return true;

};

Formstack.Form.prototype.checkFormatZipCA = function(field) {

    // Trim whitespace
    var val = field.value.replace(/^\s+/, '').replace(/\s+$/, '').replace(/\s{2,}/, ' ').toUpperCase();

    // Add a space if one isn't there
    if (val.length == 6 && !val.match(/\s/))
        val = val.substr(0, 3) + ' ' + val.substr(3, 3);

    // Make sure it validates
    if (!val.match(/^[A-Z]\d[A-Z] \d[A-Z]\d$/)) {
        return false;
    }

    field.value = val;

    return true;
};

Formstack.Form.prototype.checkFormatZipUK = function(field) {

    // Trim whitespace
    var val = field.value.replace(/^\s+/, '').replace(/\s+$/, '').replace(/\s{2,}/, ' ').toUpperCase();

    // Add space if one doesn't exist
    if (!val.match(/\s/)) {
        val = val.substr(0, val.length - 3) + ' ' + val.substr(val.length - 3, 3);
    }

    // Make sure it validates (see http://en.wikipedia.org/wiki/Postal_codes_in_the_United_Kingdom#Validation)
    if (!val.match(/^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$/)) {
        return false;
    }

    field.value = val;

    return true;
};

Formstack.Form.prototype.checkFormatZipAU = function(field) {

    // Trim whitespace
    var val = field.value.replace(/^\s+/, '').replace(/\s+$/, '').toUpperCase();

    // Make sure it validates
    if (!val.match(/^\d{4}$/)) {
        return false;
    }

    field.value = val;

    return true;
};

/**
 * Make sure the target date field conforms to the max date field set in the builder
 *
 * @param DOM element field with max date value
 *
 * @return boolean Whether or not the date value is valid
 */
Formstack.Form.prototype.checkFormatMaxDate = function(selectedDateField) {
  var fieldId = selectedDateField.id.slice(0, -1),
      selectedYearField = document.getElementById(fieldId + 'Y'),
      selectedMonthField = document.getElementById(fieldId + 'M'),
      selectedDayField = document.getElementById(fieldId + 'D'),
      selectedYearValue = selectedYearField.options[selectedYearField.selectedIndex].value,
      selectedMonthValue = selectedMonthField.selectedIndex,
      selectedDayValue = selectedDayField ? selectedDayField.selectedIndex : 1,
      maxDateValue = document.getElementById(fieldId + 'MaxDate').value,
      isRequired = selectedDateField.className.indexOf('fsRequired') > -1,
      isEmpty = (!selectedYearValue && !selectedMonthValue && (selectedDayField && !selectedDayValue)),
      isHidden = false;

  if (this.getFieldContainer(selectedDateField).className.indexOf('fsHidden') > -1 ||
      $(selectedDateField).closest('.fsSection').hasClass('fsHidden')) {

      isHidden = true;
  }

  // Values between 0-99 operate in 1900, if a field is using a short year syntax we need to adjust a value
  if (selectedYearValue.length === 2) {
    selectedYearValue = '20' + selectedYearValue;
  }

  if ((isEmpty && !isRequired) || isHidden) {
    return true;
  }

  if (!selectedYearValue || !selectedMonthValue || (selectedDayField && !selectedDayValue)) {
    return false;
  }

  var selectedDateTimestamp = new Date(selectedYearValue, selectedMonthValue - 1, selectedDayValue);
  var maxDateTimestamp = new Date(maxDateValue.replace(/-/g, '/'));

  return selectedDateTimestamp <= maxDateTimestamp;
}

/**
 * Make sure the target number field only has numbers entered in it,
 * and that it conform to the properties of the number field
 * as set by the builder.
 *
 * @param DOM element field The number input to check the format of
 *
 * @return boolean Whether or not the number format is valid
 */
Formstack.Form.prototype.checkFormatNumber = function(field) {
    // replace any non-number characters in the value
    var val              = field.value.replace(/[^\d\.\-]/g, ''),
        numberProperties = this.getNumberProperties(field),
        splitVal = [];

    // find the decimal position, if there is one
    var decimalSplit = val.split('.');

    // always add the first split section by splitting it into
    // 16 character chunks
    if (decimalSplit[0]) {
        splitVal = decimalSplit[0].match(/.{1,16}/g);
    }

    // make the decimal split the last chunk
    if (decimalSplit[1]) {
        var decimalValue;

        // consideration for only dealing with a decimal value
        // with no preceding numbers
        if (!splitVal.length) {
            decimalValue = '.' + decimalSplit[1];
        } else {
            var lastChunk = splitVal[splitVal.length - 1].split('');

            // pop the last digit from before the split
            // so .toFixed doesn't introduce an extra 0
            var decimalValue = lastChunk.pop();
            decimalValue += '.' + decimalSplit[1];

            // return the modified chunk
            splitVal[splitVal.length - 1] = lastChunk.join('');
        }

        // make sure the decimal amount isn't more than 16 characters
        // and /facepalm if it is
        decimalValue = decimalValue.match(/.{1,16}/g);

        splitVal.push(decimalValue[0]);
    }

    for (var i = 0, length = splitVal.length; i < length; i++) {
        // ignore negative signs if they happen
        // to be the first chunk
        if (splitVal[[i]] === '-') {
            continue;
        }

        // if any of the segments aren't numbers, bail out
        if (isNaN(splitVal[i])) {
            return false;
        }
    }

    // run the bounds checks on the whole string
    if ((!isNaN(numberProperties.min) && val < numberProperties.min) ||
        (!isNaN(numberProperties.max) && val > numberProperties.max)) {

        return false;
    }

    // if we need decimal formatting, run that on the last
    // chunk, then return the combination as a string
    var returnValue = '';

    if (!isNaN(numberProperties.decimals)) {
        for (var i = 0, length = splitVal.length; i < length; i++) {
            // return the segment for all but the last set
            if (i < length - 1) {
                returnValue += splitVal[i];
            } else {
                returnValue += parseFloat(splitVal[i]).toFixed(numberProperties.decimals) + '';
            }
        }
    } else {
        returnValue = val;
    }

    field.value = returnValue;

    return true;
};

Formstack.Form.prototype.checkFormatCreditCard = function(field) {

    var val = field.value.replace(/\D/g, '');
    var checksum   = 0;
    var multiplier = 1;

    field.value = val;

    /**
     * Verify that the CC number is matches a Luhn checksum.
     * http://en.wikipedia.org/wiki/Luhn_algorithm
     */
    for (var i = val.length - 1; i >= 0; i--) {

        var calc = parseInt(val.charAt(i)) * multiplier;

        checksum += (calc > 9) ? calc - 9 : calc;
        multiplier = multiplier == 1 ? 2 : 1;
    }

    if (checksum % 10 !== 0) {
        return false;
    }

    /**
     * Validate that the credit card type is valid.
     * Validation info from http://en.wikipedia.org/wiki/Credit_card_numbers
     */

    // Visa
    if (val.match(/^4/))
        return $(field).hasClass('fsAcceptVisa') && (val.length == 13 || val.length == 16);

    // MasterCard
    else if (val.match(/^(?:51|52|53|54|55)/))
        return $(field).hasClass('fsAcceptMasterCard') && val.length == 16;

    // Discover
    else if (val.match(/^(?:6011|622|64|65)/))
        return $(field).hasClass('fsAcceptDiscover') && val.length == 16;

    // Amex
    else if (val.match(/^(?:34|37)/))
        return $(field).hasClass('fsAcceptAmex') && val.length == 15;

    // Diners
    else if (val.match(/^(?:300|301|302|303|304|305|36|54|55)/))
        return $(field).hasClass('fsAcceptDiners') && (val.length == 14 || val.length == 16);

    // JCB
    else if (val.match(/^35/))
        return $(field).hasClass('fsAcceptJCB') && val.length == 16;

    else return false;

};


Formstack.Form.prototype.getNumberProperties = function(field) {

    var num = {
        min:      NaN,
        max:      NaN,
        decimals: NaN,
        currency: null,
        currencySymbol: null,
        currencyPrefix: null,
        currencySuffix: null
    };

    // Check classnames for min, max and decimal
    var classNames = field.className.split(/\s+/);
    for (var i = 0; i < classNames.length; i++) {

        var className = classNames[i];

        var match;

        if (match = className.match(/^fsNumberMin-([\-\d.]+)/)) {
            num.min = parseFloat(match[1]);
        }
        else if (match = className.match(/^fsNumberMax-([\-\d.]+)/)) {
            num.max = parseFloat(match[1]);
        }
        else if (match = className.match(/^fsNumberDecimals-([\d]+)/)) {
            num.decimals = parseInt(match[1]);
        }
        else if (match = className.match(/^fsNumberCurrency-([A-Z]+)/i)) {
            num.currency = match[1];
        }
    }

    if (num.currency) {
      // Try new currency support
      var currencyPrefix = document.getElementById(field.id + 'CurrencyPrefix');
      if (currencyPrefix) {
        num.currencyPrefix = currencyPrefix.innerHTML;
      }

      var currencySuffix = document.getElementById(field.id + 'CurrencySuffix');
      if (currencySuffix) {
        num.currencySuffix = currencySuffix.innerHTML;
      }

      // Fallback to old currency support
      if (num.currency === 'dollar') {
        num.currencySymbol = '$';
      } else if (num.currency === 'euro') {
        num.currencySymbol = '&euro;';
      } else if (num.currency === 'pound') {
        num.currencySymbol = '&pound;';
      } else if (num.currency === 'yen') {
        num.currencySymbol = '&#165;';
      } else if (num.currency === 'baht') {
        num.currencySymbol = '&#x0E3F;';
      } else if (num.currency === 'ils') {
        num.currencySymbol = '&#x20AA;';
      } else if (num.currency === 'krone') {
        num.currencySymbol = 'kr';
      } else if (num.currency === 'lira') {
        num.currencySymbol = '&#x20BA;';
      } else if (num.currency === 'ruble') {
        num.currencySymbol = '&#x20BD;';
      } else if (num.currency === 'yuan') {
        num.currencySymbol = '&#x5143;';
      } else if (num.currency === 'zloty') {
        num.currencySymbol = 'z&#x0142;';
      }
    }

    return num;
};

Formstack.Form.prototype.generatePrePopulateLink = function() {

    var link = document.location.href;

    link = link.replace('&admin_tools', '');

    if (link.indexOf('?') < 0)
        link += '?';

    var fields = $('.fsField');
    for (var i = 0; i < fields.length; i++) {

        var field = fields[i];

        if ($(field).hasClass('fsFormatCreditCard')) continue;

        var val = this.getValue(field);

        if (val === null || val === '') {
            continue;
        }

        name = field.name !== null? field.name : field.id;
        link += '&' + name + '=' + encodeURIComponent(val);
    }

    document.getElementById('form' + this.id + 'PrePopulateLink').value = link;
    document.getElementById('form' + this.id + 'PrePopulateDiv').style.display = 'block';

};

Formstack.Form.prototype.getValue = function(input) {

    if (input.disabled) {

        return null;
    }
    else if (input.type == 'radio' || input.type == 'checkbox') {

        return input.checked ? input.value : null;
    }
    else if (input.type == 'select-one') {

        return input.options[input.selectedIndex].value;

    }
    else return input.value;

};

/********************************
 * set the value of a field
 * @param id - the field id
 * @param value - the value you want to set
 ********************************/
Formstack.Form.prototype.setValue = function(id, value) {

    var fields = this.getFields(id, true);
    var lines = value.split("\n");
    var dateValue = null;

    // No matter the configuration of the date field, it should at least have the calendar icon
    // or an Hour field
    var calendar = document.getElementById('fsCalendar' + id);
    var hourField = document.getElementById('field' + id + 'H');

    if ((calendar || hourField) && !$.isNumeric(value)) {
        dateValue = new Date(value);

        if (isNaN(dateValue.getTime())) {
            dateValue = null;
        }
    }

    if (fields.length === 0) {

        //text fields with sub-fields (name, address)
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf(' = ') > 0) {

                var parts = line.split(' = ');
                var field = document.getElementById('field' + id + '-' + parts[0]);

                if (field !== null) {
                    field.value = parts[1];
                }

            }
        }

    } else {

        for (var i = 0; i < fields.length; i++) {

            var input = fields[i];

            // Don't try to prefill File or Signature Fields
            if (input.type === 'file' || jQuery('#signature' + id).length) {
              continue;
            }

            if (input.type == 'radio' || input.type == 'checkbox') {

                if (lines.length > 1) {

                    for (var j = 0; j < lines.length; j++ ) {
                        var line = lines[j].split(' | ');
                        if (line[0] == input.value) {
                            input.checked = true;
                        }
                    }

                } else {
                    if (input.value == lines[0]) {
                        input.checked = true;
                    }
                }

            } else if (input.type == 'select-multiple' || input.type == 'select-one') {

                if (lines.length > 1) {

                    for (var j = 0; j < lines.length; j++ ) {

                        for (var k = 0; k < input.options.length; k++) {
                            var line = lines[j].split(' | ');
                            if (line[0] == input.options[k].value) {
                                input.options[k].selected = true;
                            }
                        }
                    }

                } else if (dateValue !== null) {
                    var fieldId = 'field' + id;
                    var datePiece = input.id.substring(fieldId.length);
                    var options = input.options;
                    var sampleItem = options[options.length - 1];
                    var sampleValue = sampleItem.value;
                    var index = null;
                    var value = null;

                    switch (datePiece) {
                        case 'M':
                            index = dateValue.getMonth() + 1;
                            break;
                        case 'D':
                            index = dateValue.getDate();
                            break;
                        case 'Y':
                            var year = dateValue.getFullYear();
                            var sampleString = new String(sampleValue);

                            if (sampleString.length === 4) {
                                value = year;
                            } else if (sampleString.length === 2) {
                                value = new String(year).substring(2);
                            }
                            break;
                        case 'H':
                            var twentyFourHour = input.length > 13;
                            var hour = dateValue.getHours();
                            var value = hour;
                            var flag = 'am';
                            var flagField = document.getElementById(fieldId + 'A');
                            if (!twentyFourHour) {
                                if (value > 12) {
                                    value = hour - 12;
                                    flag = 'pm';
                                } else if (value === 0) {
                                    value = 12;
                                } else if (value === 12) {
                                    flag = 'pm';
                                }

                                if (flagField) {
                                    if (flag === 'am') {
                                        flagField.options[1].selected = true;
                                    } else if (flag === 'pm') {
                                        flagField.options[2].selected = true;
                                    }
                                }
                            }
                            break;
                        case 'I':
                            var index = dateValue.getMinutes() + 1;
                            break;
                        case 'S':
                            var index = dateValue.getSeconds() + 1;
                            break;
                        default:
                            break;
                    }

                    if (index !== null) {
                        options[index].selected = true;
                    } else if (value !== null) {
                        for (var j = 0; j < input.options.length; j++) {
                            if (value == input.options[j].value) {
                                input.options[j].selected = true;
                            }
                        }
                    }
                } else {
                    for (var j = 0; j < input.options.length; j++) {
                        if (lines[0] == input.options[j].value) {
                            input.options[j].selected = true;
                        }
                    }
                }


            } else {

                input.value = value;

            }
        }
    }
};

/********************************
 *
 * @param field
 * @param value
 * @param checked
 ********************************/
Formstack.Form.prototype.setFieldValue = function (field, value, checked) {
    // Try not to fail hard when AutoFill is poorly mapped:
    if (field === null) {
        return;
    }

    if (field.type === 'radio' || field.type === 'checkbox') {
        field.checked = checked;
    } else {
        field.value = value;
    }
    // Manually trigger change for logic
    $(field).trigger('change');
};

/*************************************
 * prefill a form from a json input
 * @param json - json string of the values [id, value]
 ************************************/
Formstack.Form.prototype.prefill = function(json) {

    for (var i = 0; i < json.length; i++) {
        this.setValue(json[i].id, json[i].value);
    }

};

Formstack.Form.prototype.copyFieldValue = function(from, to) {
    var fields = $('.fsField');

    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];

        if (field.id.indexOf('field' + from) > -1) {
            var ext = field.id.replace('field' + from, '');
            var fieldTo =  document.getElementById('field' + to) || document.getElementById('field' + to + ext);
            this.setFieldValue(fieldTo, field.value, field.checked);
        }
    }
};

/**
 * Determine location based on navigator.geolocation
 */
Formstack.Form.prototype.determineLocation = function() {
    if (navigator.geolocation) {
        try {
            navigator.geolocation.watchPosition(function(position) {
                $('input[name="latitude"]').val(position.coords.latitude);
                $('input[name="longitude"]').val(position.coords.longitude);
            }, function(error) {
                // Nothing
            },{
                enableHighAccuracy: true,
                maximumAge: 60000,
                timeout: 10000
            });
        } catch(err) {
            // Nothing
        }
    }
};

Formstack.Form.prototype.toggleValidation = function(link) {
    if (this.validate) {
        this.validate = false;
        $(link).html('Turn On Validation');
        document.getElementById('fsSubmitButton' + this.id).disabled = true;
    } else {
        this.validate = true;
        $(link).html('Turn Off Validation');
        document.getElementById('fsSubmitButton' + this.id).disabled = false;
    }
};

/**
 *  JSONP callback for a successful submission.
 */
Formstack.Form.prototype.onPostSubmit = function(response) {
    if (response.message === null || response.message === '') {
        response.message = 'Thank You!';
    }

    var html = '<div align="center" style="font-size:16px;font-weight:bold;padding:25px;">';
    html += response.message;
    html += '</div><br />';
    $('#fsForm' + this.id).html(html);
    this.emitSubmitMessage();
};

/**
 * If an error occurs during a submission and JSONP is being used,
 * this method will be called.
 */
Formstack.Form.prototype.onSubmitError = function(response) {

    if (response.error) {
        this.showError(response.error);
    }
};

/**
 * Selects the first field that has a validation error
 * for 508 Compliance
 */
Formstack.Form.prototype.focusFirstError = function() {
    var first = $('.fsValidationError').first();
    if (!first) {
        return;
    }

    var firstAriaInvalid = first.find('[aria-invalid="true"]').first();
    if (firstAriaInvalid) {
      // Doing this due to discussion in this SO post:
      // http://stackoverflow.com/questions/17384464/jquery-focus-not-working-in-chrome
      setTimeout(function() {
          firstAriaInvalid.focus();
        }, 1
      );
    } else {
      var id = $(first).attr('id').replace('fsCell', '');
      // Doing this due to discussion in this SO post:
      // http://stackoverflow.com/questions/17384464/jquery-focus-not-working-in-chrome
      setTimeout(function() {
          $('#field' + id).focus();
        }, 1
      );
    }
};

/**
 * Submits the form via JSONP
 */
Formstack.Form.prototype.jsonpSubmit = function() {

    var form = document.getElementById('fsForm' + this.id);
    var callback = 'form' + this.id + '.onPostSubmit';

    var script = document.createElement('script');
    script.src = form.action + '?jsonp&' + $(form).serialize() + '&nocache=' + (new Date()).getTime();
    form.parentNode.insertBefore(script, form);

    return false;

};

Formstack.Form.prototype.changePage = function(currentPageIndex, targetPageIndex) {
  var idPrefix = 'fsPage' + this.id + '-';
  var currentPage = document.getElementById(idPrefix + currentPageIndex);
  var newPage = document.getElementById(idPrefix + targetPageIndex);
  var direction = null;

  if (targetPageIndex > currentPageIndex) {
    direction = 'forward';
  } else if (targetPageIndex < currentPageIndex) {
    direction = 'reverse';
  }

  this.currentPage = targetPageIndex;
  this.updateProgress(this.currentPage);

  if (this.currentPage == this.pages || this.isLastPage(this.currentPage)) {
    if (this.plugins.confirmationPage !== null && typeof this.plugins.confirmationPage !== 'undefined') {
        this.plugins.confirmationPage.parsePage();
    }

    $('#fsCaptcha' + this.id).show();
    $('#fsSubmitButton' + this.id).show();
    $('#fsNextButton' + this.id).hide();
  } else if (this.currentPage == 1) {
    $('#fsPreviousButton' + this.id).hide();
  } else {
    $('#fsSaveIncomplete' + this.id).show();
  }

  if (direction === 'reverse') {
    // Make sure we hide anything that only displays on the last page
    $('#fsCaptcha' + this.id).hide();
    $('#fsSubmitButton' + this.id).hide();
  }

  var scope = this;
  this.disableNavigation = true;
  $(currentPage).fadeOut(200, function() {
    scope.disableNavigation = false;
    $(currentPage).addClass('fsHiddenPage');
    if (!scope.skipPageValidation || direction === 'forward') {
      $('.fsError').hide();
    }

    if (direction === 'reverse') {
      $('#fsNextButton' + scope.id).show();
    } else if (direction === 'forward') {
      $('#fsPreviousButton' + scope.id).show();
    }

    $(newPage).removeClass('fsHiddenPage');
    $(newPage).show();

    if (direction === 'forward') {
      var signatures = $(newPage).find('.fsSignature');

      for (var i = 0; i < signatures.length; i++) {
        if (scope.isSurvey()) {
          $(signatures[i]).empty();
          $(signatures[i]).jSignature({ sizeRatio: scope.getJSignatureRatio() });
        } else {
          if ($(signatures[i]).height() <= 40) {
            $(signatures[i]).empty();
            $(signatures[i]).jSignature();
          }
        }
      }
    }

    if (direction === 'reverse') {
      scope.form.trigger('form:prev-page', scope.currentPage);
    } else if (direction === 'forward') {
      scope.form.trigger('form:next-page', scope.currentPage);
    }

    // when the page changes, we need to assign focus to the first valid field on that page
    // First blur the previous question
    document.activeElement.blur();

    // Focus the next question.
    $(newPage).find('input,textarea,select').filter(':visible:enabled:not([readonly])').first().focus();
  });
};

// Check if device is touchable without the need to depend on Modernizr.
Formstack.Form.prototype.isTouchable = function(onlyRequired) {
  var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
  var mq = function(query) {
    return window.matchMedia(query).matches;
  }

  if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
    return true;
  }

  // include the 'heartz' as a way to have a non matching MQ to help terminate the join
  // https://git.io/vznFH
  var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
  return mq(query);
}

Formstack.Form.prototype.getIncompleteFields = function(onlyRequired) {
  var selector = '#fsForm' + this.id + ' .fsField';

  if (onlyRequired === true) {
    selector += '.fsRequired';
  }

  selector += ':not([disabled])';

  var fields = $(selector);
  var incomplete = [];

  var fieldsLength = fields.length;
  for (var i = 0; i < fieldsLength; i++ ) {
    if (!this.checkRequired(fields[i], false, true)) {
      var id = this.getFieldId(fields[i].id);

      incomplete.push({
        id: id,
        field: fields[i]
      });
    }
  }

  return incomplete;
};

Formstack.Form.prototype.enableLogicEvents = function() {
  this.fireLogicEvents = true;
};

/**
 * Launch a new UIL-style modal on the form side, and attach all
 * of the appropriate handlers.
 *
 * @param object   settings        The config settings for the dialog.
 * @param function cb              The callback to initiate on success.
 * @param boolean  closeOnComplete Should the dialog close when the
 *                                 complete button is pressed.
 */
Formstack.Form.prototype.launchDialog = function(settings, cb, closeOnComplete) {
  // find the dialog
  var dialog = document.querySelector('.fs-form-dialog');

  // if there is no dialog, show a fallback browser prompt
  // and run the associated callback
  if (!dialog) {
    var userInput;

    // if there are goodies, then we need a prompt
    // otherwise, a standard confirmation
    if (settings.goodies) {
      userInput = prompt(settings.message);
    } else {
      userInput = confirm(settings.message);
    }

    if (!userInput) {
      return;
    }

    // prompts can only handle one input, so we need
    // to take the first goodie and handle that
    if (settings.goodies) {
      var goodieKey   = settings.goodies[0],
          goodieValue = userInput;

      userInput            = {};
      userInput[goodieKey] = goodieValue;
    }

    cb.apply(this, [userInput]);

    return;
  }

  // show any goodies that are requested
  if (settings.goodies && settings.goodies.length) {
    for (var i = 0, length = settings.goodies.length; i < length; i++) {
      var goodie = dialog.querySelector('.fs-form-dialog__' + settings.goodies[i]);

      goodie.className = goodie.className.replace(' fs-form-dialog--hidden', '');
    }
  }

  var key, element;

  // set the content to the dialog
  for (key in settings) {
    if (!settings.hasOwnProperty(key) || key === 'goodies') {
      continue;
    }

    element = dialog.querySelector('.fs-form-dialog__' + key);

    if (element) {
      // the buttons also need their titles changed
      // and will have different elements that need a text change
      if (key === 'cancel' || key === 'confirm') {
        element.setAttribute('title', settings[key]);

        var buttonText = element.querySelector('.fs-form-dialog__button-text');

        if (buttonText) {
          buttonText.innerHTML = settings[key];
        }
      } else {
        element.innerHTML = settings[key];
      }
    }
  }

  // create the confirm and cancel events
  var confirmFunction = function(e) {
    if (e) {
      e.preventDefault ? e.preventDefault() : e.returnValue = false;
    }

    // grab any goodie values from the dialog and send them to the callback
    var values = {};

    if (settings.goodies && settings.goodies.length) {
      for (var i = 0, length = settings.goodies.length; i < length; i++) {
        var goodie = dialog.querySelector('.fs-form-dialog__' + settings.goodies[i]);

        values[settings.goodies[i]] = goodie.value;
      }
    }

    cb.apply(this, [values]);

    if (closeOnComplete) {
      cancelFunction();
    }
  }.bind(this);

  var cancelFunction = function(e) {
    if (e) {
      e.preventDefault ? e.preventDefault() : e.returnValue = false;
    }

    this.closeDialog(settings.goodies, cancelFunction, confirmFunction);
  }.bind(this);

  // find and attach to the buttons
  var cancelButton  = dialog.querySelector('.fs-form-dialog__cancel'),
      confirmButton = dialog.querySelector('.fs-form-dialog__confirm');

  Formstack.Util.addEvent('click', cancelButton, cancelFunction);
  Formstack.Util.addEvent('click', confirmButton, confirmFunction);

  // show the dialog
  dialog.className = dialog.className.replace(' fs-form-dialog--hidden', '');
};

/**
 * Close and reset the dialog that was launched.
 *
 * @param array    goodies         The goodies that we need to hide.
 * @param function cancelFunction  The callback function to remove from the cancel button.
 * @param function confirmFunction The callback function to remove from the confirm button.
 */
Formstack.Form.prototype.closeDialog = function(goodies, cancelFunction, confirmFunction) {
  // find the dialog
  var dialog = document.querySelector('.fs-form-dialog');

  // bail if there isn't a dialog for whatever reason
  if (!dialog) {
    return;
  }

  // animate out the dialog
  dialog.className += ' fs-ngdialog-closing';

  setTimeout(function() {
    // followed by hiding it
    if (!dialog.className.match('fs-form-dialog--hidden')) {
      dialog.className += ' fs-form-dialog--hidden';
    }

    dialog.className = dialog.className.replace(' fs-ngdialog-closing', '');

    // hide any goodies that were requested
    // so we start with a blank slate
    if (goodies && goodies.length) {
      for (var i = 0, length = goodies.length; i < length; i++) {
        var goodie = dialog.querySelector('.fs-form-dialog__' + goodies[i]);

        goodie.className += ' fs-form-dialog--hidden';
      }
    }
  }, 550);

  // unbind the buttons
  var cancelButton  = dialog.querySelector('.fs-form-dialog__cancel'),
      confirmButton = dialog.querySelector('.fs-form-dialog__confirm');

  Formstack.Util.removeEvent('click', cancelButton, cancelFunction);
  Formstack.Util.removeEvent('click', confirmButton, confirmFunction);
};

/**
 *  The Formstack.IOS  namespace includes JavaScript functions that are called from the iOS apps
 *  that allows us to communicate to a form Objective C
 */
Formstack.IOS = {};

/**
 * Return the CGRect of an item on the page.
 * http://stackoverflow.com/questions/7514648/how-to-get-coordinates-cgrect-for-the-selected-text-in-uiwebview
 */
Formstack.IOS.getRectById = function(id) {

    var element = document.getElementById(id);
    if (element) {
        var rect = element.getBoundingClientRect();
        // COA: Separated double "{" to fix Handlebar template compilation
        return "{" + "{" + rect.left + "," + rect.top + "}, {" + rect.width + "," + rect.height + "}" + "}";
    }
    else return null;
};

/**
 * Set a base64 encoded jpeg as a file upload
 */
Formstack.IOS.base64EncodedUpload = function(id, imageData) {
    var input  = document.getElementById('field' + id);
    var button = document.getElementById('field' + id + '-ios-button');

    if (!input) {return 0;}

    if (button) button.innerHTML = 'Change file';
    input.value = imageData;

    var img = document.getElementById('field' + id + 'Preview');
    img.src = 'data:image/jpeg;base64,' + imageData;
    return 1;
};

/**
 * Triggers the iOS file upload functionality by doing a
 * redirect to a "ios://" url.
 */
Formstack.IOS.fileUpload = function(id) {

    var url =  'ios://fileupload/' + id;
    window.location = url;
};

/**
 * Triggers Card.IO scanning for credit card fields
 *
 * @param integer id Field ID
 *
 * @return boolean
 */
Formstack.IOS.scanCreditCard = function(id) {

    var url =  'ios://scancreditcard/' + id;
    window.location = url;
};

/**
 * Populates the credit card field with the scanned
 * credit card.
 *
 * @param integer id Field ID
 * @param string creditCard Credit Card Number
 *
 * @return boolean
 */
Formstack.IOS.onCreditCard = function(id, creditCard) {
    var field = document.getElementById('field' + id);
    if (!field) {
        return false;
    }

    field.value = creditCard;
};

/**
 * The Formstack.Android namespace includes JavaScript functions
 * that are called from the Android apps that allows us to communicate
 * with a form using Java.
 */
Formstack.Android = {};

/**
 * Triggers Card.IO scanning for credit card fields
 *
 * @param integer id Field ID
 *
 * @return boolean
 */
Formstack.Android.scanCreditCard = function(id) {
    if (!window.formstackAndroidInterface) {
        return false;
    }

    window.formstackAndroidInterface.onScanCreditcard(id);
};

/**
 * Populates the credit card field with the scanned
 * credit card.
 *
 * @param integer id Field ID
 * @param string creditCard Credit Card Number
 *
 * @return boolean
 */
Formstack.Android.onCreditCard = function(id, creditCard) {
    var field = document.getElementById('field' + id);
    if (!field) {
        return false;
    }

    field.value = creditCard;
};

/*
Formstack.Offline = {
    STATE_ONLINE: 0,
    STATE_OFFLINE: 1,
    state: 0
};


Formstack.Offline.init = function() {
    $(window).bind('offline', function(e) {
        Formstack.Offline.state = Formstack.Offline.STATE_OFFLINE;
    });

    $(window).bind('online', function(e) {
        Formstack.Offline.state = Formstack.Offline.STATE_ONLINE;
        Formstack.Offline.processSubmissions();
    });

    if (window.applicationCache) {
        window.applicationCache.addEventListener('error', function(e) {
            Formstack.Offline.state = Formstack.Offline.STATE_OFFLINE;
        });
    }

    // Initial Update of Offline Status
    Formstack.Offline.checkStatus();

    // Add Check for Pending Submission Data
    Formstack.Offline.checkPending();
};

Formstack.Offline.submit = function(config) {
    Formstack.Offline.state = Formstack.Offline.STATE_OFFLINE;
    $.get('index.php', function(data) {
        Formstack.Offline.state = Formstack.Offline.STATE_ONLINE;
    });
};

Formstack.Offline.checkStatus = function() {
    Formstack.Offline.state = Formstack.Offline.STATE_OFFLINE;
    $.get('index.php', function(data) {
        Formstack.Offline.state = Formstack.Offline.STATE_ONLINE;
    });
};

Formstack.Offline.checkPending = function() {
    if (Formstack.Offline.state == Formstack.Offline.STATE_ONLINE) {
        Formstack.Offline.processSubmissions();
    }
};

Formstack.Offline.storeSubmission = function(data) {

    if (!window.localStorage) {
        return false;
    }

    // Check for Submissions
    var submissions = [];

    var submissionsJSON = window.localStorage.getItem('submissions');
    if (submissionsJSON) {
        try {
            submissions = JSON.parse(submissionsJSON);
        } catch(e) {
            // Nothing
        }
    }

    submissions.push(data);

    submissionsJSON = JSON.stringify(submissions);

    try {
        window.localStorage.setItem('submissions', submissionsJSON);
    } catch(e) {
        return false;
    }

    return true;
};

Formstack.Offline.processSubmissions = function() {
    if (!window.localStorage) {
        return false;
    }

    // Check for Submissions
    var submissionsJSON = window.localStorage.getItem('submissions');
    if (!submissionsJSON) {
        return false;
    }

    // Send submissions to Formstack
    $.post("/", {
        submissions: submissions
    }, function() {
        // Clear storage for local submissions
        window.localStorage.removeItem('submissions');
    });

    // Be sure to encrypt everything to make storing sensitive data (CC, etc) possible
};
*/

Formstack.Util = {

    lcFirst : function(str) {return str[0].toLowerCase() + str.slice(1);}
};

Formstack.Util.checkAll = function(e) {
    var el = e.target;
    var allInput = $(el);
    var checkboxes = $('[name="field' + allInput.attr('fs-data-field-id') + '[]"]');
    checkboxes.prop('checked', el.checked);
    checkboxes.trigger('change');
};

Formstack.Util.scrollTo = function(el) {

    //var p = $(el).position();
    var p = $(el).offset();
    var marginTop = $(el).css('margin-top');
    var marginLeft = $(el).css('margin-left');
    marginTop = Number(marginTop.replace('px', ''));
    marginLeft = Number(marginLeft.replace('px', ''));
    window.scroll(p.left - marginLeft, p.top - marginTop);
    //window.scroll(p.left, p.top);
};

Formstack.Util.getHeight = function(el) {

    var height = $(el).height();
    return isNaN(height) ? 0 : height;
};

Formstack.Util.getWidth = function(el) {

    var width = $(el).width();
    return isNaN(width) ? 0 : width;
};

/**
 * Gets today's date with time components reset to zero.
 *
 * @return {date}
 */
Formstack.Util.getStartOfCurrentDate = function() {
  var date = new Date();
  date.setHours(0, 0, 0, 0);

  return date;
};

Formstack.Util.setDate = function(field) {
    var nowDate = new Date();

    var yearField = document.getElementById('field' + field + 'Y');
    if (yearField) {
        var yearLength = yearField.options[1].value.length;
        var year = nowDate.getFullYear().toString();

        yearField.value = year.substring(4 - yearLength);
    }

    var monthField = document.getElementById('field' + field + 'M');
    if (monthField) {
        monthField.selectedIndex = nowDate.getMonth() + 1;
    }

    var dayField = document.getElementById('field' + field + 'D');
    if (dayField) {
        var day = nowDate.getDate();
        dayField.value = (day < 10) ? '0' + day : day;
    }
};

Formstack.Util.setTime = function (field) {
  var nowDate = new Date();

  var hour = nowDate.getHours(); //.getHours() returns military time

  var hourField = document.getElementById('field' + field + 'H');
  if (hourField) {
      var tmpHour = hour;
      // if its 12-hour clock and hour is in pm, subtract 12
      if (hourField.options.length <= 13 && hour > 12) {
          tmpHour = tmpHour - 12;
      }
      // If the time is 00:00am to 00:59am convert it to 12:00am
      if (tmpHour == 0) {
          tmpHour = 12;
      // otherwise convert 8:00am to 08:00am
      } else if (tmpHour < 10) {
          tmpHour = '0' + tmpHour;
      }
      hourField.value = tmpHour;
  }

  var minutesField = document.getElementById('field' + field + 'I');
  if (minutesField) {
    var minutes = nowDate.getMinutes();
    minutesField.value = (minutes < 10) ? '0' + minutes : minutes;
  }

  var secondsField = document.getElementById('field' + field + 'S');
  if (secondsField) {
    var seconds = nowDate.getSeconds();
    secondsField.value = (seconds < 10) ? '0' + seconds : seconds;
  }

  var ampmField = document.getElementById('field' + field + 'A');
  if (ampmField) {
    ampmField.selectedIndex = (hour < 12 ? 1 : 2);
  }
};

/**
 * Formats a number into a string with a currency,
 * commas, and a decimal.
 *
 * It should be noted that Number fields don't play
 * well with non-numeric characters so this should
 * only be used for display values, not input values.
 *
 * @param object num Number Properties
 * @param number num Number Value
 *
 * @return string Formatted Number
 */
Formstack.Util.formatNumber = function(num, value) {
    // Handle Decimals
    if (!isNaN(num.decimals)) {
        value = parseFloat(value);
        value = value.toFixed(num.decimals);
    }

    // Handle Commas
    while (/(\d+)(\d{3})/.test(value.toString())) {
        value = value.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }

    // Handle Currency
    var currencyPrefix = null;
    var currencySuffix = null;

    if (num.currency) {
        if (num.currencySymbol) {
            // Fallback to old currency support
            currencyPrefix = num.currencySymbol;
        }

        if (num.currencyPrefix) {
            currencyPrefix = num.currencyPrefix;
        }

        if (num.currencySuffix) {
            currencySuffix = num.currencySuffix;
        }
    }

    if (currencyPrefix) {
        value = currencyPrefix + value;
    }

    if (currencySuffix) {
        value += currencySuffix;
    }

    return value;
};

/**
 * Take the given month string and return the appropriate integer. This will work
 * with alternate translations, because we're presenting the values in english.
 *
 * @param string month The month to check against.
 *
 * @returns integer An integer corresponding to the month, or 0.
 */
Formstack.Util.monthToInt = function(month) {
  // if it's already an integer, return it
  if (isFinite(month)) {
    return parseInt(month);
  }

  var map = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec'
  ];

  var modifiedMonth = month.substr(0, 3).toLowerCase(),
      index         = map.indexOf(modifiedMonth);

  if (index > -1) {
    return index + 1;
  }

  return 0;
};

Formstack.Util.Loader = function() {
  this.loading = {};
};

Formstack.Util.Loader.prototype.load = function(src, success) {
  if (this.loading[src]) {
    this.loading[src].success.push(success);
  } else {
    this.loading[src] = {
      success: [success]
    };

    var head = document.getElementsByTagName('head')[0] || document.documentElement;

    var script = document.createElement('script');
    script.src = src;

    var loaded = false;
    script.onload = script.onreadystatechange = $.proxy(function() {
      if (loaded || (script.readyState && script.readyState !== 'loaded' && script.readyState !== 'complete')) {
        return;
      }

      loaded = true;

      // Remove the event handlers for IE
      script.onload = script.onreadystatechange = null;
      this.success(src);
    }, this);

    head.insertBefore(script, head.firstChild);
  }
};

Formstack.Util.Loader.prototype.success = function(src) {
  if (!this.loading[src]) {
    return;
  }

  if (!this.loading[src].success || !this.loading[src].success.length) {
    delete this.loading[src];
    return;
  }

  var callbacks = this.loading[src].success;
  var callbacksLength = callbacks.length;

  for (var i = 0; i < callbacksLength; i++) {
    if (callbacks[i] && typeof callbacks[i] === 'function') {
      callbacks[i]();
    }
  }

  delete this.loading[src];
};

Formstack.Util.addEvent = function(evt, elem, cb) {
  if (elem.addEventListener) {
    elem.addEventListener(evt, cb, false);
  } else if (elem.attachEvent) {
    elem.attachEvent("on" + evt, cb);
  }
};

Formstack.Util.removeEvent = function(evt, elem, cb) {
  if (elem.addEventListener) {
    elem.removeEventListener(evt, cb, false);
  } else if (elem.attachEvent) {
    elem.detachEvent("on" + evt, cb);
  }
};

Formstack.Form.prototype._applyRequiredFieldValidation = function (fieldContainer) {
    var passedRequired = true;
    var jelFieldCell = $(fieldContainer);
    var fields = jelFieldCell.find('.fsRequired');
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var matrixFieldset = $(field).parents('.fsMatrixFieldset');
        var isMatrix = typeof matrixFieldset[0] !== 'undefined';
        var matrixDisabled = isMatrix && $(matrixFieldset[0]).attr('disabled') === 'disabled';
        if (field.disabled || matrixDisabled) {
            break;
        }

        /* passedRequired should remain false if it gets set to false, but checkRequired on each field is necessary to
        * set proper attributes on every field as a side effect of the check*/
        passedRequired = this.checkRequired(field) && passedRequired;
        if (!passedRequired && !this.hasAlreadyFailedValidation(field)) {
            this.failedContainers.push(fieldContainer);
        }

        if (!this.hasAlreadyFailedValidation(field)) {
            var containerField = this.getFieldContainer(field);
            var containerIndex = this.failedContainers.indexOf(containerField);
            if (containerIndex !== -1) {
                this.failedContainers.splice(containerIndex, 1);
            }
        }

        // PAP - for performance matrices only validate the first field
        var fieldType = jelFieldCell.attr('fs-field-type');
        if (isMatrix || fieldType === 'checkbox' || fieldType === 'radio') {
              break;
        }
    }

    // If the container failed validation, tag it as such.
    if (!passedRequired) {
      $(fieldContainer).addClass('fsValidationError');
    }

    return passedRequired;
};

// Expose Formstack to the global object.
window.Formstack = Formstack;
window.Formstack.Util.Loader = new Formstack.Util.Loader();

// add trim support to vanilla javascript:
// http://stackoverflow.com/a/29001502/2008014
if (!String.prototype.trim) {
  (function() {
    // Make sure we trim BOM and NBSP
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function() {
      return this.replace(rtrim, '');
    };
  })();
}

})(window, jQuery);
