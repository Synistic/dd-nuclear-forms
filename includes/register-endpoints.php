<?php

if ( ! defined( 'ABSPATH' ) ) exit;

class registerEndpoints {
	
	function __construct() {
		add_action('rest_api_init', array($this, 'registerRoutes'));
	}

	function registerRoutes() {

		global $funnel;

		// register route for saving form submissions
		register_rest_route(
		'funnel-docks/v1',
		'/save/submission',
		array(
			'methods' => WP_REST_SERVER::CREATABLE,
			'callback' => array($funnel, 'saveSubmission'),
			'permission_callback' => '__return_true'
		));
	}
}

new registerEndpoints();