import $ from 'jquery';
import confetti from 'canvas-confetti';
import 'jquery-validation';
import toastr from 'toastr';

import 'toastr/build/toastr.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

class FunnelSlider {

	constructor() {
		// check if the testFunnel element exists on the page
		if ($('#seFunnel').length) {
			this.hostUrl = se_funnel_js.site_url;
			this.funnelApi = this.hostUrl + '/wp-json/funnel-docks/v1';
			this.funnelData = funnel_json;

			this.firstSlide = $('#seFunnel');

			this.currentSlideData;
			this.previousSlideData;

			this.toastrArray = [];
			this.validator = $.validator;

			this.funnelScroll;
			this.currentSlide;
			this.triggerNext;
			this.triggerBack;
			this.answers;
			this.uploadedFiles;
			this.conditionalAnswers;
			this.optInData;
			this.nextSlideClass;
			this.multiselectClass;
			this.multiselectValues;
			this.slideHeaderAppended;
			this.nextBtn;
			this.sendBtn;
			this.nextBtnAdded;
			this.shakeClass;
			this.shakeAnim;

			this.googleSendStartFunnel;
			this.googleSendOptIn;
			this.googleSendThankYou;

			this.initFunnel();
		}
	}

	// initialize the slider
	initFunnel() {
		this.currentSlide = 0;
		this.triggerNext = 'next';
		this.triggerBack = 'back';
		this.answers = {};
		this.uploadedFiles = {};
		this.conditionalAnswers = {};
		this.optInData = {};
		this.nextSlideClass = 'next-slide-trigger';
		this.multiselectClass = 'multiselect-option';
		this.multiselectValues = [];
		this.slideHeaderAppended = false;
		this.shakeClass = 'shake';
		this.shakeAnim = 'shake shake-anim';
		this.nextBtn = `<a class="slider__button--next funnel-btn-primary next-slide-trigger cursor-pointer">Weiter</a>`;
		this.sendBtn = `<a class="slider__button--next funnel-btn-primary next-slide-trigger cursor-pointer">Absenden</a>`;
		this.nextBtnAdded = false;
		this.sendBtnAdded = false;

		// scroll position = section of first slide
		this.funnelScroll = this.firstSlide.closest('section').offset().top;

		// kick off the funnel
		this.startFunnel(this.triggerNext);

		// add event listeners
		this.events();
	}

	events() {
		$(document).on('click', '.' + this.nextSlideClass, this.startFunnel.bind(this));
		$(document).on('click', '.' + this.multiselectClass, this.multiselectAddOption.bind(this));
		$(document).on('keyup', '.slide__input', this.inputAddNextBtn.bind(this));

		// if enter is pressed in input field, do nothing
		$(document).on('keypress', '.slide__input', (e) => {
			if (e.which === 13) {
				e.preventDefault();
			}
		});

		$(document).on('click', '.slider__button--abort', this.previousSlide.bind(this));
		$(document).on('click', '.slide__gdpr-box', this.tickCheckbox.bind(this));

		if (this.currentSlide === 1) {
			this.addShakeAnimations();
		}

		// click animations for img elements
		$(document).on('mousedown', '.anim-lg', (e) => {
			if (e.target.tagName === 'IMG') {
				e.preventDefault();
			}

			$(e.target).closest('.anim-lg').removeClass('anim-lg-end');
			$(e.target).closest('.anim-lg').addClass('anim-lg-start');
		});

		$(document).on('mouseup', () => {
			$('.anim-lg').removeClass('anim-lg-start');
			$('.anim-lg').addClass('anim-lg-end');
		});

		// click animations for text select elements
		$(document).on('mousedown', '.anim-sm', (e) => {
			$(e.target).closest('.anim-sm').removeClass('anim-sm-end');
			$(e.target).closest('.anim-sm').addClass('anim-sm-start');
		});
		$(document).on('mouseup', () => {
			$('.anim-sm').removeClass('anim-sm-start');
			$('.anim-sm').addClass('anim-sm-end');
		});

		// file upload, add the next btn
		$(document).on('change', '.slide__input[type="file"]', this.fileInputChange.bind(this));
		$(document).on('click', '.manual-entry-button', this.showManualEntrySlide.bind(this));
	}

