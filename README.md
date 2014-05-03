Red Robin API [![Build Status](https://travis-ci.org/mjwitherow/redrobin.svg?branch=master)](https://travis-ci.org/mjwitherow/redrobin)
=========

### Overview

Calculate the sentimental index of Melbourne Australia's twittershpere for a given day.
This is a naive and hacked together prototype for academic use. 

An Index of 50% represents perfect emotional balance.
65% would suggest a moderate increase in positive sentiment (Happyness, satisfaction etc).
10% would suggest a severe decrease in sentiment (depression, fear etc).

Please note straight out of the box, the tweets are set low at 10 per scrape for testing purposes. 
Also the indexs are saved to Parse.com. Hence both twitter and Parse keys are needed. 

It's a quick dirty mashup of existing modules and services to expiriment with Node.js and fullfill academic requirements at Melbourne's RMIT Univeristy. 

### Installation
`git clone git@github.com:mjwitherow/redrobin.git`  
Run locally.  
`foreman start`

### Usage

Calculate the sentimental index of Melbourne's recent tweets today.  
`<host>/calc/` 

Calculate the sentimental index of Melbourne's tweets for a given day (YYYY-MM-DD)  
`<host>/calc/:date` 

The API default route will list available options. 

### RedRobins purpose
+ To scrape a certain set of tweets.
+ To archive calculations from these scrapings.   
+ To perform analysis of results and act as a gateway service to other services. 
+ Primarily, to feed other engines. 


Fun Facts From Wikipedia
>The American Robin (Turdus migratorius), also known as the robin, is a migratory songbird of the thrush family. 
>It is named after the European Robin because of its reddish-orange breast.
>
>Red Robin Gourmet Burgers is a chain of casual dining restaurants founded in 1969 in Seattle, Washington
>
>Red Robin is a name that has been used by several fictional characters in the DC Comics Universe.
>On the alternate world of Kingdom Come, a middle-aged Dick Grayson reclaims the Robin mantle and becomes Red Robin.
