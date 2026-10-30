<?php
/**
 * Formular-Versand (Anamnesebogen, Gutscheinbestellung) per E-Mail an die Praxis.
 * Läuft auf jedem üblichen PHP-Webspace (IONOS, Strato, all-inkl …).
 * Ohne PHP (z. B. reiner Static-Host) bietet die Website automatisch
 * „per E-Mail senden“ bzw. „drucken / als PDF speichern“ an.
 */

declare(strict_types=1);

date_default_timezone_set('Europe/Berlin');

const RECIPIENT = 'praxis@cm-naturheilkunde.de';
const FORMS = [
    'anamnese'  => 'Anamnesebogen (online ausgefüllt)',
    'gutschein' => 'Gutscheinbestellung',
];
const MAX_SUMMARY = 60000;      // Zeichen
const MIN_INTERVAL = 20;        // Sekunden zwischen zwei Sendungen je IP

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $code, array $body): void
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function clean_line(string $s): string
{
    // keine Zeilenumbrüche in Header-Werten (Header-Injection verhindern)
    return trim(preg_replace('/[\r\n\t]+/', ' ', $s) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Methode nicht erlaubt']);
}

$form    = (string)($_POST['form'] ?? '');
$summary = (string)($_POST['summary'] ?? '');
$name    = clean_line((string)($_POST['Name'] ?? ''));
$email   = clean_line((string)($_POST['E-Mail'] ?? ''));
$consent = (string)($_POST['Einwilligung'] ?? '');
$trap    = (string)($_POST['website'] ?? '');

// Spam-Falle: Bots füllen das versteckte Feld aus – stillschweigend „erfolgreich“
if ($trap !== '') {
    respond(200, ['ok' => true]);
}
if (!isset(FORMS[$form])) {
    respond(400, ['ok' => false, 'error' => 'Unbekanntes Formular']);
}
if ($consent !== 'ja') {
    respond(400, ['ok' => false, 'error' => 'Einwilligung fehlt']);
}
if ($name === '' || mb_strlen($name) > 120) {
    respond(400, ['ok' => false, 'error' => 'Name fehlt']);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, ['ok' => false, 'error' => 'E-Mail-Adresse ungültig']);
}
if (trim($summary) === '' || mb_strlen($summary) > MAX_SUMMARY) {
    respond(400, ['ok' => false, 'error' => 'Inhalt fehlt oder ist zu lang']);
}

// einfache Drosselung pro IP
$ip    = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$stamp = sys_get_temp_dir() . '/cm-form-' . hash('sha256', $ip);
if (is_file($stamp) && time() - (int)@filemtime($stamp) < MIN_INTERVAL) {
    respond(429, ['ok' => false, 'error' => 'Bitte einen Moment warten']);
}
@touch($stamp);

$host    = explode(':', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'))[0];
$host    = preg_replace('/[^a-z0-9.-]/i', '', $host);
$host    = preg_replace('/^www\./i', '', $host);
$subject = FORMS[$form] . ' – ' . $name;
$body    = $summary
    . "\n\n----\nGesendet über das Formular auf {$host} am " . date('d.m.Y \u\m H:i') . " Uhr.\n"
    . "Die Einwilligung zur Verarbeitung der Angaben wurde erteilt.\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . mb_encode_mimeheader('Website Praxis Christine Müller', 'UTF-8') . ' <noreply@' . $host . '>',
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . mb_encode_mimeheader($name, 'UTF-8') . ' <' . $email . '>';
}

$sent = mail(
    RECIPIENT,
    mb_encode_mimeheader($subject, 'UTF-8'),
    $body,
    implode("\r\n", $headers)
);

if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'Versand fehlgeschlagen']);
}
respond(200, ['ok' => true]);