	/**
	 * Init form validation, rules and error messages
	 */
	initFunnelValidator() {
		$('#funnel-form').validate({
			focusInvalid: false,

			errorClass: 'error',

			errorPlacement: function (error, element) {
				if (element.attr("name") === "input_gdpr") {
					error.insertAfter(element.closest(".slide__gdpr-box"));
				} else {
					if (element.attr("name") === "input_stromverbrauch") {
						error.addClass("error-fix-width");
					}
					error.insertAfter(element);
				}
			},

			invalidHandler: function (form, validator) {

				if (!validator.numberOfInvalids()) {
					return;
				}

				$('html, body').animate({
					scrollTop: $(validator.errorList[0].element).offset().top - 200
				}, 300);

			},

			rules: {
				"input_vorname": {
					required: true
				},
				"input_nachname": {
					required: true
				},
				"input_email": {
					required: true,
					email: true
				},
				"input_telefon": {
					required: true,
					digits: true
				},
				"input_gdpr": {
					required: true,
				},
				"Heilmittel": {
					required: true
				},
				"Datum des Heilmittels": {
					required: true
				},
				"Anzahl der Therapien": {
					required: true
				}
			},

			messages: {
				input_vorname: {
					required: "Bitte geben Sie Ihren Vornamen ein"
				},
				input_nachname: {
					required: "Bitte geben Sie Ihren Nachnamen ein"
				},
				input_plz: {
					required: "Bitte geben Sie ihre Postleitzahl ein",
					digits: "Bitte geben Sie eine gültige Postleitzahl ein",
					minlength: "Bitte geben Sie eine gültige Postleitzahl ein",
					maxlength: "Bitte geben Sie eine gültige Postleitzahl ein"
				},
				input_stromverbrauch: {
					required: "Bitte geben Sie Ihren ungefähren Stromverbrauch ein oder wählen Sie alternativ unten Ihre Situation aus",
					digits: "Der Stromverbrauch muss eine Zahl sein"
				},
				input_email: {
					required: "Bitte geben Sie Ihre E-Mail-Adresse ein",
					email: "Bitte geben Sie eine gültige E-Mail-Adresse ein"
				},
				input_telefon: {
					required: "Bitte geben Sie Ihre Telefonnummer ein",
					digits: "Bitte geben Sie eine gültige Telefonnummer ein"
				},
				input_gdpr: {
					required: "Bitte akzeptieren Sie die Datenschutzbestimmungen"
				}
			}
		});

		// Overwrite default error messages
		$.extend($.validator.messages, {
			required: "Dieses Feld ist erforderlich.",
			remote: "Bitte korrigieren Sie dieses Feld.",
			email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
			url: "Bitte geben Sie eine gültige URL ein.",
			date: "Bitte geben Sie ein gültiges Datum ein.",
			dateISO: "Bitte geben Sie ein gültiges Datum ein (ISO-Format).",
			number: "Bitte geben Sie eine gültige Nummer ein.",
			digits: "Bitte geben Sie nur Ziffern ein.",
			creditcard: "Bitte geben Sie eine gültige Kreditkartennummer ein.",
			equalTo: "Bitte geben Sie den gleichen Wert erneut ein.",
			accept: "Bitte geben Sie einen Wert mit einer gültigen Dateierweiterung ein.",
			maxlength: $.validator.format("Bitte geben Sie nicht mehr als {0} Zeichen ein."),
			minlength: $.validator.format("Bitte geben Sie mindestens {0} Zeichen ein."),
			rangelength: $.validator.format("Bitte geben Sie einen Wert zwischen {0} und {1} Zeichen ein."),
			range: $.validator.format("Bitte geben Sie einen Wert zwischen {0} und {1} ein."),
			max: $.validator.format("Bitte geben Sie einen Wert kleiner oder gleich {0} ein."),
			min: $.validator.format("Bitte geben Sie einen Wert größer oder gleich {0} ein.")
		});

	}

