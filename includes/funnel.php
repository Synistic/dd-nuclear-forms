<?php

if (!defined('ABSPATH')) {
	return;
}

class Funnel
{

	private $wpdb;

	function __construct()
	{
		global $wpdb;
		$this->wpdb = $wpdb;

		$this->createSubmissionTable();
	}

	/**
	 * Create the funnel table
	 */
	function createSubmissionTable()
	{
		$table_name = $this->wpdb->prefix . 'se_funnel_submissions';
		$charset_collate = $this->wpdb->get_charset_collate();

		$sql = "CREATE TABLE $table_name (
			id mediumint(9) NOT NULL AUTO_INCREMENT,
			first_name tinytext,
			last_name tinytext,
			email varchar(255),
			phone varchar(255),
			address text,
			other longtext,
			funnel_name varchar(255),
			source text,
			answers text,
			created datetime,
			PRIMARY KEY  (id)
		) $charset_collate;";

		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

		dbDelta($sql);
	}

	public function saveSubmission(WP_REST_Request $request)
	{
		$data = $request->get_params();

		$uploads_data = []; // Initialize array to hold file upload data

		// Process file uploads
		foreach ($_FILES as $key => $file) {
			$upload_result = $this->handleFileUpload($file);
			if (isset($upload_result['error'])) {
				// Handle the error, such as by returning a WP_Error object or similar
				return new WP_Error('file_upload_error', $upload_result['error']);
			} else {
				// Temporarily store file path and original name for email attachment
				$uploads_data[$key] = [
					'tmp_name' => $upload_result['tmp_name'],
					'name' => $file['name']
				];
			}
		}

		if ($this->validateData($data)) {
			return $this->validateData($data); //response failure
		} else {
			$table_name = $this->wpdb->prefix . 'se_funnel_submissions';

			$optInData = json_decode($data['opt_in_data'], true); // Assuming opt_in_data is a JSON string

			// datetime  = utc time germany berlin
			$date = new DateTime('now', new DateTimeZone('Europe/Berlin'));

			$other_data = [];
			if (isset($optInData['input_comments'])) {
				$other_data['comments'] = $optInData['input_comments'];
			}

			$submission = array(
				'first_name' => isset($optInData['input_vorname']) ? sanitize_text_field($optInData['input_vorname']) : '',
				'last_name' => isset($optInData['input_nachname']) ? sanitize_text_field($optInData['input_nachname']) : '',
				'email' => isset($optInData['input_email']) ? filter_var($optInData['input_email'], FILTER_SANITIZE_EMAIL) : '',
				'phone' => isset($optInData['input_telefon']) ? sanitize_text_field($optInData['input_telefon']) : '',
				'address' => null,
				'other' => json_encode($other_data),
				'funnel_name' => isset($data['funnel_name']) ? sanitize_text_field($data['funnel_name']) : '',
				'source' => isset($data['source']) ? sanitize_text_field($data['source']) : '',
				'answers' => isset($data['answers']) ? $data['answers'] : '',
				'created' => $date->format('Y-m-d H:i:s')
			);

			// in such cases: https://dev-pro-physio.strayfe.dev/leistungen/manuelle-therapie/#funnel_thank_you
			// cut the last part of the url (everything after the last slash)
			if (strpos($submission['source'], '#') !== false) {
				$submission['source'] = substr($submission['source'], 0, strrpos($submission['source'], '#'));
			}

			$sql = $this->wpdb->prepare(
				"INSERT INTO $table_name (first_name, last_name, email, phone, address, other, funnel_name, source, answers, created, uploads) VALUES (%s, %s, %s, %s, %s, %s, %d, %s, %s, %s, %s, %s)",
				$submission['first_name'],
				$submission['last_name'],
				$submission['email'],
				$submission['phone'],
				$submission['address'],
				$submission['other'],
				$submission['funnel_name'],
				$submission['source'],
				$submission['answers'],
				$submission['created']
			);

			$this->wpdb->query($sql);

			$content = $submission;

			$this->sendEmail($content, $date, $uploads_data);

			return true; //response success
		}
	}

	public function validateData($data)
	{
		$errors = array();

		$errors = array_merge($errors, $this->validateOptIn($data['opt_in_data']));
		$errors = array_merge($errors, $this->validateAnswers($data['answers']));

		return $errors;
	}

	private function handleFileUpload($file)
	{
		// Define allowed file types
		$allowed_file_types = ['jpg', 'jpeg', 'png', 'gif', 'heic', 'heif'];

		// Check file type
		$file_type = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
		if (!in_array($file_type, $allowed_file_types)) {
			return ['error' => 'Unsupported file type'];
		}

		// Check file size (5 MB in bytes)
		$max_file_size = 5 * 1024 * 1024; // 5 MB
		if ($file['size'] > $max_file_size) {
			return ['error' => 'File size exceeds the maximum limit of 5 MB'];
		}

		// Return the temporary file path for attachment
		return ['tmp_name' => $file['tmp_name'], 'name' => $file['name']];
	}

	public function validateOptIn($optInData)
	{
		$inputs = json_decode($optInData, true); // Decode the JSON string into an array

		$errors = array();
		if (is_array($inputs)) {
			foreach ($inputs as $key => $input) {
				if ($key === 'input_comments')
					continue;
				if (empty($input)) {
					$errors[$key] = 'Nicht alle persönlichen Daten wurden ausgefüllt. Bitte führen Sie den Prozess erneut durch.';
				}
			}
		} else {
			$errors[] = 'Ungültige Datenformat für persönliche Daten.';
		}

		return $errors;
	}

	public function validateAnswers($answersData)
	{
		$answers = json_decode($answersData, true); // Decode the JSON string into an array

		$errors = array();
		if (is_array($answers)) {
			foreach ($answers as $question => $answer) {
				if (empty($answer)) {
					$errors[$question] = 'Nicht alle Fragen wurden beantwortet. Bitte führen Sie den Prozess erneut durch.';
				}
			}
		} else {
			$errors[] = 'Ungültiges Datenformat für Antworten.';
		}

		return $errors;
	}

	public function getGenericErrorMessage($errorCode)
	{
		return 'Etwas ist schief gelaufen. Bitte probieren Sie es erneut oder kontaktieren Sie uns. [Error: ' . $errorCode . ']';
	}

	public function sendEmail($content, $date, $uploads_data)
	{
		$to = 'd.schmilinski@strayfe.com';
		$subject = 'Neue Terminanfrage über die Website: ' . $content['first_name'] . ' ' . $content['last_name'];
		$headers = ['Content-Type: text/html; charset=UTF-8'];

		$lead_time = $date->format('d.m.Y H:i');
		$other_data = json_decode($content['other'], true);

		$message = "<h1>Neue Terminanfrage über die Website</h1>
		<h3>Eine neue Terminanfrage ist über die Website eingegangen. Hier sind die Details:</h3>
		<p><strong>Zeitpunkt der Anfrage:</strong> $lead_time</p>
		<p><strong>Name:</strong> {$content['first_name']} {$content['last_name']}</p>
		<p><strong>E-Mail Adresse:</strong> {$content['email']}</p>
		<p><strong>Telefonnummer:</strong> {$content['phone']}</p>";

		// add the site from which the request was made
		if (!empty($content['source'])) {
			$message .= "<p><strong>Quelle:</strong> {$content['source']}</p>";
		}

		if (!empty($content['address'])) {
			$address = json_decode($content['address'], true);
			$address_string = implode(', ', array_filter($address));
			$message .= "<p><strong>Adresse:</strong> " . (!empty($address_string) ? $address_string : 'Nicht angegeben') . "</p>";
		}

		if (!empty($other_data['comments'])) {
			$message .= "<p><strong>Anmerkungen vom Besucher:</strong> {$other_data['comments']}</p>";
		}

		$answers = json_decode($content['answers'], true);
		$message .= "<h3>Angaben im Funnel:</h3>";
		foreach ($answers as $key => $value) {
			if (is_array($value)) {
				// Display the key and then list each value
				$message .= "<p><strong>$key:</strong></p><ul>";
				foreach ($value as $key2 => $item) {
					$message .= "<li><strong>" . $key2 . "</strong>: " . htmlspecialchars($item) . "</li>"; // List each item
				}
				$message .= "</ul>";
			} else {
				// Display single value
				$message .= "<p><strong>$key:</strong> " . htmlspecialchars($value) . "</p>";
			}
		}

		$attachments = [];
		$temp_files = [];

		// check if the uploads_data array is not empty
		if (!empty($uploads_data)) {
			$message .= "<h3>Wichtige Hinweise</h3>";

			foreach ($uploads_data as $upload) {
				if (file_exists($upload['tmp_name'])) {
					$temp_path = sys_get_temp_dir() . '/' . $upload['name'];
					move_uploaded_file($upload['tmp_name'], $temp_path);
					$attachments[] = $temp_path;
					$temp_files[] = $temp_path; // Keep track to delete later
					$message .= "<p>Kopie vom Rezept im Anhang.</p>";
				}
			}
		}

		wp_mail($to, $subject, $message, $headers, $attachments);

		if (!empty($attachments)) {
			// Clean up: Delete the temporary files created for renaming
			foreach ($temp_files as $temp_file) {
				@unlink($temp_file);
			}
		}
	}

}

global $funnel;
$funnel = new Funnel();