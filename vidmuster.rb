#! /usr/bin/env ruby

require 'sinatra'

set :port, 3032
# Main file for vidmuster.com; handles all routes

get '/' do
  erb :index
end
