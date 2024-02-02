<?php

/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://strayfe.de
 * @since             1.0.0
 * @package           Stade_Energy_Wp_Funnel
 *
 * @wordpress-plugin
 * Plugin Name:       strayfe Funnel System
 * Plugin URI:        https://strayfe.de
 * Description:       strayfe Funnel System for Websites
 * Version:           1.0.0
 * Author:            strayfe
 * Author URI:        https://strayfe.de
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       stade-energy-wp-funnel
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'STADE_ENERGY_WP_FUNNEL_VERSION', '1.0.0' );

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-stade-energy-wp-funnel-activator.php
 */
function activate_stade_energy_wp_funnel() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-stade-energy-wp-funnel-activator.php';
	Stade_Energy_Wp_Funnel_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-stade-energy-wp-funnel-deactivator.php
 */
function deactivate_stade_energy_wp_funnel() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-stade-energy-wp-funnel-deactivator.php';
	Stade_Energy_Wp_Funnel_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_stade_energy_wp_funnel' );
register_deactivation_hook( __FILE__, 'deactivate_stade_energy_wp_funnel' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-stade-energy-wp-funnel.php';
require plugin_dir_path( __FILE__ ) . 'includes/register-endpoints.php';
require plugin_dir_path( __FILE__ ) . 'includes/funnel.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_stade_energy_wp_funnel() {

	$plugin = new Stade_Energy_Wp_Funnel();
	$plugin->run();

}
run_stade_energy_wp_funnel();
