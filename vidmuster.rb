#! /usr/bin/env ruby
require 'sinatra/base'
require 'googleajax'

# Main file for vidmuster.com; handles all routes

class App < Sinatra::Base
  set :port, 3032
  set :bind, '127.0.0.1'
  
  get '/' do
    erb :index
  end

  get '/google/:item' do
    GoogleAjax.referer = 'vidmuster.com'
    search = GoogleAjax::Search.web(params[:item])
    results = search[:results]

    display_results = "<p>Web search results for '<b>#{params[:item]}</b>'</p>"

    results.each do |info|
      title = info[:title]
      url = info[:url]
      content = info[:content]

      display_results += "<div class=\"search-item\">"      
      display_results += "<a href=\"#{url}\">#{title}</a>"
      display_results += "<p>#{content}</p>"
      display_results += "</div>"

    end

    display_results

  end
  
  run!
end

