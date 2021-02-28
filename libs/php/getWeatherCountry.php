<?php

	$executionStartTime = microtime(true) / 1000;

	$url = 'http://api.weatherstack.com/forecast?access_key=0e27b0226c8f1f1c3576fbf08a19026b&query='.$_POST['capital'];

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);


	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);

	$output = $decode;

	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);

?>
