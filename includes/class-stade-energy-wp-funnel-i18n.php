<?php

/**
 * Define the internationalization functionality
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @link       https://digitaldocks.de
 * @since      1.0.0
 *
 * @package    Stade_Energy_Wp_Funnel
 * @subpackage Stade_Energy_Wp_Funnel/includes
 */

/**
 * Define the internationalization functionality.
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @since      1.0.0
 * @package    Stade_Energy_Wp_Funnel
 * @subpackage Stade_Energy_Wp_Funnel/includes
 * @author     digitaldocks <technik@digitaldocks.de>
 */
class Stade_Energy_Wp_Funnel_i18n {


	/**
	 * Load the plugin text domain for translation.
	 *
	 * @since    1.0.0
	 */
	public function load_plugin_textdomain() {

		load_plugin_textdomain(
			'stade-energy-wp-funnel',
			false,
			dirname( dirname( plugin_basename( __FILE__ ) ) ) . '/languages/'
		);

	}



}