	/**
	 * Kick off the funnel after the user has started it on one of the pages with the shortcode
	 * This function handles the complete funnel process, starting with slide 2
	 */
	async startFunnel(trigger) {
		// first slide
		if (this.currentSlide === 0) {
			let slideData = this.funnelData.slides[this.currentSlide];
			let slideContent = this.getSlideContent(slideData);

			this.firstSlide.append(`
				<div class="funnel-slider">
					${slideContent}
				</div>
			`);

			this.removeHeader();

			this.increaseSlide();

			this.previousSlideData = slideData;
		} else {
			if (this.currentSlide === 1 && !this.googleSendStartFunnel) {
				window.location.hash = 'funnel_start';
				this.googleSendStartFunnel = true;
			}

			let previousSlide = this.previousSlideData;
			let slideType = previousSlide.type;
			let valueHolder;
			let indexHolder; // for input fields -> conditional slides
			let optInData;
			let nextSlide;
			let nextSlideProperty;

			if (this.currentSlide === 1) {
				$('.mm-page').fadeOut(200);
				// remove the first slide from main
				this.firstSlide.children().remove();
			}

			// get the user inputs from the previous slide
			if (trigger !== 'back') {
				switch (slideType) {
					case 'image_selection':
						if (previousSlide.multiselect) {
							valueHolder = this.multiselectValues;

							if (previousSlide.next_slide) {
								nextSlide = true;
								nextSlideProperty = previousSlide;
							} else {
								nextSlide = false;
							}

						} else {
							valueHolder = $(event.target).closest('.slide-input-holder').attr('value');

							let imageOption = previousSlide.image_options.find(option => option.value === valueHolder);
							if (imageOption && imageOption.next_slide) {
								nextSlide = true;
								nextSlideProperty = imageOption;
							} else {
								nextSlide = false;
							}
						}
						break;
					case 'icon_selection':
						if (previousSlide.multiselect) {
							valueHolder = this.multiselectValues;

							if (previousSlide.next_slide) {
								nextSlide = true;
								nextSlideProperty = previousSlide;
							} else {
								nextSlide = false;
							}

						} else {
							valueHolder = $(event.target).closest('.slide-input-holder').attr('value');

							let iconOption = previousSlide.icon_options.find(option => option.value === valueHolder);
							if (iconOption && iconOption.next_slide) {
								nextSlide = true;
								nextSlideProperty = iconOption;
							} else {
								nextSlide = false;
							}

						}
						break;
					case 'text_selection':
						if (previousSlide.multiselect) {
							valueHolder = this.multiselectValues;

							if (previousSlide.next_slide) {
								nextSlide = true;
								nextSlideProperty = previousSlide;
							} else {
								nextSlide = false;
							}

						} else {
							valueHolder = $(event.target).closest('.slide-input-holder').attr('value');

							let textOption = previousSlide.text_options.find(option => option.value === valueHolder);

							if (textOption && textOption.next_slide) {
								nextSlide = true;
								nextSlideProperty = textOption;
							} else {
								nextSlide = false;
							}
						}
						break;
					case 'text_input':
						let alreadyDefined = false;

						if (previousSlide.multiselect) {
							// Form Validation
							if ($('#funnel-form').length) {
								this.initFunnelValidator();
								if (!$('#funnel-form').valid()) {
									return;
								}
							}

							valueHolder = this.multiselectValues;

							if (previousSlide.next_slide) {
								nextSlide = true;
								nextSlideProperty = previousSlide;
							} else {
								nextSlide = false;
							}

						} else {
							if (previousSlide.alternative_type) {
								// if the event target is the next button, get the value from the input field
								if ($(event.target).hasClass('next-slide-trigger')) {

									// Form Validation
									if ($('#funnel-form').length) {
										this.initFunnelValidator();
										if (!$('#funnel-form').valid()) {
											return;
										}
									}

									// dont check the alternative input, since there is no way there is a multiselect + alternative input on an input slide

									valueHolder = $(event.target).closest('.funnel-slider').find('.slide-input-holder').val();
								} else {
									valueHolder = $(event.target).closest('.slide-input-holder').attr('value');

									// get the type of the alternative slide
									let alternativeType = previousSlide.alternative_type.type;
									let alternativeTypeOptions;

									switch (alternativeType) {
										case 'image_selection':
											alternativeTypeOptions = "image_options";
											break;
										case 'icon_selection':
											alternativeTypeOptions = "icon_options";
											break;
										case 'text_selection':
											alternativeTypeOptions = "text_options";
											break;
										case 'text_input':
											alternativeTypeOptions = "input_options";
											break;
									}

									let alternativeOption = previousSlide.alternative_type[alternativeTypeOptions].find(option => option.value === valueHolder);

									if (alternativeOption && alternativeOption.next_slide) {
										nextSlide = true;
										nextSlideProperty = alternativeOption;
										alreadyDefined = true;
									} else {
										nextSlide = false;
									}
								}
							} else {
								// Form Validation
								if ($('#funnel-form').length) {
									this.initFunnelValidator();
									if (!$('#funnel-form').valid()) {
										return;
									}
								}

								valueHolder = $(event.target).closest('.funnel-slider').find('.slide-input-holder').val();
								indexHolder = $(event.target).closest('.funnel-slider').find('.slide-input-holder').name;
							}

							if (!alreadyDefined) {
								let textOption = previousSlide.input_options.find(option => option.value === indexHolder);

								if (textOption && textOption.next_slide) {
									nextSlide = true;
									nextSlideProperty = textOption;
								} else {
									nextSlide = false;
								}
							}
						}
						break;
					case 'file_upload':
						let fileInput = $(event.target).closest('.funnel-slider').find('.slide__input[type="file"]');
						if (fileInput.length > 0 && fileInput[0].files.length > 0) {
							this.uploadedFiles[previousSlide.id] = fileInput[0].files[0];
						} else {
							// Handle manual entry
							if (previousSlide.alternative_method) {

								// Form Validation
								if ($('#funnel-form').length) {
									this.initFunnelValidator();
									if (!$('#funnel-form').valid()) {
										return;
									}
								}

								let manualData = {};
								// Assuming the additional slide has inputs with a specific class or attribute
								$('.slide-input-holder').each(function () {
									let inputName = $(this).attr('name');
									let inputValue = $(this).val();
									manualData[inputName] = inputValue;
								});
								this.answers[previousSlide.alternative_method_data.answers_data_name] = manualData;
							}
						}
						break;
					case 'opt_in':

						// Form Validation
						if ($('#funnel-form').length) {
							this.initFunnelValidator();
							if (!$('#funnel-form').valid()) {
								return;
							}
						}

						optInData = {}

						$(event.target).closest('.funnel-slider').find('.slide-input-holder').each(function () {
							let name = $(this).attr('name');
							let value = $(this).val();
							optInData[name] = value;
						});
						break;
					default:
						valueHolder = null;
				}

				// get the user inputs from the previous slide
				if (optInData) {
					this.optInData = optInData;
				} else {
					// if this was a user upload, dont
					if (slideType !== 'file_upload') {
						this.answers[previousSlide.question] = valueHolder;
					}

					// if the previous slide was a conditional slide, save the parent slide and option
					if (previousSlide.conditional_slide === true) {
						this.conditionalAnswers[previousSlide.question] = {
							parent_question: previousSlide.parent_question,
							parent_answer: previousSlide.parent_answer,
							parent_type: previousSlide.parent_type
						}
					}
				}
			}

			await $('#funnel-form').fadeOut(200).promise();
			$('#funnel-form').remove();

			// check if the previous slide answer triggers an alternative slide
			if (nextSlide === true && nextSlideProperty.next_slide_type === 'content') {
				this.alternativeSlide_Content(nextSlideProperty.next_slide);
			} else {
				// default slide data (next slide in line)
				let slideData = this.funnelData.slides[this.currentSlide];

				// if the next slide is an additional slide, get the additional slide data
				if (nextSlide === true && nextSlideProperty.next_slide_type === 'additional') {
					slideData = this.funnelData.additional_slides.find(slide => slide.id === nextSlideProperty.next_slide);
				}

				let nextSlideConditional;
				let conditionalHeaderText;
				if (slideData.conditional_slide) {
					nextSlideConditional = true;
					conditionalHeaderText = slideData.conditional_header_text;
				} else {
					nextSlideConditional = false;
					conditionalHeaderText = null;
				}

				if (!this.slideHeaderAppended) {
					$('body').append(this.addHeader(this.currentSlide));
					setTimeout(() => {
						$('.slider-header').addClass('slide-in');
					}, 200);
					this.slideHeaderAppended = true;
				} else {
					this.updateHeader(this.currentSlide, nextSlideConditional, conditionalHeaderText);
				}

				// get the content of the slide
				let slideContent = this.getSlideContent(slideData);

				let alternativeContent = '';

				if (slideData.alternative_type) {
					alternativeContent = this.getAlternativeContent(slideData);
				}

				let slideReason = this.getReason(this.currentSlide);

				// check if there is a next slide
				if (this.currentSlide < this.funnelData.slides.length - 1) {
					$('body').append(`
						<form id="funnel-form">
							<div class="funnel-slider slider-height">
								${slideContent}
								<div class="slider__control">
									<a class="slider__button--abort"><i class="fa-solid fa-caret-left"></i>Zurück</a>
								</div>
								${alternativeContent}
								${slideReason}
							</div>
						</form>
					`);

					// if current slide is opt in slide (opt in is always the next-to-last slide)
					if (this.currentSlide === this.funnelData.slides.length - 2 && !this.googleSendOptIn) {
						window.location.hash = 'funnel_opt_in';
						this.googleSendOptIn = true;
					}

					// start at the top of the page without animation
					window.scrollTo(0, 0);

					// if this is the last slide, append the next button
					if (this.currentSlide === this.funnelData.slides.length - 1) {
						let sliderControl = $('.slider__control');

						sliderControl.append(this.sendBtn);
						this.sendBtnAdded = true;
					}

					// reset the multiselectValues array
					this.multiselectValues = [];
					this.nextBtnAdded = false;

					// set this slide as the previous slide
					this.previousSlideData = slideData;

					if (!nextSlide) {
						this.increaseSlide();
					}
				} else {
					// if currentSlide == last slide, show thank you slide
					if (this.currentSlide === this.funnelData.slides.length - 1 && !this.googleSendThankYou) {
						window.location.hash = 'funnel_thank_you';
						this.googleSendThankYou = true;
					}

					let tyLink = '';
					let tyName = '';
					if (this.funnelData.ty_page_link) {
						tyLink = this.funnelData.ty_page_link;
						tyName = this.funnelData.ty_btn_name;
					}

					$('body').append(`
						<div class="funnel-slider thank-you">
							${slideContent}
							<div class="slider__control thank-you-page__control">
								<a class="slider__button--homepage" href="${tyLink}">${tyName}<i class="fa-solid fa-caret-right"></i></a>
								<a class="slider__button--go-home" href="/">Zurück zur Startseite</a>
							</div>
						</div>
					`);

					// confetti blast
					confetti({
						particleCount: 100,
						spread: 90,
						origin: { y: 0.3 },
						zIndex: 2
					});

					// info: aktuell ist es so, dass der thank you slide for dem response kommt, aber so hat man keine verzögerung
					// wenn jemand versucht das formular auszutricksen (frontend validation) eingibt, ist er selber schuld, eine nachricht gibts ja trotzdem

					let currentUrl = window.location.href;

					for (const key in this.conditionalAnswers) {
						const parentQuestion = this.conditionalAnswers[key].parent_question;
						const parentAnswer = this.conditionalAnswers[key].parent_answer;
						const parentType = this.conditionalAnswers[key].parent_type;

						if (parentAnswer === false) {
							if (this.answers[parentQuestion]) {
							} else {
								delete this.answers[key];
							}
						} else if (parentType === 'default') {
							if (this.answers[parentQuestion] === parentAnswer) {
							} else {
								delete this.answers[key];
							}
						} else if (parentType === 'additional_slides') {
							if (this.conditionalAnswers[parentQuestion] === parentAnswer) {
							} else {
								delete this.answers[key];
							}
						}
					}

					let formData = new FormData();

					// Append existing data fields to FormData
					let data = {
						funnel_name: this.funnelData.funnel_name,
						answers: this.answers,
						opt_in_data: this.optInData,
						source: currentUrl
					};

					for (let key in data) {
						if (data.hasOwnProperty(key)) {
							if (key === 'answers' || key === 'opt_in_data') {
								// Since answers and opt_in_data are objects, stringify them
								formData.append(key, JSON.stringify(data[key]));
							} else {
								formData.append(key, data[key]);
							}
						}
					}

					// Append uploaded files to FormData
					for (let fileKey in this.uploadedFiles) {
						formData.append(fileKey, this.uploadedFiles[fileKey]);
					}

					// AJAX request with FormData
					$.ajax({
						url: this.funnelApi + '/save/submission',
						method: 'POST',
						data: formData,
						processData: false, // Don't process data
						contentType: false, // Don't set a content type
						success: (response) => {
							// Handle success
						},
						error: (error) => {
							// Handle error
							this.addToast('error', 'Etwas ist schief gelaufen. Bitte laden Sie die Seite erneut.');
						}
					});

				}
			}
		}
	}

