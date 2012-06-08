#!/usr/bin/env perl
use ExtUtils::MakeMaker;
WriteMakefile(
	PREREQ_PM => {
		'Dancer'         => 1.3095,
		'Ham::APRS::FAP' => 1.18,
		'JSON::XS'       => 2.32,
		'Plack::Request' => 0.9988
	},
);
