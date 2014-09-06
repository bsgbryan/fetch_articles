// Generated by CoffeeScript 1.7.1
(function() {
  var FeedParser, Iconv, accept, fetch_articles, get_params, q, request, user_agent;

  request = require('request');

  FeedParser = require('feedparser');

  Iconv = require('iconv').Iconv;

  q = require('q');

  user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36';

  accept = 'text/html,application/xhtml+xml';

  fetch_articles = function(url) {
    var deferred, feedparser, posts, process_post, process_response, report, req;
    req = request(url.feed);
    posts = [];
    deferred = q.defer();
    feedparser = new FeedParser();
    report = function(err) {
      return deferred.reject({
        context: 'fetch/articles',
        error: err
      });
    };
    process_response = function(res) {
      var charset, err, iconv, stream;
      stream = this;
      iconv;
      charset;
      if (res.statusCode !== 200) {
        deferred.reject({
          context: 'fetch/articles',
          feed: url.feed,
          error: res.statusCode
        });
      }
      charset = get_params(res.headers['content-type'] || '').charset;
      if (!iconv && charset && !/utf-*8/i.test(charset)) {
        try {
          iconv = new Iconv(charset, 'utf-8');
          iconv.on('error', report);
          stream = this.pipe(iconv);
        } catch (_error) {
          err = _error;
          this.emit('error', err);
        }
      }
      return stream.pipe(feedparser);
    };
    process_post = function() {
      var data, post, _results;
      _results = [];
      while (post = this.read()) {
        data = {
          author: post.author,
          published: post.pubDate || post.pubdate || post.date,
          url: post.link,
          title: post.title
        };
        posts.push(data);
        _results.push(deferred.notify(data));
      }
      return _results;
    };
    req.setMaxListeners(50);
    req.setHeader('user-agent', user_agent);
    req.setHeader('accept', accept);
    req.on('error', report);
    req.on('response', process_response);
    feedparser.on('error', report);
    feedparser.on('readable', process_post);
    feedparser.on('end', function() {
      return deferred.resolve(posts);
    });
    return deferred.promise;
  };

  get_params = function(str) {
    var params;
    params = str.split(';').reduce(function(params, param) {
      var parts;
      parts = param.split('=').map(function(part) {
        return part.trim();
      });
      if (parts.length === 2) {
        params[parts[0]] = parts[1];
      }
      return params;
    });
    return params;
  };

  module.exports = fetch_articles;

}).call(this);