	/**
	 * Get the actual slide content from the funnelData
	 * Switch between the different slide types (image_selection, text_selection, etc.)
	 */
	getSlideContent(data) {
		let currentSlide = data;
		let subtitleHTML;
		let subtitleHighlight;
		let titleBeforeContent;

		if (currentSlide.subtitle) {
			if (currentSlide.subtitle_highlight) {
				subtitleHighlight = 'subtitle--highlight';
			} else {
				subtitleHighlight = '';
			}

			subtitleHTML = `
				<div class="subtitle__wrapper ${subtitleHighlight}">
					<div class="slide__subtitle">${currentSlide.subtitle}</div>
				</div>
			`;
		} else {
			subtitleHTML = '';
		}

		// currently only used for the first slide, because of the general title
		if (currentSlide.title_before_content) {
			titleBeforeContent = `
				<div class="slide__title-before">${currentSlide.title_before_content}</div>
			`;
		} else {
			titleBeforeContent = '';
		}

		// Handle additional slide types
		if (data.type === 'manual_entry') {
			let inputFields = this.appendInputOptions(data.input_options);
			return (`
				<div class="slide">
					<div class="slide__content">
						<h2 class="slide__title">${data.title}</h2>
						<div class="slide__inputs slide__inputs--sm">
							${inputFields}
						</div>
					</div>
				</div>
			`);
		}

		switch (currentSlide.type) {
			case 'image_selection':
				let imagesHTML = this.appendImages(currentSlide.image_options, currentSlide.multiselect);
				return (`
					<div class="slide">
						<div class="slide__content">
							<h2 class="slide__title">${currentSlide.title}</h2>
							${subtitleHTML}
							${titleBeforeContent}
							<div class="slide__images">
								${imagesHTML}
							</div>
						</div>
					</div>
				`);
			case 'icon_selection':
				let iconsHTML = this.apendIcons(currentSlide.icon_options, currentSlide.multiselect);
				let iconCols = currentSlide.icon_options.length;
				let iconColClass = '';

				if (iconCols === 3) {
					iconColClass = 'icon-col-3';
				}

				return (`
					<div class="slide">
						<div class="slide__content">
							<h2 class="slide__title">${currentSlide.title}</h2>
							${subtitleHTML}
							${titleBeforeContent}
							<div class="slide__icons ${iconColClass}">
								${iconsHTML}
							</div>
						</div>
					</div>
				`);
			case 'text_selection':
				let textHTML = this.appendTextOptions(currentSlide.text_options, currentSlide.multiselect);
				return (`
					<div class="slide">
						<div class="slide__content">
							<h2 class="slide__title">${currentSlide.title}</h2>
							${subtitleHTML}
							${titleBeforeContent}
							<div class="slide__text">
								${textHTML}
							</div>
						</div>
					</div>
				`);
			case 'text_input':
				let inputHTML = this.appendInputOptions(currentSlide.input_options);

				return (`
					<div class="slide">
						<div class="slide__content">
							<h2 class="slide__title">${currentSlide.title}</h2>
							${subtitleHTML}
							${titleBeforeContent}
							<div class="slide__inputs slide__inputs--sm">
								${inputHTML}
							</div>
						</div>
					</div>
				`);
			case 'file_upload':
				let fileInputHTML = this.appendInputOptions(currentSlide.input_options);
				let alternativeMethodHTML = '';
				if (currentSlide.alternative_method) {
					alternativeMethodHTML = `<button class="manual-entry-button">${currentSlide.alternative_method_data.button_text}</button>`;
				}

				return (`
					<div class="slide">
						<div class="slide__content">
							<h2 class="slide__title">${currentSlide.title}</h2>
							${subtitleHTML}
							<div class="slide__inputs slide__inputs--sm">
								${fileInputHTML}
								<div class="manual-entry__or-text">oder</div>
								${alternativeMethodHTML}
							</div>
						</div>
					</div>
				`);
			case 'multi_input':
				let multiInputHTML = this.appendMultiInputOptions(currentSlide.input_options);
				return (`
					<div class="slide">
						<div class="slide__content">
							<h2 class="slide__title">${currentSlide.title}</h2>
							${subtitleHTML}
							${titleBeforeContent}
							<div class="slide__inputs slide__inputs--md">
								${multiInputHTML}
							</div>
						</div>
					</div>
				`);
			case 'opt_in':
				let optInHTML = this.appendMultiInputOptions(currentSlide.input_options);
				return (`
					<div class="slide">
						<div class="slide__content">
							<h2 class="slide__title optin-title">${currentSlide.title}</h2>
							<div class="subtitle__wrapper optin-subtitle ${subtitleHighlight}">
								<div class="slide__subtitle">${currentSlide.subtitle}</div>
							</div>
							<div class="slide__inputs slide__inputs--sm">
								${optInHTML}
							</div>
						</div>
					</div>
				`);
			case 'thank_you':
				let icon = '';
				if (currentSlide.thank_you_options.icon) {
					icon = `<div class="ty-icon">${currentSlide.thank_you_options.icon}</div>`;
				}

				return (`
					<div class="slide">
						<div class="slide__content ty-content">
							${icon}
							<h2 class="slide__title">${currentSlide.title}</h2>
							<div class="subtitle__wrapper ty-subtitle__wrapper ${subtitleHighlight}">
								<div class="slide__subtitle ty-subtitle">${currentSlide.subtitle}</div>
							</div>
						</div>
					</div>
				`);
			default:
				return '';
		}
	}

