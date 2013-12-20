#! /usr/bin/env ruby

require 'sinatra'

set :port, 3032
set :bind, '127.0.0.1'

# Main file for vidmuster.com; handles all routes

get '/' do
  erb :index
end
