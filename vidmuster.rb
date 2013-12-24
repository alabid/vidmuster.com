#! /usr/bin/env ruby
require 'sinatra/base'

# Main file for vidmuster.com; handles all routes

class App < Sinatra::Base
    set :port, 3032
    set :bind, '127.0.0.1'

    get '/' do
        erb :index
    end

    run!
end