	getAlternativeContent(currentSlide) {
		let alternative = currentSlide.alternative_type;
		let alternativeHTML = this.appendImages(alternative.image_options, alternative.multiselect);

		return `
			<div class="alternative__content">
				<h2 class="alternative__title">${alternative.alternative_title}</h2>
				<div class="slide__images">
						${alternativeHTML}
				</div>
			</div>
		`;
	}

	addHeader(currentSlide) {
		let currentStep = currentSlide + 1;
		let allSteps = this.funnelData.slides.length - 1;
		let progressBarWidth = (currentStep / allSteps) * 100 + '%';

		// make the progress bar fill smoothly
		$('.progress-bar__inner').css('transition', 'width 0.5s ease-in-out');

		if (currentStep <= allSteps) {
			return (`
				<div class="slider-header">
					<h1 class="slider-header__text">Frage: ${currentStep} / ${allSteps}</h1>
					<div class="progress-bar"><div class="progress-bar__inner" style="width: ${progressBarWidth}"></div></div>
				</div>
			`);
		} else {
			return '';
		}
	}

	updateHeader(currentSlide, nextSlideConditional, conditionalHeaderText) {
		if (!nextSlideConditional) {
			let currentStep = currentSlide + 1;
			let allSteps = this.funnelData.slides.length - 1;
			let progressBarWidth = (currentStep / allSteps) * 100 + '%';

			if (currentStep <= allSteps) {
				$('.slider-header__text').text(`Frage: ${currentStep} / ${allSteps}`);
				$('.progress-bar__inner').css('width', progressBarWidth);
			} else {
				$('.slider-header').hide();
			}
		} else {
			$('.slider-header__text').text(conditionalHeaderText);
		}
	}

