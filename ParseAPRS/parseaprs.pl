#!/bin/perl
use JSON::XS;
use Dancer;
use Ham::APRS::FAP qw(parseaprs);
use Dancer::Logger::Console;

#my $logger = Dancer::Logger::Console->new;

get '/' => sub {
	return "<form action='/packet' method='post'><input type='text' name='packet' /><br /><input type='submit' value='Submit' /></form>";
};

post '/packet' => sub {
	my $aprspacket = param('packet');
	my $packetdata = {};
#	$logger->debug("pkt: " . $aprspacket);
	my $retval = parseaprs($aprspacket, $packetdata);
#	$logger->debug("ret: " . $retval);
#	$logger->debug("dat: " . $packetdata);

	my $aprsjson = '';

	if ($retval == 1)
	{
		my $json = encode_json($packetdata);
#		$logger->debug("jsn: " . $json);
		return $json;
	}
};

start;
