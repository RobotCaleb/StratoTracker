#!/usr/bin/env perl
use ExtUtils::MakeMaker;
WriteMakefile(
	PREREQ_PM => {
		'Ham::APRS::FAP' => 0,
		'JSON::XS'       => 0
	},
};