	removeHeader() {
		$('.slider-header').remove();
	}

	getReason(currentSlide) {
		let reason = this.funnelData.slides[currentSlide].reason;
		if (reason) {
			return (`
				<div class="slider__reason">
					<p class="slide__reason-title">Warum fragen wir das?</p>
					<p class="slide__reason-text">${reason}</p>
				</div>
			`);
		} else {
			return '';
		}
	}

	/**
	 * Insert the currentSlide variable by 1
	 */
	increaseSlide() {
		this.currentSlide++;
	}

	/**
	 * Decrease the currentSlide variable by 1
	 */
	decreaseSlide() {
		this.currentSlide--;
	}

	/**
	 * Append the images to the slider
	 */
	appendImages(imageData, multiselect) {
		let triggerClass;
		let shake;

		if (multiselect) {
			triggerClass = this.multiselectClass;
		} else {
			triggerClass = this.nextSlideClass;
		}

		if (this.currentSlide === 0) {
			shake = this.shakeClass;
		} else {
			shake = '';
		}

		let images = $.map(imageData, function (image) {
			return `
				<a class="slide__image-box slide-input-holder anim-lg ${shake} ${triggerClass}" value="${image.value}">
					<img class="slide__image" src="${image.url}" alt="">
					<div class="slide__image-title">${image.title}</div>
				</a>	 
			`;
		}).join(''); // remove the commas from the array
		return images;
	}

	apendIcons(iconData, multiselect) {
		let triggerClass;
		let shake;

		if (multiselect) {
			triggerClass = this.multiselectClass;
		} else {
			triggerClass = this.nextSlideClass;
		}

		if (this.currentSlide === 0) {
			shake = this.shakeClass;
		} else {
			shake = '';
		}

		let icons = $.map(iconData, function (icon) {
			return `
				<a class="slide__icon-box slide-input-holder anim-lg ${shake} ${triggerClass}" value="${icon.value}">
					<div class="icon-wrapper">
						<div class="slide__icon">${icon.icon}</div>
						<div class="icon-circle"></div>
					</div>
					<div class="slide__icon-title">${icon.title}</div>
				</a>
			`;
		}).join(''); // remove the commas from the array

		return icons;
	}

	/**
	 * Append the text options to the slider
	 */
	appendTextOptions(textData, multiselect) {
		let triggerClass;
		let knobHTML = '';

		if (multiselect) {
			triggerClass = this.multiselectClass;
			knobHTML = `<span class="multiselect-knob"></span>`;
		} else {
			triggerClass = this.nextSlideClass;
		}

		let textOptions = $.map(textData, function (text) {
			return `
				<a class="slide__text-box slide-input-holder anim-sm ${triggerClass}" value="${text.value}">
					<div class="slide__text-title">
						${knobHTML}${text.title}
					</div>
				</a>	 
			`;
		}).join(''); // remove the commas from the array
		return textOptions;
	}

