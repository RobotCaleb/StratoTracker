#!/bin/perl
use Ham::APRS::FAP qw(parseaprs);
use JSON;

my $aprspacket = <>;
my $packetdata = {};
my $retval = parseaprs($aprspacket, $packetdata);

my $aprsjson = '';

if ($retval == 1)
{
	$json = encode_json($packetdata);
	print $json;
}
else
{
	warn "Packet was: $arpspacket";
	warn "Parsing failed: $packetdata{resultmsg} ($packetdata{resultcode})\n";
}
