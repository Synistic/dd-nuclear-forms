<?php

// Function to get the funnel_json custom field
function s_get_funnel_json()
{
	global $post;

	$post_id = $post->ID;

	// Fetch the funnel_json string from the post meta
	$funnel_json_string = get_post_meta($post_id, 'funnel_json', true);

	if ($funnel_json_string) {
		// Decode the JSON string into an array
		$funnel_json_array = json_decode($funnel_json_string, true);

		// Check if json_decode was successful
		if (is_array($funnel_json_array)) {
			// Properly localize the script with the array
			wp_localize_script('se_funnel_js', 'funnel_json', $funnel_json_array);
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}