	appendInputOptions(inputData) {
		let inputOptions = $.map(inputData, function (input) {
			let inputHTML = '';
			let maxSize = input.max_size;
			let maxSizeHtml = ''

			switch (input.type) {
				case 'text':
					inputHTML = `<input class="slide__input slide__input--sm slide-input-holder" type="text" name="${input.input_name}" placeholder="${input.placeholder}" />`;
					break;
				case 'number':
					inputHTML = `<input class="slide__input slide__input--sm slide-input-holder" type="number" name="${input.input_name}" placeholder="${input.placeholder}" />`;
					break;
				case 'file':
					// Use specified max_size or default to 5 MB
					const maxSize = input.max_size ? input.max_size : 5;
					const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to Bytes
					inputHTML = `<input class="slide__input slide__input--sm slide-input-holder" type="file" name="${input.input_name}" accept="${input.accept}" data-max-size="${maxSizeBytes}" />`;
					break;
			}

			return `<div class="slide__input-box">${inputHTML}</div>`;
		}).join('');

		return inputOptions;
	}

	appendMultiInputOptions(inputData) {
		let self = this;

		let inputOptions = $.map(inputData, function (input) {
			let singleInput;
			let numberInputs = '';

			if (input.type === 'number') {
				numberInputs += `inputmode="numeric" pattern="[0-9]*"`;
			}

			if (input.type === 'checkbox') {
				let gdprLink = self.funnelData.gdpr_link;
				let gdprText = `Ich willige ein, dass meine Angaben zur Kontaktaufnahme, Angebotserstellung und Zuordnung für Rückfragen gespeichert werden. Hier finden Sie Hinweise zum <a class="gdpr-link" href="${gdprLink}">Datenschutz</a>`;
				singleInput = `
					<div class="slide__gdpr-box">
						<input class="slide__input--gdpr slide-input-holder" type="${input.type}" name="${input.input_name}" />
						<div class="gdpr-message prevent-select">${gdprText}</div>
					</div>
				`;
			} else {
				singleInput = `
					<div class="slide__input-box">
						<input class="slide__input slide-input-holder" type="${input.type}" name="${input.input_name}" ${numberInputs} placeholder="${input.placeholder}" />
					</div>
				`;
			}

			return singleInput;

		}).join('');
		return inputOptions;
	}

	multiselectAddOption() {
		// get the container of the clicked option
		let container = $(event.target).closest('.' + this.multiselectClass);

		// get the value of the clicked option
		let value = $(event.target).closest('.' + this.multiselectClass).attr('value');

		// first check if the value is already in the array
		if (this.multiselectValues.includes(value)) {
			// if it is, remove it from the array
			let index = this.multiselectValues.indexOf(value);
			if (index > -1) {
				this.multiselectValues.splice(index, 1);
			}
		} else {
			// if it is not, add it to the array
			this.multiselectValues.push(value);
		}

		let knob = container.find('.multiselect-knob');
		let knobBox = $(event.target).closest('.' + this.multiselectClass);

		if (knob.hasClass('multiselect-knob--selected')) {
			knob.removeClass('multiselect-knob--selected');

			// if there is no other knob selected, remove the next button
			if ($('.multiselect-knob--selected').length === 0) {
				$('.next-slide-trigger').remove();
			}

			knobBox.removeClass('multiselect-option--selected');
		} else {
			knob.addClass('multiselect-knob--selected');
			knobBox.addClass('multiselect-option--selected');
			if ($('.next-slide-trigger').length === 0) {
				$('.slider__control').append(this.nextBtn); // add the next button
			}
		}
	}

	inputAddNextBtn() {
		if (this.currentSlide === this.funnelData.slides.length - 1) {
			if (this.sendBtnAdded === false) {
				if ($('.slide__input').val() !== '') {
					let sliderControl = $(event.target).closest('.funnel-slider').find('.slider__control');
					sliderControl.append(this.sendBtn);
					this.sendBtnAdded = true;
				} else {
					$('.next-slide-trigger').remove();
				}
			}
		} else {
			if (this.nextBtnAdded === false) {
				if ($('.slide__input').val() !== '') {
					let sliderControl = $(event.target).closest('.funnel-slider').find('.slider__control');
					sliderControl.append(this.nextBtn);
					this.nextBtnAdded = true;
				} else {
					$('.next-slide-trigger').remove();
				}
			}
		}
	}

	async previousSlide() {

		await $('#funnel-form').fadeOut(200).promise();
		$('#funnel-form').remove();

		this.currentSlide = this.currentSlide - 1;

		let previousSlideConditional = this.previousSlideData.conditional_slide;

		if (this.currentSlide === 1) {
			if (previousSlideConditional) {
				this.startFunnel(this.triggerBack);
			} else {
				this.abortFunnel();
			}
		} else {

			if (!previousSlideConditional) {
				this.currentSlide = this.currentSlide - 1;
			}

			this.startFunnel(this.triggerBack);
		}
	}


	/**
	 * Abort the funnel, remove the slider from the page and show the original content again
	 */
	async abortFunnel() {
		// remove the slider from the page
		await $('.funnel-slider').fadeOut(200).promise();
		$('.funnel-slider').remove();
		$('.mm-page').fadeIn(200);
		// reset the currentSlide variable
		this.currentSlide = 0;
		this.slideHeaderAppended = false;
		this.currentHeaderStep = 1;
		// remove the hash from the url
		if (window.location.hash == '#funnel-start') {
			window.location.hash = '';
		}
		// kick off the funnel again, to append the first slide to the page
		this.startFunnel(this.triggerNext);
		// scroll back to the position before the funnel started
		$(window).scrollTop(this.funnelScroll);
	}

