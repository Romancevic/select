<?php

    $executionStartTime = microtime(true);

    $text = file_get_contents('./country/countryList.json');

    $countryList = json_decode($text, true);

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
    $output['status']['executedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
    $output['data']['countryList'] = $countryList;

    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);
?>
