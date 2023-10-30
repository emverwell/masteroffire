<?php
$email_to = 'here@your.mail';

if (isset($_REQUEST['send_mail'])) {

    $form_name = htmlspecialchars($_REQUEST['form_name']);
    $form_email = htmlspecialchars($_REQUEST['form_email']);
    $form_text = htmlspecialchars($_REQUEST['form_text']);
	$form_subject = 'Vincent Contact Form Subject';

    if (empty($form_name) || empty($form_email) || empty($form_text)) {
        die ('Please fill in all required fields!');
    }

    $message = "
    Name: ".$form_name."<br><br>
    E-mail: ".$form_email."<br><br>
    Comment: ".$form_text;

    $headers = 'From: '. $form_email . "\r\n" .
        'MIME-Version: 1.0' . "\r\n" .
        'Content-type: text/html; charset=utf-8' . "\r\n" .
        'X-Mailer: PHP/' . phpversion();

    if(mail($email_to, $form_subject, $message, $headers)) {
        echo 'Done! Thank You!';
    }
}