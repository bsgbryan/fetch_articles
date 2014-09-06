Overview
--------

Initialization
--------------

    request    = require 'request'
    FeedParser = require 'feedparser'
    Iconv      = require('iconv').Iconv
    q          = require 'q'
    user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36'
    accept     = 'text/html,application/xhtml+xml'

fetch_articles
--------------

    fetch_articles = (url) ->
      req        = request url.feed
      posts      = [ ]
      deferred   = q.defer()
      feedparser = new FeedParser()

      report = (err) -> deferred.reject context: 'fetch/articles', error: err

      process_response = (res) ->
        stream = this
        iconv
        charset

        if res.statusCode != 200
          deferred.reject context: 'fetch/articles', feed: url.feed, error: res.statusCode

        charset = get_params res.headers['content-type'] || ''
          .charset

        if !iconv && charset && !/utf-*8/i.test charset
          try
            iconv = new Iconv charset, 'utf-8'
            
            iconv.on 'error', report
            
            stream = this.pipe iconv
          catch err
            this.emit 'error', err

        stream.pipe feedparser
      
      process_post = () ->
        while post = this.read()
          data =
            author:    post.author
            published: post.pubDate || post.pubdate || post.date
            url:       post.link
            title:     post.title

          posts.push data
          deferred.notify data

      req.setMaxListeners 50

      req.setHeader 'user-agent', user_agent
      req.setHeader 'accept',     accept

      req.on 'error',    report
      req.on 'response', process_response

      feedparser.on 'error',     report
      feedparser.on 'readable',  process_post
      feedparser.on 'end', () -> deferred.resolve posts

      deferred.promise

get_params
----------

    get_params = (str) ->
      params = str
        .split ';'
        .reduce (params, param) ->
          parts = param
            .split '='
            .map (part) -> part.trim()
          if parts.length == 2
            params[parts[0]] = parts[1]

          params
      params

Public interface
----------------

    module.exports = fetch_articles