<?php
/* ==========================================================================
   Pickup request handler
   Receives the form from /contact and emails it to the shop.
   Plain PHP, no libraries — works on Hostinger and any normal PHP host.
   ========================================================================== */

// Where pickup requests are delivered. CHANGE THIS to the shop's real inbox.
$TO = 'info@aarikafabriccare.com';

// The address the mail is sent FROM. It must be a real mailbox on this domain,
// or the host refuses the message and spam filters bin it.
//
// No password goes in this file. mail() hands the message to the server's own
// mail transport, which is already authenticated as the hosting account —
// there is no SMTP login to make. Anything written here would be public: this
// file lives in a public repository.
$FROM = 'support@aarikafabriccare.com';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /contact');
    exit;
}

/* Strip anything that could inject extra mail headers. A newline in the name
   or phone would otherwise let a spammer add their own Bcc: and relay mail
   through this form. */
function clean($value) {
    return trim(str_replace(["\r", "\n", "%0a", "%0d", "\0"], '', (string) $value));
}
function field($key) {
    return isset($_POST[$key]) ? clean($_POST[$key]) : '';
}

// Hidden field no human ever sees. If it is filled, it was a bot — answer
// normally so the bot learns nothing, but send no mail.
if (field('company') !== '') {
    header('Location: /contact?sent=1');
    exit;
}

$name    = field('name');
$phone   = preg_replace('/\D/', '', field('phone'));
$date    = field('date');
$service = field('service');
$slot    = field('slot');
$note    = isset($_POST['note']) ? trim(str_replace("\0", '', $_POST['note'])) : '';

// Same rules the JavaScript enforces, re-checked here because anyone can post
// straight at this file without going through the page.
if ($name === '' || !preg_match('/^[6-9]\d{9}$/', $phone)) {
    header('Location: /contact?error=1');
    exit;
}

$subject = 'Pickup request - ' . $name . ' (' . $phone . ')';

$body =
    "New pickup request from the website\n" .
    "-----------------------------------\n\n" .
    "Name:    " . $name . "\n" .
    "Phone:   " . $phone . "\n" .
    "Date:    " . ($date    !== '' ? $date    : 'not given') . "\n" .
    "Service: " . ($service !== '' ? $service : 'not given') . "\n" .
    "Slot:    " . ($slot    !== '' ? $slot    : 'not given') . "\n\n" .
    "Address / notes:\n" . ($note !== '' ? $note : '-') . "\n\n" .
    "-----------------------------------\n" .
    "Sent " . date('D j M Y, g:ia') . "\n" .
    "IP " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

/* The name goes into a header, so the characters that structure one have to
   go. clean() already removed the newlines that would let a spammer add their
   own headers; this stops a stray quote or bracket malforming the address. */
$headerName = str_replace(['"', '<', '>', ','], ' ', $name);

$headers = implode("\r\n", [
    'From: Aarika website <' . $FROM . '>',
    'Reply-To: "' . $headerName . '" <' . $FROM . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
]);

$sent = mail($TO, $subject, $body, $headers, '-f' . $FROM);

header('Location: /contact?' . ($sent ? 'sent=1' : 'error=1'));
exit;