	tickCheckbox(event) {
		let gdprCheckbox = $(event.target).closest('.slide__gdpr-box').find('input');

		if (!$(event.target).is('input')) {
			if (gdprCheckbox.is(':checked')) {
				gdprCheckbox.prop('checked', false);
			} else {
				gdprCheckbox.prop('checked', true);
			}
		}
	}

	/**
	 * Adding a toast message to the bottom right corner of the screen for each product added, max of 3
	 */
	addToast(type, toastMessage) {
		toastr.options = {
			"positionClass": "toast-bottom-right",
			"progressBar": true,
			"showDuration": "300",
			"timeOut": "5000",
			"preventDuplicates": false
		}

		// Create a unique timestamp to identify the toast
		let toastTimestamp = new Date().getTime();

		this.toastrArray.push({ toastMessage, toastTimestamp });

		if (this.toastrArray.length > 3) {
			let oldestToastObj = this.toastrArray.shift();
			let oldestToastElement = $(`div.toast[data-timestamp='${oldestToastObj.toastTimestamp}']`);
			oldestToastElement.remove();
		}

		let newToast = toastr[type](toastMessage);
		newToast.attr('data-timestamp', toastTimestamp);
	}

	addShakeAnimations() {
		// inViewport function
		$.fn.isInViewport = function () {
			var elementTop = $(this).offset().top;
			var elementBottom = elementTop + $(this).outerHeight();

			var viewportTop = $(window).scrollTop();
			var viewportBottom = viewportTop + $(window).height();

			return elementBottom > viewportTop && elementTop < viewportBottom;
		};

		// if there is a element with the class "shake" run this:
		// add an event listener, when the element with the shake class is scrolled into view, add the class "shake-animation"
		$(document).on('scroll', () => {
			$('.' + this.shakeClass).each((i, el) => {
				if ($(el).isInViewport()) {
					$(el).addClass('shake-anim');
				}
			});
		});
	}

	alternativeSlide_Content(alternativeSlide) {
		let subtitleHTML;
		let subtitleHighlight;

		let jsonContent = this.funnelData.content_slides.find(option => option.id === alternativeSlide);

		if (jsonContent.subtitle) {
			if (jsonContent.subtitle_highlight) {
				subtitleHighlight = 'subtitle--highlight';
			} else {
				subtitleHighlight = '';
			}

			subtitleHTML = `
				<div class="subtitle__wrapper--fail-slide ${subtitleHighlight}">
					<div class="slide__subtitle">${jsonContent.subtitle}</div>
				</div>
			`;
		} else {
			subtitleHTML = '';
		}

		$('body').append(`
			<form id="funnel-form">
				<div class="funnel-slider slider-height">
				<div class="slide">
					<div class="slide__content">
						<h2 class="slide__title">${jsonContent.title}</h2>
						${subtitleHTML}
					</div>
					<div class="slider__control--fail-slide">
						<a class="slider__button--abort" href="javascript:void(0);"><i class="fa-solid fa-caret-left"></i>Zurück</a>
						<a class="slider__button--page-link" href="${jsonContent.link_to_page}">${jsonContent.link_btn_text}<i class="fa-solid fa-caret-right"></i></a>
					</div>
				</div>
			</form>
		`);
	}

	fileInputChange() {
		const file = event.target.files[0];
		const maxSize = $(event.target).data('max-size');

		if (file && maxSize && file.size > maxSize) {
			alert(`Die Datei darf maximal ${maxSize / 1024 / 1024} MB groß sein.`);
			event.target.value = '';
			return;
		}

		let sliderControl = $('.slider__control');
		if (!this.nextBtnAdded) {
			sliderControl.append(this.nextBtn);
			this.nextBtnAdded = true;
		}
	}

	showManualEntrySlide(event) {
		event.preventDefault();  // This will prevent the default form submission behavior

		// Assuming this.previousSlideData holds the data of the current slide
		let alternativeSlideId = this.previousSlideData.alternative_method_data.additional_slide_id;
		// Logic to set the currentSlide to the alternative slide and render it
		// This might involve fading out the current slide and fading in the new slide
		this.renderAdditionalSlide(alternativeSlideId);
	}

	renderAdditionalSlide(slideId) {
		// Find the additional slide data from the JSON using slideId
		let slideData = this.funnelData.additional_slides.find(slide => slide.id === slideId);

		// Create the HTML content for the slide
		let slideContent = this.getSlideContent(slideData);

		// Assuming you have a container for the slides
		let slidesContainer = $('.slide');

		// Replace the current slide with the new slide
		slidesContainer.fadeOut(300, () => {
			let sliderControl = $('.slider__control');
			slidesContainer.html(slideContent).fadeIn(300);
			// now check if there already is the this.nextBtn inside the slider control
			if (!this.nextBtnAdded) {
				sliderControl.append(this.nextBtn);
				this.nextBtnAdded = true;
			}
		});
	}

}

export default FunnelSlider;